// Cartão de atividade do perfil nas cores do GitHub (Primer), em versão escura e clara:
// total de contribuições, sequência atual e maior, repos com contribuição no último ano,
// contribuições por ano e linguagens pelo tamanho do código dos repos próprios.
// ponytail: contribuições só por ano, de propósito: mês, dia e hora mostram padrão de trabalho.
// Uso: GITHUB_TOKEN=… USERNAME=… node .github/atividade.mjs [pasta]. Sem token, desenha dados de exemplo e se confere.
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PALETAS = {
  dark: { fundo: '#0d1117', borda: '#30363d', divisoria: '#21262d', texto: '#e6edf3', apagado: '#8b949e', destaque: '#58a6ff', tons: ['#58a6ff', '#1f6feb', '#0d419d', '#30363d'] },
  light: { fundo: '#ffffff', borda: '#d0d7de', divisoria: '#d8dee4', texto: '#1f2328', apagado: '#59636e', destaque: '#0969da', tons: ['#0969da', '#54aeff', '#b6e3ff', '#d0d7de'] }
};
// Notebooks guardam as saídas das células e inflam o tamanho do código.
const FORA = new Set(['Jupyter Notebook']);
const W = 840;
const H = 262;
const FONTE = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => n.toLocaleString('en-US');
const dias = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

async function pedir(token, query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const corpo = await res.json();
  if (!res.ok || corpo.errors) throw new Error(`GraphQL ${res.status}: ${JSON.stringify(corpo.errors ?? corpo)}`);
  return corpo.data.user;
}

// Contagens por dia, da mais antiga a hoje. Hoje ainda sem contribuição não quebra a sequência atual.
export function sequencias(contagens) {
  let maior = 0;
  let corrida = 0;
  for (const n of contagens) {
    corrida = n ? corrida + 1 : 0;
    maior = Math.max(maior, corrida);
  }
  let i = contagens.length - 1;
  if (contagens[i] === 0) i--;
  let atual = 0;
  while (i >= 0 && contagens[i] > 0) { atual++; i--; }
  return { atual, maior };
}

async function buscar(token, login) {
  const { contributionsCollection } = await pedir(token,
    'query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }', { login });
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiro = Math.min(...contributionsCollection.contributionYears);
  const anos = Array.from({ length: Number(hoje.slice(0, 4)) - primeiro + 1 }, (_, i) => primeiro + i);
  // um alias por ano numa consulta só (a API aceita no máximo um ano por contributionsCollection)
  const campos = anos.map((a) => `a${a}: contributionsCollection(from: "${a}-01-01T00:00:00Z", to: "${a}-12-31T23:59:59Z") `
    + '{ contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }');
  // ponytail: os 100 primeiros repos próprios bastam (hoje são menos de 80); paginar se passar disso
  const user = await pedir(token, `query($login: String!) { user(login: $login) { ${campos.join(' ')}
    repositoriesContributedTo(includeUserRepositories: true, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) { nodes { isPrivate languages(first: 10) { edges { size node { name } } } } } } }`, { login });
  // no log do workflow: se os privados somem daqui, o token não alcança os repos privados
  const privados = user.repositories.nodes.filter((r) => r.isPrivate);
  console.log(`repos próprios: ${user.repositories.nodes.length} (${privados.length} privados, ${privados.filter((r) => r.languages.edges.length).length} com linguagem)`);

  const porDia = new Map();
  for (const a of anos) {
    for (const semana of user[`a${a}`].contributionCalendar.weeks) {
      for (const d of semana.contributionDays) if (d.date <= hoje) porDia.set(d.date, d.contributionCount);
    }
  }
  const linguagens = {};
  for (const r of user.repositories.nodes) {
    for (const e of r.languages.edges) {
      if (!FORA.has(e.node.name)) linguagens[e.node.name] = (linguagens[e.node.name] ?? 0) + e.size;
    }
  }
  return {
    porAno: anos.map((ano) => ({ ano, total: user[`a${ano}`].contributionCalendar.totalContributions })),
    ...sequencias([...porDia].sort(([a], [b]) => a.localeCompare(b)).map(([, n]) => n)),
    repos: user.repositoriesContributedTo.totalCount,
    linguagens
  };
}

// As três maiores e o resto em "Other", em porcentagem inteira.
function topLinguagens(linguagens) {
  const ordenadas = Object.entries(linguagens).sort((a, b) => b[1] - a[1]);
  const total = ordenadas.reduce((s, [, n]) => s + n, 0) || 1;
  const top = ordenadas.slice(0, 3).map(([nome, n]) => ({ nome, pct: Math.round((100 * n) / total) }));
  const resto = 100 - top.reduce((s, l) => s + l.pct, 0);
  return resto > 0 ? [...top, { nome: 'Other', pct: resto }] : top;
}

function desenhar({ porAno, atual, maior, repos, linguagens }, p) {
  const metricas = [
    [fmt(porAno.reduce((s, a) => s + a.total, 0)), 'contributions', p.texto],
    [dias(atual), 'current streak', p.destaque],
    [dias(maior), 'longest streak', p.texto],
    [fmt(repos), 'repos contributed · last year', p.texto]
  ].map(([valor, rotulo, cor], i) => {
    const x = 28 + i * ((W - 56) / 4);
    return `<text x="${x}" y="58" class="m" style="fill:${cor}">${valor}</text><text x="${x}" y="80" class="r">${rotulo}</text>`;
  });

  const base = 220;
  const passo = 372 / porAno.length;
  const largura = Math.min(36, passo * 0.55);
  const maximo = Math.max(1, ...porAno.map((a) => a.total));
  const anoAtual = porAno[porAno.length - 1].ano;
  const barras = porAno.map(({ ano, total }, i) => {
    const h = total ? Math.max(2, (total / maximo) * 62) : 0;
    const x = 28 + passo * i + (passo - largura) / 2;
    const cor = ano === anoAtual ? p.destaque : p.tons[1];
    return `<rect class="b" x="${x}" y="${base - h}" width="${largura}" height="${h}" rx="3" style="fill:${cor};animation-delay:${(i * 0.08).toFixed(2)}s"/>`
      + `<text class="n" x="${x + largura / 2}" y="${base - h - 6}" style="animation-delay:${(0.9 + i * 0.08).toFixed(2)}s">${fmt(total)}</text>`
      + `<text class="r" x="${x + largura / 2}" y="${base + 20}" text-anchor="middle">${ano}</text>`;
  });

  const top = topLinguagens(linguagens);
  let acumulado = 0;
  const segmentos = top.map((l, i) => {
    const x = 460 + (352 * acumulado) / 100;
    acumulado += l.pct;
    return `<rect class="s" x="${x}" y="150" width="${(352 * l.pct) / 100}" height="10" style="fill:${p.tons[i]};animation-delay:${(i * 0.15).toFixed(2)}s"/>`;
  });
  const legenda = top.map((l, i) => {
    const x = 460 + (i % 2) * 176;
    const y = 192 + Math.floor(i / 2) * 26;
    return `<circle cx="${x + 5}" cy="${y - 4}" r="5" style="fill:${p.tons[i]}"/>`
      + `<text x="${x + 18}" y="${y}" class="t">${esc(l.nome)} <tspan class="r">${l.pct}%</tspan></text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>
text { font-family: ${FONTE} }
@keyframes crescer { from { transform: scaleY(0) } }
@keyframes abrir { from { transform: scaleX(0) } }
@keyframes aparecer { from { opacity: 0 } }
.m { font-size: 26px; font-weight: 600 }
.r { font-size: 13px; fill: ${p.apagado} }
.t { font-size: 13px; fill: ${p.texto} }
.n { font-size: 12px; fill: ${p.apagado}; text-anchor: middle; animation: aparecer .6s ease both }
.b { transform-box: fill-box; transform-origin: center bottom; animation: crescer 1.2s cubic-bezier(.2,.7,.3,1) both }
.s { transform-box: fill-box; transform-origin: left center; animation: abrir .9s cubic-bezier(.2,.7,.3,1) both }
@media (prefers-reduced-motion: reduce) { * { animation: none !important } }
</style><defs><clipPath id="pilula"><rect x="460" y="150" width="352" height="10" rx="5"/></clipPath></defs>`
    + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" style="fill:${p.fundo};stroke:${p.borda}"/>`
    + metricas.join('')
    + `<line x1="28" x2="${W - 28}" y1="106" y2="106" style="stroke:${p.divisoria}"/>`
    + `<text x="28" y="134" class="r">Contributions per year</text>`
    + barras.join('')
    + `<text x="460" y="134" class="r">Languages</text><text x="812" y="134" class="r" text-anchor="end">code size, notebooks excluded</text>`
    + `<g clip-path="url(#pilula)">${segmentos.join('')}</g>`
    + legenda.join('')
    + '</svg>';
}

const token = process.env.GITHUB_TOKEN;
const dados = token
  ? await buscar(token, process.env.USERNAME)
  : {
      porAno: [{ ano: 2023, total: 120 }, { ano: 2024, total: 0 }, { ano: 2025, total: 900 }],
      atual: 3, maior: 9, repos: 7,
      linguagens: { Python: 500, TypeScript: 300, Go: 120, Rust: 50, Shell: 30 }
    };
if (!token) {
  assert.deepStrictEqual(sequencias([1, 1, 0, 1, 1, 1, 0]), { atual: 3, maior: 3 });
  assert.deepStrictEqual(sequencias([2, 0, 1, 1]), { atual: 2, maior: 2 });
  assert.deepStrictEqual(sequencias([0, 0]), { atual: 0, maior: 0 });
  assert.strictEqual(topLinguagens(dados.linguagens).reduce((s, l) => s + l.pct, 0), 100);
}
const pasta = process.argv[2] ?? '.';
for (const [tema, paleta] of Object.entries(PALETAS)) {
  const svg = desenhar(dados, paleta);
  if (!token) assert(dados.porAno.every((a) => svg.includes(`>${a.ano}<`)));
  writeFileSync(join(pasta, `atividade-${tema}.svg`), svg);
}
const { linguagens, ...resumo } = dados;
console.log(JSON.stringify({ ...resumo, linguagens: topLinguagens(linguagens) }));

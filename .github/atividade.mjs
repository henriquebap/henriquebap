// Cartão de atividade do perfil nas cores do GitHub (Primer), em versão escura e clara:
// país e data de entrada, total de contribuições, sequência atual e maior, repos trabalhados (no total e no
// último ano), contribuições por ano e linguagens pelo tamanho do código dos repos próprios.
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
const TOPO = 34; // faixa do país e da data de entrada
const H = 262 + TOPO;
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
  return corpo.data;
}

// Com token pessoal, os repos privados só aparecem pelo viewer: user(login).repositories devolve só os públicos.
// Token de outro dono (o GITHUB_TOKEN do workflow) cai no user(login), só com os públicos.
// ponytail: os 100 primeiros repos próprios bastam (hoje são menos de 80); paginar se passar disso
async function reposProprios(token, login) {
  const campos = 'repositories(first: 100, ownerAffiliations: OWNER, isFork: false) { nodes { nameWithOwner isPrivate languages(first: 10) { edges { size node { name } } } } }';
  const viewer = await pedir(token, `{ viewer { login ${campos} } }`)
    .then((d) => d.viewer)
    .catch((e) => { console.log(`viewer indisponível, só repos públicos: ${e.message.slice(0, 120)}`); return null; });
  const nodes = viewer?.login === login
    ? viewer.repositories.nodes
    : (await pedir(token, `query($login: String!) { user(login: $login) { ${campos} } }`, { login })).user.repositories.nodes;
  const privados = nodes.filter((r) => r.isPrivate).length;
  console.log(`linguagens de ${nodes.length} repos próprios (${privados} privados)`);
  return nodes;
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
  const { contributionsCollection } = (await pedir(token,
    'query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }', { login })).user;
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiro = Math.min(...contributionsCollection.contributionYears);
  const anos = Array.from({ length: Number(hoje.slice(0, 4)) - primeiro + 1 }, (_, i) => primeiro + i);
  // um alias por ano numa consulta só (a API aceita no máximo um ano por contributionsCollection)
  // ponytail: 100 repos por tipo de contribuição por ano bastam; subir maxRepositories se um ano passar disso
  const repo = 'repository { nameWithOwner }';
  const campos = anos.map((a) => `a${a}: contributionsCollection(from: "${a}-01-01T00:00:00Z", to: "${a}-12-31T23:59:59Z") `
    + '{ contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } '
    + `commitContributionsByRepository(maxRepositories: 100) { ${repo} } pullRequestContributionsByRepository(maxRepositories: 100) { ${repo} } `
    + `issueContributionsByRepository(maxRepositories: 100) { ${repo} } repositoryContributions(first: 100) { nodes { ${repo} } } }`);
  const { user } = await pedir(token, `query($login: String!) { user(login: $login) { createdAt location ${campos.join(' ')}
    repositoriesContributedTo(includeUserRepositories: true, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) { totalCount } } }`, { login });
  const repos = await reposProprios(token, login);

  const porDia = new Map();
  for (const a of anos) {
    for (const semana of user[`a${a}`].contributionCalendar.weeks) {
      for (const d of semana.contributionDays) if (d.date <= hoje) porDia.set(d.date, d.contributionCount);
    }
  }
  // repos trabalhados: os próprios (sem fork) mais todo repo com commit, PR, issue ou criação, forks incluídos
  const trabalhados = new Set(repos.map((r) => r.nameWithOwner));
  for (const a of anos) {
    const c = user[`a${a}`];
    for (const lista of [c.commitContributionsByRepository, c.pullRequestContributionsByRepository, c.issueContributionsByRepository]) {
      for (const x of lista) trabalhados.add(x.repository.nameWithOwner);
    }
    for (const n of c.repositoryContributions.nodes) trabalhados.add(n.repository.nameWithOwner);
  }
  const linguagens = {};
  for (const r of repos) {
    for (const e of r.languages.edges) {
      if (!FORA.has(e.node.name)) linguagens[e.node.name] = (linguagens[e.node.name] ?? 0) + e.size;
    }
  }
  return {
    porAno: anos.map((ano) => ({ ano, total: user[`a${ano}`].contributionCalendar.totalContributions })),
    ...sequencias([...porDia].sort(([a], [b]) => a.localeCompare(b)).map(([, n]) => n)),
    reposTotal: trabalhados.size,
    reposAno: user.repositoriesContributedTo.totalCount,
    desde: new Date(user.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
    local: user.location,
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

const ICONES = {
  local: '<path d="M8 14.5S3 10.2 3 6.4a5 5 0 0 1 10 0c0 3.8-5 8.1-5 8.1z"/><circle cx="8" cy="6.4" r="1.8"/>',
  desde: '<rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/>'
};

function desenhar({ porAno, atual, maior, reposTotal, reposAno, desde, local, linguagens }, p) {
  // ponytail: largura do texto estimada em 7px por letra (13px); só decide onde começa o próximo ícone
  let cursor = 28;
  const topo = [local && ['local', local], ['desde', `On GitHub since ${desde}`]].filter(Boolean).map(([icone, texto]) => {
    const x = cursor;
    cursor += 22 + texto.length * 7 + 18;
    return `<g transform="translate(${x} 22)" style="fill:none;stroke:${p.apagado};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round">${ICONES[icone]}</g>`
      + `<text x="${x + 22}" y="35" class="r">${esc(texto)}</text>`;
  });

  const metricas = [
    [fmt(porAno.reduce((s, a) => s + a.total, 0)), 'contributions', p.texto],
    [dias(atual), 'current streak', p.destaque],
    [dias(maior), 'longest streak', p.texto],
    [fmt(reposTotal), 'repos worked on', p.texto],
    [fmt(reposAno), 'repos · last year', p.texto]
  ].map(([valor, rotulo, cor], i) => {
    const x = 28 + i * ((W - 56) / 5);
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
    + topo.join('') + `<g transform="translate(0 ${TOPO})">`
    + metricas.join('')
    + `<line x1="28" x2="${W - 28}" y1="106" y2="106" style="stroke:${p.divisoria}"/>`
    + `<text x="28" y="134" class="r">Contributions per year</text>`
    + barras.join('')
    + `<text x="460" y="134" class="r">Languages</text><text x="812" y="134" class="r" text-anchor="end">code size, notebooks excluded</text>`
    + `<g clip-path="url(#pilula)">${segmentos.join('')}</g>`
    + legenda.join('')
    + '</g></svg>';
}

const token = process.env.GITHUB_TOKEN;
const dados = token
  ? await buscar(token, process.env.USERNAME)
  : {
      porAno: [{ ano: 2023, total: 120 }, { ano: 2024, total: 0 }, { ano: 2025, total: 900 }],
      atual: 3, maior: 9, reposTotal: 40, reposAno: 7, desde: 'Mar 2019', local: 'Earth',
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
  if (!token) assert(dados.porAno.every((a) => svg.includes(`>${a.ano}<`)) && svg.includes('>On GitHub since Mar 2019<') && svg.includes('>40<'));
  writeFileSync(join(pasta, `atividade-${tema}.svg`), svg);
}
const { linguagens, ...resumo } = dados;
console.log(JSON.stringify({ ...resumo, linguagens: topLinguagens(linguagens) }));

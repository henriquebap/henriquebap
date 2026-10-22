// Contribuições por ano, do primeiro ano com atividade até hoje, num SVG no visual dos cartões tokyonight.
// ponytail: só por ano, de propósito: mês, dia e hora mostram padrão de trabalho, e o perfil não precisa disso.
// Uso: GITHUB_TOKEN=… USERNAME=… node .github/anos.mjs [saida.svg]. Sem token, desenha dados de exemplo e se confere.
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';

const W = 700;
const H = 200;
const AREA = { x: 40, y: 72, w: W - 80, h: 88 };

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

async function totaisPorAno(token, login) {
  const { contributionsCollection } = await pedir(token,
    'query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }', { login });
  const primeiro = Math.min(...contributionsCollection.contributionYears);
  const anos = Array.from({ length: new Date().getUTCFullYear() - primeiro + 1 }, (_, i) => primeiro + i);
  // um alias por ano numa consulta só (a API aceita no máximo um ano por contributionsCollection)
  const campos = anos.map((a) =>
    `a${a}: contributionsCollection(from: "${a}-01-01T00:00:00Z", to: "${a}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`);
  const user = await pedir(token, `query($login: String!) { user(login: $login) { ${campos.join(' ')} } }`, { login });
  return anos.map((ano) => ({ ano, total: user[`a${ano}`].contributionCalendar.totalContributions }));
}

function desenhar(totais) {
  const maximo = Math.max(1, ...totais.map((t) => t.total));
  const soma = totais.reduce((s, t) => s + t.total, 0);
  const passo = AREA.w / totais.length;
  const largura = Math.min(56, passo * 0.6);
  const base = AREA.y + AREA.h;
  const barras = totais.map(({ ano, total }, i) => {
    const h = total ? Math.max(2, (total / maximo) * AREA.h) : 0;
    const x = AREA.x + passo * i + (passo - largura) / 2;
    const meio = x + largura / 2;
    return `<rect class="barra" x="${x}" y="${base - h}" width="${largura}" height="${h}" rx="4" style="animation-delay:${(i * 0.12).toFixed(2)}s"/>`
      + `<text class="num" x="${meio}" y="${base - h - 8}" style="animation-delay:${(1 + i * 0.12).toFixed(2)}s">${total.toLocaleString('en-US')}</text>`
      + `<text class="ano" x="${meio}" y="${base + 22}">${ano}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>
* { font-family: 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif }
@keyframes crescer { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes aparecer { from { opacity: 0 } to { opacity: 1 } }
.barra { fill: #bf91f3; transform-box: fill-box; transform-origin: center bottom; animation: crescer 1.6s cubic-bezier(.2,.7,.3,1) both }
.num { fill: #a9b1d6; font-size: 13px; text-anchor: middle; animation: aparecer .8s ease both }
.ano { fill: #38bdae; font-size: 14px; text-anchor: middle }
@media (prefers-reduced-motion: reduce) { * { animation: none !important } }
</style><rect x="1" y="1" rx="5" width="${W - 2}" height="${H - 2}" fill="#1a1b27"/>`
    + `<text x="30" y="40" style="font-size:22px;fill:#70a5fd">Contributions per year</text>`
    + `<text x="${W - 30}" y="40" style="font-size:14px;fill:#38bdae;text-anchor:end">${soma.toLocaleString('en-US')} since ${totais[0].ano}</text>`
    + `<line x1="${AREA.x}" x2="${AREA.x + AREA.w}" y1="${base}" y2="${base}" stroke="#2a2e45"/>`
    + barras.join('') + '</svg>';
}

const token = process.env.GITHUB_TOKEN;
const totais = token
  ? await totaisPorAno(token, process.env.USERNAME)
  : [{ ano: 2021, total: 40 }, { ano: 2022, total: 0 }, { ano: 2023, total: 300 }, { ano: 2024, total: 1200 }];
const svg = desenhar(totais);
if (!token) assert(totais.every((t) => svg.includes(`>${t.ano}<`) && svg.includes(`>${t.total.toLocaleString('en-US')}<`)));
writeFileSync(process.argv[2] ?? 'anos.svg', svg);
console.log(totais.map((t) => `${t.ano}: ${t.total}`).join(' · '));

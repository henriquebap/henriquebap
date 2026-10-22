// Gera os SVGs estáticos do perfil (cabeçalho e botões), versão escura e clara.
// Uso: node .github/marca.mjs assets. Rótulo novo de botão: medir a largura e pôr em LARGURA.
import { writeFileSync } from 'node:fs';
const [, , pasta] = process.argv;
const FONTE = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`;
const T = {
  dark: { nome: '#f0f6fc', apagado: '#9198a1', destaque: '#58a6ff', sep: '#3d444d', fundo: '#212830', borda: '#3d444d', texto: '#f0f6fc', icone: '#9198a1' },
  light: { nome: '#1f2328', apagado: '#59636e', destaque: '#0969da', sep: '#d1d9e0', fundo: '#f6f8fa', borda: '#d1d9e0', texto: '#25292e', icone: '#59636e' }
};
const cabecalho = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="124" viewBox="0 0 840 124"><style>
text { font-family: ${FONTE} }
@keyframes subir { from { opacity: 0; transform: translateY(8px) } }
@keyframes tracar { to { stroke-dashoffset: 0 } }
.nome { font-size: 44px; font-weight: 600; letter-spacing: -.8px; fill: ${t.nome}; animation: subir .8s cubic-bezier(.2,.7,.3,1) both }
.traco { stroke: ${t.destaque}; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 76; stroke-dashoffset: 76; animation: tracar .8s .45s cubic-bezier(.4,0,.2,1) forwards }
.cargo { animation: subir .8s .7s cubic-bezier(.2,.7,.3,1) both }
@media (prefers-reduced-motion: reduce) { * { animation: none !important } .traco { stroke-dashoffset: 0 } }
</style><text class="nome" x="0" y="50">Henrique Baptista</text>
<line class="traco" x1="3" y1="72" x2="77" y2="72"/>
<text class="cargo" x="0" y="108"><tspan style="font-size:20px;fill:${t.apagado}">AI Engineer</tspan><tspan dx="12" style="font-size:20px;fill:${t.sep}">/</tspan><tspan dx="12" style="font-family:${MONO};font-size:15px;fill:${t.destaque}">LLM-as-Judge · Evals · ASR · Product Engineer</tspan></text></svg>`;
const ICONES = {
  site: '<circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="2.8" ry="6.5"/><path d="M1.5 8h13"/>',
  linkedin: '<rect x="1.5" y="1.5" width="13" height="13" rx="2.5"/><path d="M5 7.2v4.3M5 4.7v.1M8 11.5V7.2m0 2.3c0-1.6 3.4-2.3 3.4.4v1.6"/>',
  email: '<rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M2 4.2l6 4.8 6-4.8"/>'
};
// LARGURA: texto medido no Chrome (500 14px, fonte do sistema). textLength segura o encaixe
// quando outra fonte (Segoe UI, Noto Sans) sai um pouco mais larga ou mais estreita.
const LARGURA = { 'henriquebap.com': 116, LinkedIn: 56, Email: 36, 'Open to AI Engineer roles': 168 };
const botao = (t, rotulo, icone, destaque = false) => {
  const texto = LARGURA[rotulo];
  const w = 38 + texto + 14;
  const cor = destaque ? t.destaque : t.texto;
  const simbolo = icone
    ? `<g transform="translate(14 9)" style="fill:none;stroke:${t.icone};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round">${ICONES[icone]}</g>`
    : `<circle cx="22" cy="17" r="4" style="fill:${t.destaque}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="34" viewBox="0 0 ${w} 34">`
    + `<rect x=".5" y=".5" width="${w - 1}" height="33" rx="6" style="fill:${destaque ? 'none' : t.fundo};stroke:${destaque ? t.destaque : t.borda}"/>`
    + simbolo
    + `<text x="38" y="21.5" textLength="${texto}" lengthAdjust="spacing" style="font-family:${FONTE};font-size:14px;font-weight:500;fill:${cor}">${rotulo}</text></svg>`;
};
for (const [tema, t] of Object.entries(T)) {
  writeFileSync(`${pasta}/header-${tema}.svg`, cabecalho(t));
  writeFileSync(`${pasta}/btn-site-${tema}.svg`, botao(t, 'henriquebap.com', 'site'));
  writeFileSync(`${pasta}/btn-linkedin-${tema}.svg`, botao(t, 'LinkedIn', 'linkedin'));
  writeFileSync(`${pasta}/btn-email-${tema}.svg`, botao(t, 'Email', 'email'));
  writeFileSync(`${pasta}/btn-open-${tema}.svg`, botao(t, 'Open to AI Engineer roles', null, true));
}

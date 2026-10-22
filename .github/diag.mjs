// Diagnóstico temporário do PROFILE_TOKEN: só o tipo, os escopos e a validade (o log é público).
const t = process.env.GITHUB_TOKEN ?? '';
const tipo = t.startsWith('github_pat_') ? 'fine-grained' : t.startsWith('ghp_') ? 'clássico' : t.startsWith('gho_') ? 'OAuth (gh CLI)' : 'outro';
const r = await fetch('https://api.github.com/user/repos?visibility=private&per_page=1', { headers: { Authorization: `bearer ${t}` } });
console.log('tipo:', tipo, '| escopos (clássico):', r.headers.get('x-oauth-scopes') ?? '-', '| validade:', r.headers.get('github-authentication-token-expiration') ?? '-', '| /user/repos privados:', r.status, (await r.json()).length);

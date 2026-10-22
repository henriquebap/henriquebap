// Diagnóstico temporário do PROFILE_TOKEN: imprime só contagens, códigos HTTP e tipos de erro (o log é público).
const h = { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' };
const rest = async (p) => {
  const r = await fetch(`https://api.github.com${p}`, { headers: h });
  return { status: r.status, pede: r.headers.get('x-accepted-github-permissions'), corpo: r.ok ? await r.json() : null };
};
const gql = async (query) => (await fetch('https://api.github.com/graphql', { method: 'POST', headers: h, body: JSON.stringify({ query }) })).json();

const todos = await rest('/user/repos?affiliation=owner&visibility=all&per_page=100');
console.log('REST /user/repos:', todos.status, '| repos:', todos.corpo?.length, '| privados:', todos.corpo?.filter((r) => r.private).length);
const priv = todos.corpo?.find((r) => r.private);
if (priv) {
  const l = await rest(`/repos/${priv.full_name}/languages`);
  console.log('REST languages de um privado:', l.status, '| permissão pedida:', l.pede, '| linguagens:', Object.keys(l.corpo ?? {}).length);
  const g = await gql(`{ repository(owner: "${priv.owner.login}", name: "${priv.name}") { isPrivate languages(first: 5) { totalCount } } }`);
  console.log('GraphQL repository privado:', JSON.stringify(g.data?.repository ?? g.errors?.map((e) => e.type)));
}
const v = await gql('{ viewer { privados: repositories(privacy: PRIVATE, ownerAffiliations: OWNER) { totalCount } todos: repositories(ownerAffiliations: OWNER) { totalCount } } }');
console.log('GraphQL viewer:', JSON.stringify(v.data?.viewer ?? v.errors?.map((e) => e.type)));

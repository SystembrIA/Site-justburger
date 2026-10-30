// Gera o site estático a partir de dados.mjs. Uso: node build.mjs
// Saída em ./publico (é essa pasta que vai para o servidor/domínio).
// Além do HTML, cada página ganha uma versão em Markdown (index.md) e o site ganha
// llms.txt, llms-full.txt e dados.json — formatos que assistentes de IA e agentes leem melhor.
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, diferenciais, lojas, cardapio as cardapioDados, perfis, faq, midia, culinarias } from './dados.mjs';
import { receitaDe } from './proteina.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(RAIZ, 'publico');
const HOJE = new Date().toISOString().slice(0, 10);

const DIAS = { Mo: 'Segunda', Tu: 'Terça', We: 'Quarta', Th: 'Quinta', Fr: 'Sexta', Sa: 'Sábado', Su: 'Domingo' };
const DIAS_SCHEMA = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };

// Robôs de busca e de IA liberados explicitamente quando o site estiver publicado.
const ROBOS_IA = [
  'Googlebot', 'Bingbot', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended',
];

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const abs = (caminho) => site.url + '/' + caminho;
const pendente = (v) => !v || String(v).includes('PREENCHER');
const listaCidades = 'São Paulo, Guarulhos e São Bernardo do Campo';
const juntar = (lista) => (lista.length > 1 ? `${lista.slice(0, -1).join(', ')} e ${lista.at(-1)}` : lista.join(''));

// Horário curto para o cartão da loja: dias em sequência viram faixa ("Dom a qui · 11h às 23h").
const SEMANA = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CURTO = { Su: 'Dom', Mo: 'Seg', Tu: 'Ter', We: 'Qua', Th: 'Qui', Fr: 'Sex', Sa: 'Sáb' };
const hora = (t) => (t === '00:00' ? 'meia-noite' : t.endsWith(':00') ? `${+t.slice(0, 2)}h` : `${+t.slice(0, 2)}h${t.slice(3)}`);
function textoHorarioCurto(h) {
  const faixa = `${hora(h.abre)} ${h.fecha === '00:00' ? 'à' : 'às'} ${hora(h.fecha)}`;
  if (h.dias.length === 7) return `Todos os dias · ${faixa}`;
  const LONGO = { Su: 'domingo', Mo: 'segunda', Tu: 'terça', We: 'quarta', Th: 'quinta', Fr: 'sexta', Sa: 'sábado' };
  if (h.dias.length === 6) return `Todos os dias, exceto ${LONGO[SEMANA.find((d) => !h.dias.includes(d))]} · ${faixa}`;
  const tem = SEMANA.map((d) => h.dias.includes(d));
  // começo de uma sequência (semana circular), procurando a partir de segunda
  const ini = [1, 2, 3, 4, 5, 6, 0].find((i) => tem[i] && !tem[(i + 6) % 7]);
  const faixas = [];
  for (let k = 0, i = ini; k < 7; k++, i = (i + 1) % 7) {
    if (!tem[i]) continue;
    if (faixas.length && faixas.at(-1).fim === (i + 6) % 7) faixas.at(-1).fim = i; else faixas.push({ ini: i, fim: i });
  }
  const nomes = faixas.map(({ ini: a, fim: b }) => (a === b ? CURTO[SEMANA[a]].toLowerCase() : (b - a + 7) % 7 === 1 ? `${CURTO[SEMANA[a]].toLowerCase()} e ${CURTO[SEMANA[b]].toLowerCase()}` : `${CURTO[SEMANA[a]].toLowerCase()} a ${CURTO[SEMANA[b]].toLowerCase()}`));
  const dias = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}` : nomes[0];
  return `${dias.charAt(0).toUpperCase()}${dias.slice(1)} · ${faixa}`;
}
function textoHorario(h) {
  const dias = h.dias.length === 7 ? 'Todos os dias' : h.dias.map((d) => DIAS[d]).join(', ');
  return h.fecha === '00:00' ? `${dias}, das ${h.abre} até meia-noite` : `${dias}, das ${h.abre} às ${h.fecha}`;
}

// Cardápio real do iFood (importar-cardapio.py) tem prioridade sobre o de dados.mjs.
const ARQ_IFOOD = join(RAIZ, 'cardapio-ifood.json');
const doIfood = existsSync(ARQ_IFOOD) ? JSON.parse(readFileSync(ARQ_IFOOD, 'utf8')) : null;
const reais = (v) => (v ? v.toFixed(2).replace('.', ',') : '');
// O cardápio do iFood tem categorias de promoção que repetem itens ("Queridinhos ... 15% Off"), versões
// "Hits" do mesmo lanche e selos no nome ("Top 1 mais vendido"). Para o site: sem repetição, nome limpo,
// selo separado e sem preço/desconto no nome da categoria (oferta é no iFood).
const semAcentoMin = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const limpaCategoria = (n) => n.replace(/\s*-?\s*\d+\s*%\s*off.*$/i, '').split(/\s+-\s+/)[0].trim();
const limpaDescricao = (d) =>
  (d || '')
    .replace(/\s*n[ãa]o (fazemos|removemos)[^.\n]*[.!]?/gi, '')
    .replace(/\s*prote[ií]na\s*\((estimativa|aproximada)\)[\s\S]*$/i, '')
    .split(/\n+/).map((l) => l.trim().replace(/[,;]$/, '')).filter(Boolean)
    .join(', ').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').replace(/^combo,\s*/i, '').replace(/[,.\s]+$/, '');
// Bloco "Proteína (aproximada) por lanche:" que a Just põe na descrição do iFood:
// linhas "28g  Carne 150g" e uma linha "Total". Vira a tabela do site. Sem o bloco no iFood,
// usa a conta de proteina.mjs (médias da Just) para os lanches.
const comEspaco = (t) => t.replace(/(\d)\s*g\b/gi, '$1 g').trim();
function proteinaDe(texto) {
  const m = (texto || '').match(/prote[ií]na[^\n:]*?por ([^\n:]+):\s*\n([\s\S]*?)(?:\n\s*\n|n[ãa]o (?:fazemos|removemos)|$)/i);
  if (!m) return null;
  const linhas = m[2].split('\n').map((l) => l.trim().match(/^~?\s*(\d+(?:[.,]\d+)?)\s*g\s+(.+)$/i)).filter(Boolean)
    .map(([, g, nome]) => ({ g: `${g} g`, nome: comEspaco(nome) }));
  const total = linhas.find((l) => /^total$/i.test(l.nome));
  return total ? { por: m[1].trim().toLowerCase(), total: total.g, linhas: linhas.filter((l) => l !== total) } : null;
}
function proteinaReceita(nome, descricao) {
  const r = receitaDe(nome, descricao);
  return r && { por: r.por, total: `${r.total} g`, linhas: r.linhas.map((l) => ({ g: `${l.g} g`, nome: comEspaco(l.nome) })) };
}
function limpaItem(i) {
  const bruto = i.nome.replace(/\s*-?\s*(hits|queridinhos)\s*$/i, '').replace(/\s+/g, ' ').trim();
  const [nome, ...resto] = bruto.split(/\s+-\s+/);
  let detalhe = resto.join(' - ').replace(/!/g, '').trim();
  const selo = (detalhe.match(/top\s*\d+\s*mais vendido/i) || [''])[0];
  if (selo) detalhe = detalhe.replace(selo, '').replace(/^[-\s]+|[-\s]+$/g, '');
  detalhe = detalhe.charAt(0).toUpperCase() + detalhe.slice(1);
  return { id: i.id, nome: nome.trim(), detalhe, selo: selo && selo.replace(/^top\s*(\d+)/i, 'Top $1'), descricao: limpaDescricao(i.descricao), proteina: proteinaDe(i.descricao) || proteinaReceita(nome, i.descricao), preco: reais(i.preco) };
}
function cardapioDoIfood(dados) {
  const vistos = new Map();
  const categorias = [];
  for (const c of dados.categorias) {
    if (/queridinhos/i.test(c.categoria)) continue;
    if ((site.cardapioOcultar || []).some((o) => semAcentoMin(limpaCategoria(c.categoria)) === semAcentoMin(o))) continue;
    const soEstes = Object.entries(site.cardapioSoEstes || {}).find(([cat]) => semAcentoMin(limpaCategoria(c.categoria)) === semAcentoMin(cat));
    const itensCat = [];
    for (const bruto of c.itens) {
      const i = limpaItem(bruto);
      if (soEstes && !soEstes[1].some((t) => semAcentoMin(i.nome).includes(semAcentoMin(t)))) continue;
      const chave = semAcentoMin(`${i.nome} ${i.detalhe}`);
      const ja = vistos.get(chave);
      if (ja) {
        if (/-hits$/.test(ja.item.id) && !/-hits$/.test(i.id)) Object.assign(ja.item, i); // fica o id sem "hits"
        continue;
      }
      vistos.set(chave, { item: i });
      itensCat.push(i);
    }
    if (itensCat.length) categorias.push({ categoria: limpaCategoria(c.categoria), itens: itensCat });
  }
  return categorias;
}
const cardapio = doIfood ? cardapioDoIfood(doIfood) : cardapioDados;

// Bairros dentro do raio de entrega (bairros.json, gerado a partir do OpenStreetMap e do GeoSampa).
const ARQ_BAIRROS = join(RAIZ, 'bairros.json');
const geo = existsSync(ARQ_BAIRROS) ? JSON.parse(readFileSync(ARQ_BAIRROS, 'utf8')) : null;
const bairros = geo ? geo.bairros : [];
const bairroPorSlug = new Map(bairros.map((b) => [b.slug, b]));
const bairrosDaLoja = (l) => bairros.filter((b) => b.loja === l.slug);
// Link do Google Maps pelo endereço da loja (o mesmo do CNPJ e do site).
for (const l of lojas) if (!pendente(l.endereco)) l.googleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Just Burger, ${l.endereco}, ${l.cidade} - SP`)}`;
if (geo) for (const l of lojas) l.bairrosAtendidos = bairrosDaLoja(l).slice(0, 8).map((b) => b.nome);
// Nomes que a vizinhança usa para o bairro da loja entram na página do distrito oficial dela.
for (const l of lojas) {
  const b = bairros.find((x) => x.tipo === 'distrito' && x.nome === l.distritoOficial);
  if (b) b.variacoes = [...new Set([l.bairro, ...(l.outrosNomes || []), ...b.variacoes])];
}

// "na Penha", "no Tatuapé", "em Itaquera": artigo pelo começo do nome; o resto usa "em".
const COM_NA = /^(Vila|Penha|Mooca|Lapa|Freguesia|Ponte|Casa|Barra|Brasilândia|Cidade|Água|Bela|Liberdade|Consolação|Sé|Saúde|Pedreira|Aclimação|República|Chácara|Fazenda|Estância)\b/;
const COM_NO = /^(Jardim|Parque|Tatuapé|Ipiranga|Cangaíba|Limão|Belém|Brás|Carrão|Jaçanã|Tucuruvi|Mandaqui|Jaraguá|Sacomã|Cursino|Pari|Bom|Alto|Sítio|Conjunto|Núcleo|Baeta|Rudge|Centro|Bairro|Taboão|Butantã|Jaguaré|Rio|Cambuci|Morumbi|Jabaquara|Socorro|Tremembé|Jaguara|Riacho|Itaim|Mandaqui|Recanto|Residencial|Condomínio)\b/;
const prep = (nome) => (COM_NA.test(nome) ? 'na' : COM_NO.test(nome) ? 'no' : 'em');
const prepDe = (nome) => ({ na: 'da', no: 'do', em: 'de' })[prep(nome)];
const lojaPorSlug = (slug) => lojas.find((l) => l.slug === slug);
const localBairro = (b) => (b.tipo === 'cidade' ? b.cidade : b.tipo === 'distrito' ? `${b.zona} de São Paulo` : b.cidade);
const kmTxt = (v) => String(v).replace('.', ',');
const rumo = (d) => (d === 'norte' || d === 'sul' ? `ao ${d}` : `a ${d}`);

const itens = new Map(cardapio.flatMap((c) => c.itens.map((i) => [i.id, { ...i, categoria: c.categoria }])));
// Produto de perfil que não está no cardápio atual (saiu do iFood ou mudou de nome) é pulado e avisado no fim do build.
const naoEncontrados = new Set();
// Com o cardápio do iFood, o id vira o nome inteiro ("double-smash-2-hamburguer-de-150-gr"):
// aceita o id exato ou o primeiro item cujo id começa com ele.
const acha = (id) => itens.get(id) || [...itens.values()].find((i) => i.id.startsWith(`${id}-`));
const produtosDe = (p) => p.produtos.map((id) => acha(id) || (naoEncontrados.add(`${p.slug}: ${id}`), null)).filter(Boolean);
const destaquesHome = () => (produtosDe(perfis[0]).length ? produtosDe(perfis[0]) : [...itens.values()].filter((i) => foto(i.id)).slice(0, 3));
// Fotos próprias da Just (assets/img/proprias/<começo do id>.webp, -600.webp e -recorte.webp) valem
// mais que as do iFood que o robô baixa todo dia. Original em fotos-proprias/, tratamento em ferramentas/foto-propria.py.
const PASTA_PROPRIAS = join(RAIZ, 'assets/img/proprias');
const proprias = existsSync(PASTA_PROPRIAS)
  ? readdirSync(PASTA_PROPRIAS).filter((f) => f.endsWith('.webp') && !/-(600|recorte)\.webp$/.test(f)).map((f) => f.slice(0, -5))
  : [];
const pastaFoto = (id) => {
  const p = proprias.find((x) => id === x || id.startsWith(`${x}-`));
  return p ? { pasta: 'assets/img/proprias', nome: p } : { pasta: 'assets/img/cardapio', nome: id };
};
const arqFoto = (id, sufixo = '') => { const f = pastaFoto(id); const c = `${f.pasta}/${f.nome}${sufixo}.webp`; return existsSync(join(RAIZ, c)) ? c : null; };
const foto = (id) => arqFoto(id);
const temFoto600 = (id) => !!arqFoto(id, '-600');
const textoPreco = (i) => (site.mostrarPrecos && i.preco ? `R$ ${i.preco}` : 'Preço no iFood');

// ---------- Schema.org (JSON-LD) ----------

const orgId = abs('#organizacao');

function schemaOrganizacao() {
  return {
    '@type': 'Organization',
    '@id': orgId,
    name: site.nome,
    alternateName: site.nomeIfood,
    url: abs(''),
    logo: abs('assets/img/icon-512.png'),
    ...((site.fundacaoData || site.fundacao) && { foundingDate: site.fundacaoData || site.fundacao }),
    ...(!pendente(site.instagram) && { sameAs: [site.instagram] }),
    ...(site.emailContato && { email: site.emailContato }),
    ...(site.telefoneCentral && { telephone: site.telefoneCentral }),
  };
}

function schemaLoja(l) {
  const url = abs(`unidades/${l.slug}/`);
  return {
    '@type': ['Restaurant', 'FastFoodRestaurant'],
    '@id': url + '#restaurante',
    name: l.nome,
    alternateName: site.nomeIfood,
    url,
    image: abs('assets/img/og-just-burger.jpg'),
    servesCuisine: ['Hambúrguer', 'Lanches', 'Saladas'],
    priceRange: site.faixaPreco,
    hasMenu: abs('cardapio/'),
    acceptsReservations: false,
    parentOrganization: { '@id': orgId },
    address: {
      '@type': 'PostalAddress',
      ...(!pendente(l.endereco) && { streetAddress: l.endereco }),
      addressLocality: l.cidade,
      addressRegion: 'SP',
      ...(!pendente(l.cep) && { postalCode: l.cep }),
      addressCountry: 'BR',
    },
    ...(l.geo && { geo: { '@type': 'GeoCoordinates', latitude: l.geo.lat, longitude: l.geo.lng } }),
    ...(l.telefone && { telephone: l.telefone }),
    ...(!pendente(l.googleMaps) && { hasMap: l.googleMaps }),
    ...(!pendente(l.ifood) && {
      sameAs: [l.ifood],
      potentialAction: {
        '@type': 'OrderAction',
        target: { '@type': 'EntryPoint', urlTemplate: l.ifood, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
      },
    }),
    openingHoursSpecification: l.horarios.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dias.map((d) => DIAS_SCHEMA[d]),
      opens: h.abre,
      closes: h.fecha === '00:00' ? '23:59' : h.fecha,
    })),
    areaServed: geo
      ? bairrosDaLoja(l).map((b) => ({ '@type': 'Place', name: b.tipo === 'cidade' ? b.cidade : `${b.nome}, ${b.cidade}`, url: abs(`entrega/${b.slug}/`) }))
      : l.bairrosAtendidos.filter((b) => !pendente(b)).map((b) => ({ '@type': 'Place', name: `${b}, ${l.cidade}` })),
  };
}

function schemaItem(i) {
  const img = foto(i.id);
  return {
    '@type': 'MenuItem',
    '@id': abs(`cardapio/#${i.id}`),
    name: i.nome,
    description: i.descricao,
    url: abs(`cardapio/#${i.id}`),
    ...(img && { image: abs(img) }),
    ...(site.mostrarPrecos && i.preco && { offers: { '@type': 'Offer', price: i.preco.replace(',', '.'), priceCurrency: 'BRL' } }),
  };
}

const schemaBreadcrumb = (lista) => ({
  '@type': 'BreadcrumbList',
  itemListElement: lista.map(([nome, caminho], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: abs(caminho) })),
});

const schemaFaq = (lista) => ({
  '@type': 'FAQPage',
  mainEntity: lista.map((f) => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })),
});

const schemaCardapio = () => ({
  '@type': 'Menu',
  '@id': abs('cardapio/#cardapio'),
  name: `Cardápio ${site.nome}`,
  inLanguage: 'pt-BR',
  hasMenuSection: cardapio.map((c) => ({ '@type': 'MenuSection', name: c.categoria, hasMenuItem: c.itens.map(schemaItem) })),
});

const schemaPerfil = (p) => ({
  '@type': 'WebPage',
  '@id': abs(`para-voce/${p.slug}/#pagina`),
  name: p.nome,
  description: p.resposta,
  inLanguage: 'pt-BR',
  audience: { '@type': 'PeopleAudience', audienceType: p.nome },
  ...(produtosDe(p).length && {
    mainEntity: { '@type': 'ItemList', name: `Recomendações Just Burger: ${p.nome}`, itemListElement: produtosDe(p).map((i, n) => ({ '@type': 'ListItem', position: n + 1, item: schemaItem(i) })) },
  }),
});

// ---------- Layout ----------

function pagina({ caminho, titulo, descricao, corpo, schema = [], profundidade, base = profundidade === 0 ? './' : '../'.repeat(profundidade), markdown = true, noindex = false }) {
  const canonical = abs(caminho);
  const grafo = { '@context': 'https://schema.org', '@graph': [schemaOrganizacao(), ...schema] };
  const nav = [
    ['Cardápio', 'cardapio/'],
    ['O que pedir', 'para-voce/'],
    ['Unidades', 'unidades/'],
    ['Na mídia', 'na-midia/'],
    ['Nossa história', 'sobre/'],
    ['Culinárias', 'culinarias/'],
  ];
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${canonical}">
${markdown ? `<link rel="alternate" type="text/markdown" href="index.md" title="Versão em Markdown para IA">` : ''}
${!site.publicado ? '<meta name="robots" content="noindex, nofollow">' : noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
${site.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}">` : ''}
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(site.nome)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs('assets/img/og-just-burger.jpg')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Dancing+Script:wght@700&display=swap">
<link rel="stylesheet" href="${base}assets/estilo.css">
<script>if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; if (!location.hash) addEventListener('load', function () { scrollTo(0, 0); });</script>
<script type="application/ld+json">${JSON.stringify(grafo)}</script>
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">
  <div class="largura topo-linha">
    <a class="marca" href="${base}" aria-label="${esc(site.nome)} — página inicial">
      <img src="${base}assets/img/logo-320.webp" width="96" height="80" alt="Just Burger Hamburgueria">
    </a>
    <nav class="menu" aria-label="Principal">
      <ul>${nav.map(([n, c]) => `<li><a href="${base}${c}"${caminho.startsWith(c) ? ' aria-current="page"' : ''}>${n}</a></li>`).join('')}</ul>
    </nav>
    ${botaoPedido(base, 'botao botao-topo')}
    <details class="menu-celular">
      <summary aria-label="Abrir menu"><span></span><span></span><span></span></summary>
      <nav aria-label="Menu">
        <ul><li><a href="${base}">Início</a></li>${nav.filter(([, c]) => c !== 'culinarias/').map(([n, c]) => `<li><a href="${base}${c}">${n}</a></li>`).join('')}<li><a href="${base}entrega/">Onde entregamos</a></li>${culinarias.length ? `<li><details class="submenu"><summary>Conheça nossas culinárias</summary><ul>${culinarias.map((c) => { const logo = logoMarca(c); return `<li><a href="${base}culinarias/${c.slug}/">${logo ? `<img src="${base}${logo}" width="36" height="36" alt="">` : `<span class="submenu-marca" aria-hidden="true">${esc(c.nome.split(' ').pop()[0])}</span>`}${esc(c.nome)}</a></li>`; }).join('')}</ul></details></li>` : ''}</ul>
        ${botaoPedido(base)}
      </nav>
    </details>
  </div>
</header>
<main id="conteudo">
${corpo(base)}
</main>
<footer class="rodape">
  <div class="largura rodape-grade">
    <div class="rodape-marca">
      <img src="${base}assets/img/logo-320.webp" width="140" height="117" alt="Just Burger Hamburgueria" loading="lazy">
      <p>Desde ${esc(site.fundacao)} fazendo o seu burger, o melhor burger de São Paulo.</p>
      ${site.telefoneCentral ? `<p><a class="rodape-social rodape-whats" href="${linkWhats}" rel="noopener">WhatsApp e telefone<br><strong>${esc(site.telefoneCentral)}</strong></a></p>` : ''}
      ${redes().length ? `<p class="rodape-siga">Siga a gente</p><p class="rodape-redes">${redes().map(([n, u, i]) => `<a href="${esc(u)}" rel="noopener" aria-label="${n}">${i}</a>`).join('')}</p>` : ''}
    </div>
    <div>
      <h2>Nossas unidades</h2>
      <ul class="rodape-lojas">${lojas.map((l) => `<li><a class="rodape-loja-nome" href="${base}unidades/${l.slug}/">${esc(l.nome.replace('Just Burger ', ''))}</a><a class="rodape-endereco" href="${esc(l.googleMaps)}" rel="noopener">${esc(enderecoCurto(l))}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>Nossas culinárias</h2>
      <ul class="rodape-marcas">${culinarias.map((c) => `<li><a href="${base}culinarias/${c.slug}/">${logoMarca(c) ? `<img src="${base}${logoMarca(c)}" width="32" height="32" alt="" loading="lazy">` : `<span class="submenu-marca" aria-hidden="true">${esc(c.nome.split(' ').pop()[0])}</span>`}<span><strong>${esc(c.nome)}</strong><small>${esc((c.lojas || []).map((x) => x.regiao).join(' · '))}</small></span></a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>Cardápio</h2>
      <ul>
        <li><a href="${base}cardapio/">Cardápio completo</a></li>
        ${perfis.slice(0, 5).map((p) => `<li><a href="${base}para-voce/${p.slug}/">${esc(p.nome)}</a></li>`).join('')}
      </ul>
    </div>
    <div>
      <h2>Just Burger</h2>
      <ul>
        <li><a href="${base}sobre/">Nossa história</a></li>
        <li><a href="${base}na-midia/">Na mídia</a></li>
        ${geo ? `<li><a href="${base}entrega/">Onde entregamos</a></li>` : ''}
        <li><a href="${base}pedir/">Faça seu pedido</a></li>
        <li><a href="${base}culinarias/">Nossas culinárias</a></li>
      </ul>
    </div>
  </div>
  ${blocoInsta()}
  <div class="largura rodape-base">
    <p>© ${new Date().getFullYear()} Just Burger Hamburgueria Ltda · CNPJ 31.394.735/0001-70</p>
    <p>Imagens meramente ilustrativas. Preços e disponibilidade no iFood.</p>
  </div>
</footer>
${janelaPedido(base)}
${site.whatsapp ? `<a class="whats-flutuante" href="${linkWhats}" rel="noopener" aria-label="Falar com a Just Burger no WhatsApp">${iconeWhats}</a>` : ''}
<script src="${base}assets/pedido-dados.js" defer></script>
<script src="${base}assets/pedido.js" defer></script>
</body>
</html>
`;
}

// ---------- Blocos reutilizados ----------

// "Faça seu pedido": abre a janela da busca por CEP (assets/pedido.js). Sem JavaScript, vai para /pedir/.
const RAIO_KM = 10;
const iconePin = '<svg viewBox="0 0 100 94" width="26" height="24" aria-hidden="true"><defs><clipPath id="mapa-dobra"><path d="M6 48L32 38L52 48L72 38L94 46L94 88L72 80L52 90L32 80L6 90Z"/></clipPath></defs><g clip-path="url(#mapa-dobra)"><path d="M6 48L32 38L32 80L6 90Z" fill="#4cd964"/><path d="M32 38L52 48L52 90L32 80Z" fill="#1da1f2"/><path d="M52 48L72 38L72 80L52 90Z" fill="#4cd964"/><path d="M72 38L94 46L94 88L72 80Z" fill="#1da1f2"/><path d="M6 90L6 70L32 60L32 80Z" fill="#8ee6ff"/><path d="M0 64L32 52L52 64L72 54L100 64" fill="none" stroke="#ffc83d" stroke-width="7"/><path d="M38 36L64 96" fill="none" stroke="#ffc83d" stroke-width="7"/></g><path d="M50 66C50 66 25 42 25 27A25 25 0 0 1 75 27C75 42 50 66 50 66Z" fill="#ff4b4b"/><path d="M50 2A25 25 0 0 1 75 27C75 42 50 66 50 66C58 50 66 38 66 27A25 25 0 0 0 50 2Z" fill="#e2363b"/><circle cx="50" cy="27" r="10" fill="#fff"/></svg>';
const iconeInstagram = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><radialGradient id="ig-cor" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285aeb"/></radialGradient></defs><rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#ig-cor)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.3" cy="7.7" r="1.05" fill="#fff"/></svg>';
const iconeFacebook = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>';
const iconeTiktok = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z"/></svg>';
// Redes oficiais (site.instagram / facebook / tiktok): só aparecem as preenchidas.
const redes = () => [['Instagram', site.instagram, iconeInstagram], ['Facebook', site.facebook, iconeFacebook], ['TikTok', site.tiktok, iconeTiktok]].filter(([, u]) => u && !pendente(u));
const blocoInsta = () => `
<div class="largura insta-grade" data-insta hidden></div>
${site.instagramPosts ? `<script>
(function () {
  var g = document.querySelector('[data-insta]'); if (!g || !window.fetch) return;
  var url = ${JSON.stringify(site.instagramPosts)}, base = url.replace(/[^/]*$/, '');
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var p = (d && d.posts || []).slice(0, 4); if (!p.length) return;
    g.innerHTML = p.map(function (x) {
      return '<a class="insta-post" href="' + esc(x.url) + '" rel="noopener"><img src="' + esc(base + x.imagem) + '" width="600" height="600" loading="lazy" alt="' + esc(x.legenda || 'Postagem da Just Burger no Instagram') + '">' + (x.video ? '<span class="insta-video" aria-hidden="true">▶</span>' : '') + '</a>';
    }).join('');
    g.hidden = false;
  }).catch(function () {});
})();
</script>` : ''}`;
const iconeWhats = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5v-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8 0 1.6 1.2 3.2 1.4 3.4.2.2 2.3 3.6 5.7 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.4z"/></svg>';
const linkWhats = site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site da Just Burger.')}` : '';
const botaoPedido = (base, classe = 'botao') => `<a class="${classe}" href="${base}pedir/" data-pedido>Faça seu pedido</a>`;
const buscaCep = (id) => `
<form class="busca-cep" data-busca-cep novalidate>
  <label for="${id}">Digite seu CEP para ver a loja que atende você</label>
  <div class="busca-cep-linha">
    <input id="${id}" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9">
    <button class="botao" type="submit">Buscar</button>
  </div>
  <div class="busca-cep-resultado" aria-live="polite"></div>
</form>`;
const outrasOpcoes = () => site.linktree || linkWhats
  ? `<p class="pedido-outras">${site.linktree ? `<a class="botao botao-contorno" href="${esc(site.linktree)}" rel="noopener">Ver todas as opções</a>` : ''}${linkWhats ? `<a class="link" href="${linkWhats}" rel="noopener">WhatsApp ${esc(site.telefoneCentral)}</a>` : ''}</p>`
  : '';
const janelaPedido = (base) => `
<dialog class="janela janela-pedido" id="janela-pedido" aria-labelledby="pedido-titulo">
  <button type="button" class="janela-fechar" aria-label="Fechar">×</button>
  <div class="janela-texto">
    <p class="sobretitulo">Faça seu pedido</p>
    <h2 id="pedido-titulo">Qual loja atende você?</h2>
    ${buscaCep('cep-janela')}
    ${outrasOpcoes()}
  </div>
</dialog>`;

// Primeiro parágrafo de cada página responde a pergunta dela (é o trecho que buscadores e IA citam).
const respostaRapida = (texto) => `<p class="lead resumo">${esc(texto)}</p>`;

const migalhas = (base, lista) =>
  `<nav class="migalhas" aria-label="Você está em">${lista.map(([n, c], i) => (i === lista.length - 1 ? esc(n) : `<a href="${base}${c}">${esc(n)}</a>`)).join(' / ')}</nav>`;

// Destaque flutuante da home: o recorte (sem fundo) do produto indicado em site.heroi.produto
// (foto própria ou a do iFood tratada pelo robô); senão a imagem manual; senão o logo.
const semAcento = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const itemHeroi = site.heroi && site.heroi.produto
  ? [...itens.values()].find((i) => semAcento(i.nome).includes(semAcento(site.heroi.produto)) && arqFoto(i.id, '-recorte'))
  : null;
const imagemHeroi = itemHeroi
  ? arqFoto(itemHeroi.id, '-recorte')
  : site.heroi && site.heroi.imagem && existsSync(join(RAIZ, site.heroi.imagem)) ? site.heroi.imagem : null;
const temHeroi = !!imagemHeroi;

// Painel de números: base histórica no HTML (aparece mesmo sem JavaScript) e, ao vivo, a soma da
// função contadorSite (site_publico/contador) pelo streaming do Firebase (EventSource, sem SDK).
const fmtInt = (v) => Math.round(v).toLocaleString('pt-BR');
const nota1 = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const slug = (t) => semAcentoMin(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Placar de aeroporto: cada dígito é uma plaquinha que vira. No HTML já vai o número base (Google, IA
// e quem está sem JavaScript leem). Toda vez que aparece na tela, todas as plaquinhas giram e param da
// esquerda para a direita; entre uma e outra, a cada pedido ao vivo, só viram as que mudaram.
const placarHtml = (n, rotulo) => `<div class="placar" role="img" aria-label="${fmtInt(n)} ${esc(rotulo)}" data-valor="${Math.round(n)}">${
  fmtInt(n).split('').map((c) => (c === '.' ? '<span class="ponto">.</span>' : `<span class="flap" data-d="${c}"><span class="metade cima"><span>${c}</span></span><span class="metade baixo"><span>${c}</span></span><span class="aba aba-cima"><span>${c}</span></span><span class="aba aba-baixo"><span>${c}</span></span></span>`)).join('')
}</div>`;
const blocoContador = () => {
  const c = site.contador, n = site.avaliacoes && site.avaliacoes.notaInformada;
  return `
<section class="numeros" id="contador" aria-label="Just Burger em números">
  <p class="largura numeros-vivo" data-vivo hidden><span class="ao-vivo" aria-hidden="true"></span>Contagem ao vivo · atualizado às <span data-hora>--:--</span></p>
  <div class="largura">
    <div class="placar-linha">${placarHtml(c.basePedidos, c.rotuloPedidos)}<p class="numero-rotulo">${esc(c.rotuloPedidos)}</p></div>
    <div class="placar-linha">${placarHtml(c.basePedidos * c.lanchesPorPedido, c.rotuloLanches)}<p class="numero-rotulo">${esc(c.rotuloLanches)}</p></div>
    <div class="numeros-extra">
      ${n ? `<p><span class="numero"><span data-geral-nota>${nota1(n)}</span><span class="estrela" aria-hidden="true">★</span></span><span class="numero-rotulo">no iFood</span></p>${site.avaliacoes.avaliacoesInformadas ? `<p class="numeros-avaliacoes" data-geral-texto>mais de ${Math.floor(site.avaliacoes.avaliacoesInformadas / 1000)} mil avaliações em todas as lojas</p>` : ''}` : ''}
      <p><span class="numero">${lojas.length}</span><span class="numero-rotulo">unidades na Grande São Paulo</span></p>
    </div>
  </div>
</section>
<script>
(function () {
  var C = ${JSON.stringify({ url: c.url, base: c.basePedidos, media: c.lanchesPorPedido })};
  var el = document.getElementById('contador'), placares = el.querySelectorAll('.placar');
  var vivo = el.querySelector('[data-vivo]'), hora = el.querySelector('[data-hora]'), d = {};
  var calmo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pronto = false, girando = false;
  // Som de plaquinha virando: gerado no navegador (ruído curto filtrado), sem arquivo de áudio.
  // O navegador só libera som depois de um toque/clique na página; no celular respeita o modo silencioso.
  var som = { ctx: null, ruido: null, ultimo: 0, liga: true };
  function destrava() {
    var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    if (!som.ctx) {
      som.ctx = new A();
      var b = som.ctx.createBuffer(1, Math.round(som.ctx.sampleRate * 0.035), som.ctx.sampleRate), x = b.getChannelData(0);
      for (var i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 5);
      som.ruido = b;
    }
    if (som.ctx.state === 'suspended') som.ctx.resume();
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, destrava, { passive: true }); });
  function clique(forte) {
    var c = som.ctx, agora = performance.now();
    if (!som.liga || !c || c.state !== 'running' || agora - som.ultimo < 26) return;
    som.ultimo = agora;
    var f = c.createBufferSource(), filtro = c.createBiquadFilter(), g = c.createGain();
    f.buffer = som.ruido; filtro.type = 'bandpass'; filtro.frequency.value = 1700 + Math.random() * 1100; filtro.Q.value = 1.4;
    g.gain.value = forte ? 0.55 : 0.2;
    f.connect(filtro); filtro.connect(g); g.connect(c.destination); f.start();
  }
  function texto(f, sel, v) { f.querySelector(sel + ' span').textContent = v; }
  function vira(f, novo, rapido) {
    var velho = f.dataset.d; if (velho === novo) return;
    texto(f, '.cima', novo); texto(f, '.baixo', velho); texto(f, '.aba-cima', velho); texto(f, '.aba-baixo', novo);
    f.classList.remove('virando', 'rapido'); void f.offsetWidth; f.classList.add('virando'); if (rapido) f.classList.add('rapido');
    f.dataset.d = novo;
    clique(!rapido);
    clearTimeout(f._t); f._t = setTimeout(function () { texto(f, '.baixo', novo); f.classList.remove('virando', 'rapido'); }, rapido ? 130 : 340);
  }
  function mostra(pl, v) {
    var t = Math.round(v).toLocaleString('pt-BR');
    pl.setAttribute('aria-label', t + ' ' + pl.nextElementSibling.textContent);
    var dig = t.replace(/\\D/g, ''), flaps = pl.querySelectorAll('.flap');
    if (flaps.length !== dig.length) { pl.dataset.valor = Math.round(v); return; } // muda de casa: fica para o próximo build
    dig.split('').forEach(function (c, i) { vira(flaps[i], c); });
  }
  // Entrada: todas giram rápido e vão desacelerando; param da esquerda para a direita, o último bem devagar.
  // Cada plaquinha começa num dígito calculado para, contando os passos, parar exatamente no valor certo.
  var DURACAO = 5200;
  function paradaDe(i, n) { return 1300 + (DURACAO - 1300) * Math.pow(n > 1 ? i / (n - 1) : 1, 1.6); }
  function entrada(pl, fim) {
    var flaps = [].slice.call(pl.querySelectorAll('.flap')), alvo = String(fim).split(''), n = flaps.length;
    flaps.forEach(function (f, i) {
      var para = paradaDe(i, n), passos = [], t = 0;
      while (t < para) { passos.push(t); t += 55 + 560 * Math.pow(t / para, 3); }
      var d = (+alvo[i] - passos.length % 10 + 10) % 10;
      vira(f, String(d), true);
      passos.forEach(function (quando, k) {
        setTimeout(function () {
          d = (d + 1) % 10;
          var lento = k > 0 && passos[k] - passos[k - 1] > 150;
          vira(f, String(d), !lento);
        }, quando + 60);
      });
    });
  }
  function valores() {
    return [C.base + (Number(d.pedidos) || 0), (C.base + (Number(d.prontos) || 0)) * C.media];
  }
  // Sem animação: põe o número direto nas plaquinhas (antes de o placar aparecer na tela).
  function poe(pl, v) {
    var t = Math.round(v).toLocaleString('pt-BR'), dig = t.replace(/\\D/g, ''), flaps = pl.querySelectorAll('.flap');
    if (flaps.length !== dig.length) return;
    dig.split('').forEach(function (c, i) { var f = flaps[i]; ['.cima', '.baixo', '.aba-cima', '.aba-baixo'].forEach(function (s) { texto(f, s, c); }); f.dataset.d = c; });
    pl.setAttribute('aria-label', t + ' ' + pl.nextElementSibling.textContent);
  }
  var esperando = false, semDados = false;
  function atualiza() {
    if (!d || !d.atualizadoEm) return;
    hora.textContent = new Date(d.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    vivo.hidden = false;
    var v = valores();
    if (esperando) { esperando = false; comeca(); return; } // o placar já estava na tela esperando o número ao vivo
    if (!pronto) { poe(placares[0], v[0]); poe(placares[1], v[1]); return; }
    if (girando) return;
    mostra(placares[0], v[0]); mostra(placares[1], v[1]);
  }
  // Sem resposta do servidor em 4 s, anima até o número que tiver (a base).
  setTimeout(function () { semDados = true; if (esperando) { esperando = false; comeca(); } }, 4000);
  // Toda vez que o placar entra na tela: todas as plaquinhas giram juntas e param da esquerda para a direita.
  // A animação só começa com o número ao vivo na mão, para já parar no valor atual.
  function comeca() {
    if (girando) return;
    if (!(d && d.atualizadoEm) && !semDados) { esperando = true; return; }
    pronto = true; girando = true;
    setTimeout(function () { girando = false; atualiza(); }, DURACAO + 900);
    var v = valores();
    [0, 1].forEach(function (k) {
      var fim = Math.round(v[k]).toLocaleString('pt-BR').replace(/\\D/g, '');
      placares[k].setAttribute('aria-label', Math.round(v[k]).toLocaleString('pt-BR') + ' ' + placares[k].nextElementSibling.textContent);
      if (calmo || fim.length !== placares[k].querySelectorAll('.flap').length) mostra(placares[k], v[k]); else entrada(placares[k], fim);
    });
  }
  if ('IntersectionObserver' in window && !calmo) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) comeca(); }, { threshold: 0.4 });
    io.observe(el);
  } else pronto = true;
  function evento(e) {
    try {
      var m = JSON.parse(e.data); if (!m) return;
      if (m.path === '/') d = e.type === 'patch' ? Object.assign({}, d, m.data) : (m.data || {});
      else d[m.path.slice(1)] = m.data;
      atualiza();
    } catch (x) {}
  }
  if (window.EventSource) {
    var es = new EventSource(C.url);
    es.addEventListener('put', evento); es.addEventListener('patch', evento);
  } else {
    fetch(C.url).then(function (r) { return r.json(); }).then(function (x) { d = x || {}; atualiza(); }).catch(function () {});
  }
})();
</script>`;
};

// Painel de avaliações do iFood (JSON diário do robô). Sem dado, não aparece.
// Sem schema de nota de propósito: o Google não aceita nota da própria empresa em dados estruturados.
// Avaliações do iFood (JSON diário do robô): troca a nota informada pela do iFood e mostra a quantidade.
// Sem schema de nota de propósito: o Google não aceita nota da própria empresa em dados estruturados.
const blocoAvaliacoes = () => `
<script>
(function () {
  var n1 = function (v) { return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
  var mil = function (v) { return Number(v).toLocaleString('pt-BR'); };
  fetch(${JSON.stringify(site.avaliacoes.url)}).then(function (r) { return r.ok ? r.json() : null; }).then(function (a) {
    if (!a || !a.geral || !a.lojas || !a.lojas.length) return;
    var g = document.querySelector('[data-geral-nota]'); if (g) g.textContent = n1(a.geral.nota);
    var t = document.querySelector('[data-geral-texto]'); if (t) t.textContent = mil(a.geral.avaliacoes) + ' avaliações no iFood';
    a.lojas.forEach(function (l) {
      document.querySelectorAll('[data-nota-loja="' + l.loja + '"]').forEach(function (e) { e.innerHTML = n1(l.nota) + ' <span class="estrela-dourada" aria-hidden="true">★</span> · ' + mil(l.avaliacoes) + ' avaliações'; });
    });
  }).catch(function () {});
})();
</script>`;

// Outras marcas do grupo (dados.mjs → culinarias). Logo em assets/img/marcas/<slug>.webp quando houver;
// sem logo, o nome escrito. Página de cada marca: em breve (material da diretoria).
const logoMarca = (c) => (existsSync(join(RAIZ, 'assets/img/marcas', `${c.slug}.webp`)) ? `assets/img/marcas/${c.slug}.webp` : null);
const cartaoCulinaria = (c, base) => {
  const logo = logoMarca(c);
  return `<a class="culinaria" href="${base}culinarias/${c.slug}/">${logo ? `<img src="${base}${logo}" width="320" height="320" loading="lazy" alt="${esc(c.nome)}">` : `<p class="culinaria-nome">${esc(c.nome)}</p>`}<p class="culinaria-tipo">${esc(c.tipo)}</p>${c.conteudo ? '' : '<p class="culinaria-breve">Em breve</p>'}</a>`;
};
// Cartão de uma culinária na página Unidades: mesmo padrão das lojas Burger, uma linha por operação.
const cartaoMarca = (c, base) => `
<article class="loja loja-marca">
  ${logoMarca(c) ? `<img class="marca-logo-peq" src="${base}${logoMarca(c)}" width="72" height="72" alt="Logo ${esc(c.nome)}" loading="lazy">` : `<span class="submenu-marca marca-inicial" aria-hidden="true">${esc(c.nome.split(' ').pop()[0])}</span>`}
  <h3><a href="${base}culinarias/${c.slug}/">${esc(c.nome)}</a></h3>
  <p class="loja-endereco">${esc(c.tipo)}</p>
  ${(c.lojas || []).map((x) => {
    const op = { ...x, nome: `${c.nome} ${x.regiao}`, googleMaps: x.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.endereco}, São Paulo - SP`)}` : '' };
    return `<div class="marca-operacao">
    <p class="marca-regiao">${esc(x.regiao)}</p>
    ${x.endereco ? `<p class="loja-endereco">${esc(x.endereco)}</p>` : ''}
    ${x.horarios ? `<p class="loja-hora">${x.horarios.map((h) => `<span>${esc(textoHorarioCurto(h))}</span>`).join('')}</p>` : ''}
    <div class="loja-reputacao"><p class="loja-nota">${nota1(x.nota)} <span class="estrela-dourada" aria-hidden="true">★</span> no iFood</p>${x.superIfood ? seloSuper : ''}</div>
    <p class="loja-acoes">${acoesLoja(op)}</p>
  </div>`;
  }).join('')}
</article>`;
const blocoCulinarias = (base) => (culinarias.length ? `
<section class="secao culinarias" aria-labelledby="culinarias-titulo">
  <div class="largura">
    <h2 id="culinarias-titulo">Conheça nossas culinárias</h2>
    <div class="grade-culinarias">${culinarias.map((c) => cartaoCulinaria(c, base)).join('')}</div>
  </div>
</section>` : '');
// Selo Super Restaurante iFood (só nas lojas com superIfood: nível 5 de 5 no painel do iFood).
const seloSuper = `<div class="selo-super" role="img" aria-label="Super Restaurante no iFood"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#ea1d2c"/><path d="M50.0,24.0 L56.8,42.7 L76.6,43.3 L60.9,55.6 L66.5,74.7 L50.0,63.5 L33.5,74.7 L39.1,55.6 L23.4,43.3 L43.2,42.7Z" fill="#fff"/></svg><p><em>super</em> <span>restaurante</span></p></div>`;
// Botões de cada loja: pedido no iFood da loja, WhatsApp e Google Maps.
const acoesLoja = (l) => `<a class="botao" href="${esc(l.ifood)}" rel="noopener">Faça seu pedido</a>${linkWhats ? `<a class="botao botao-whats" href="${linkWhats}" rel="noopener">${iconeWhats}WhatsApp</a>` : ''}${l.googleMaps ? `<a class="botao botao-contorno botao-mapa" href="${esc(l.googleMaps)}" rel="noopener" aria-label="Abrir ${esc(l.nome)} no Google Maps" title="Abrir no Google Maps">${iconePin}</a>` : ''}`;
// Endereço numa linha só: com o bairro quando cabe; senão, só rua e número (a cidade já está no nome da loja).
const enderecoCurto = (l) => (pendente(l.endereco) ? l.bairro : `${l.endereco} · ${l.bairro}`.length <= 38 ? `${l.endereco} · ${l.bairro}` : l.endereco);
const cartaoLoja = (l, base) => `
<article class="loja">
  <h3><a href="${base}unidades/${l.slug}/">${esc(l.nome.replace('Just Burger ', ''))}</a></h3>
  <p class="loja-endereco">${esc(enderecoCurto(l))}</p>
  <p class="loja-hora">${l.horarios.map((h) => `<span>${esc(textoHorarioCurto(h))}</span>`).join('')}</p>
  <div class="loja-reputacao">
    ${site.avaliacoes && site.avaliacoes.notaInformada ? `<p class="loja-nota" data-nota-loja="${esc(l.nome)}">${nota1(site.avaliacoes.notaInformada)} <span class="estrela-dourada" aria-hidden="true">★</span> no iFood</p>` : ''}
    ${l.superIfood ? seloSuper : ''}
  </div>
  <p class="loja-acoes">${acoesLoja(l)}</p>
  <p class="loja-ver"><a class="link" href="${base}unidades/${l.slug}/">Ver unidade →</a></p>
</article>`;

// No cardápio o cartão é a âncora (#id); nos perfis ele aponta para essa âncora.
const imgProduto = (i, base, sizes) => {
  const img = foto(i.id);
  return img
    ? `<img class="produto-foto" src="${base}${img}"${temFoto600(i.id) ? ` srcset="${base}${arqFoto(i.id, '-600')} 600w, ${base}${img} 1200w" sizes="${sizes}"` : ''} width="1200" height="900" loading="lazy" decoding="async" alt="${esc(i.nome)}">`
    : `<div class="produto-foto produto-sem-foto" role="img" aria-label="${esc(i.nome)}"><span>${esc(i.nome)}</span></div>`;
};
// No cardápio cada item é uma linha de menu com âncora (#id); fora dele, um cartão que aponta para essa âncora.
const tabelaProteina = (p) => `
<table class="proteina">
  <caption>Proteína (aproximada) por ${esc(p.por)}</caption>
  <tbody>${p.linhas.map((l) => `<tr><td>${esc(l.g)}</td><td>${esc(l.nome)}</td></tr>`).join('')}</tbody>
  <tfoot><tr><td>${esc(p.total)}</td><th scope="row">Total</th></tr></tfoot>
</table>`;
const cartaoProduto = (i, base, { ancora = false } = {}) => ancora
  ? `
<article class="item-menu" id="${i.id}">
  <button type="button" class="item-ampliar" aria-label="Ver ${esc(i.nome)} em tamanho grande">${imgProduto(i, base, '(min-width: 900px) 220px, 34vw')}</button>
  <div>
    ${i.selo ? `<p class="produto-selo">${esc(i.selo)}</p>` : ''}
    <h3>${esc(i.nome)}</h3>
    ${i.detalhe ? `<p class="produto-detalhe">${esc(i.detalhe)}</p>` : ''}
    ${i.descricao ? `<p class="produto-descricao">${esc(i.descricao)}</p>` : ''}
    ${i.proteina ? `<div class="item-proteina">${tabelaProteina(i.proteina)}</div>` : ''}
    ${site.mostrarPrecos && i.preco ? `<p class="preco">${esc(textoPreco(i))}</p>` : ''}
  </div>
</article>`
  : `
<a class="produto" href="${base}cardapio/#${i.id}">
  ${imgProduto(i, base, '(min-width: 900px) 380px, (min-width: 640px) 46vw, 92vw')}
  <span class="produto-texto">
    ${i.selo ? `<span class="produto-selo">${esc(i.selo)}</span>` : ''}
    <span class="produto-nome">${esc(i.nome)}</span>
    <span class="produto-descricao">${esc(i.descricao)}</span>
  </span>
</a>`;

const cartaoPerfil = (p, base) => `
<a class="perfil" href="${base}para-voce/${p.slug}/">
  <span class="perfil-nome">${esc(p.nome)}</span>
  <span class="suave">${esc(p.chamada)}</span>
</a>`;

const blocoFaq = (lista) => `
<div class="faq">
${lista.map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join('\n')}
</div>`;

// Na mídia: o cartão inteiro é o link para o original (abre em outra aba).
const TIPO_MIDIA = { materia: 'Matéria', video: 'Vídeo', guia: 'Guia', case: 'Case' };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const dataMidia = (d) => {
  if (!d) return '';
  const [a, m, dia] = d.split('-');
  return [dia && Number(dia), m && MESES[Number(m) - 1], a].filter(Boolean).join(' ');
};
const midiaOrdenada = [...midia].sort((a, b) => (b.data || '0').localeCompare(a.data || '0'));
const capaMidia = (m, base) =>
  m.youtube ? `https://i.ytimg.com/vi/${m.youtube}/hqdefault.jpg` : m.imagem ? `${base}${m.imagem}` : null;

const cartaoMidia = (m, base) => {
  const capa = capaMidia(m, base);
  return `
<a class="midia" href="${esc(m.url)}" target="_blank" rel="noopener">
  ${capa
    ? `<img class="midia-capa" src="${esc(capa)}" width="480" height="270" loading="lazy" decoding="async" alt="">`
    : `<span class="midia-capa midia-sem-capa" aria-hidden="true"><span>${esc(m.veiculo)}</span></span>`}
  <span class="midia-texto">
    <span class="midia-meta">${esc(TIPO_MIDIA[m.tipo] || 'Matéria')} · ${esc(m.veiculo)}${m.data ? ` · ${dataMidia(m.data)}` : ''}</span>
    <span class="midia-titulo">${esc(m.titulo)}</span>
    <span class="midia-resumo">${esc(m.resumo)}</span>
    <span class="midia-abrir">${m.tipo === 'video' ? 'Assistir vídeo' : `Abrir no ${esc(m.veiculo.split(' · ')[0])}`} ↗</span>
  </span>
</a>`;
};

const schemaMidia = () => ({
  '@type': 'CollectionPage',
  '@id': abs('na-midia/#pagina'),
  name: `${site.nome} na mídia`,
  about: { '@id': orgId },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: midiaOrdenada.map((m, n) => ({
      '@type': 'ListItem',
      position: n + 1,
      item: {
        '@type': m.tipo === 'video' ? 'VideoObject' : m.tipo === 'materia' ? 'NewsArticle' : 'Article',
        [m.tipo === 'video' ? 'name' : 'headline']: m.titulo,
        url: m.url,
        ...(m.data && { [m.tipo === 'video' ? 'uploadDate' : 'datePublished']: m.data }),
        ...(m.youtube && { thumbnailUrl: capaMidia(m, '') }),
        description: m.resumo,
        publisher: { '@type': 'Organization', name: m.veiculo },
        about: { '@id': orgId },
      },
    })),
  },
});

// ---------- Markdown (versão para IA) ----------

const mdLink = (texto, caminho) => `[${texto}](${abs(caminho)})`;
const mdItem = (i) => `- **${i.nome}**${i.detalhe ? ` — ${i.detalhe}` : ''}${i.selo ? ` (${i.selo})` : ''} (${i.categoria}): ${i.descricao}${i.proteina ? ` Proteína (aproximada) por ${i.proteina.por}: ${i.proteina.linhas.map((l) => `${l.g} ${l.nome}`).join(', ')}; total ${i.proteina.total}.` : ''} ${mdLink('ver no cardápio', `cardapio/#${i.id}`)}`;
const mdFaq = (lista) => lista.map((f) => `### ${f.p}\n\n${f.r}`).join('\n\n');
const mdLoja = (l) =>
  [
    `### ${l.nome}`,
    `- Região: ${l.regiao}`,
    `- Endereço: ${l.endereco}, ${l.bairro}, ${l.cidade} — SP${pendente(l.cep) ? '' : `, CEP ${l.cep}`}`,
    `- Horário: ${l.horarios.map(textoHorario).join('; ')}`,
    `- Entrega em: ${l.bairrosAtendidos.join(', ')}`,
    `- Pedir no iFood: ${l.ifood}`,
    `- Página: ${abs(`unidades/${l.slug}/`)}`,
  ].join('\n');

// Mais pedidos: os itens com selo "Top N mais vendido", na ordem; sem selo, os destaques do 1º perfil.
// Produto do destaque do topo da home (site.destaque).
const itemDestaque = () => site.destaque && [...itens.values()].find((i) => semAcento(i.nome).includes(semAcento(site.destaque.produto)) && foto(i.id));
const maisPedidos = () => {
  const top = [...itens.values()].filter((i) => i.selo).sort((a, b) => parseInt(a.selo.replace(/\D/g, '')) - parseInt(b.selo.replace(/\D/g, '')));
  return (top.length >= 3 ? top : destaquesHome()).slice(0, 3);
};
// Atalhos do cardápio: uma foto por categoria (sem molhos e energéticos, que não vendem pela foto).
const categoriasHome = () =>
  cardapio
    .filter((c) => !/molho|energ|bebida/i.test(c.categoria))
    .map((c) => ({ categoria: c.categoria, item: c.itens.find((i) => foto(i.id)) }))
    .filter((c) => c.item)
    .slice(0, 8);
// Destaque da imprensa: o case do iFood, se existir.
const citacaoMidia = (base) => {
  const m = midia.find((x) => x.tipo === 'case') || midiaOrdenada[0];
  const trecho = m && m.tipo === 'case' ? m.titulo.replace(/^.*?(ajudou a just burger)/i, '…$1') : m && m.titulo;
  return m ? `<figure class="citacao"><blockquote>“${esc(trecho)}”</blockquote><figcaption>${esc(m.veiculo)}${m.data ? `, ${dataMidia(m.data)}` : ''} · <a href="${base}na-midia/">ver todas as matérias</a></figcaption></figure>` : '';
};

// Janela da foto grande do cardápio: toque na linha (ou na foto) abre o lanche no tamanho dos "mais pedidos".
const janelaFoto = (base) => `
<dialog class="janela" id="janela" aria-labelledby="janela-nome">
  <button type="button" class="janela-fechar" aria-label="Fechar">×</button>
  <img class="janela-foto" alt="" width="1200" height="900">
  <div class="janela-texto">
    <p class="produto-selo" data-j="selo"></p>
    <h2 id="janela-nome" data-j="nome"></h2>
    <p class="produto-detalhe" data-j="detalhe"></p>
    <p class="produto-descricao" data-j="descricao"></p>
    <div data-j="extra"></div>
    ${botaoPedido(base)}
  </div>
</dialog>
<script>
(function () {
  var j = document.getElementById('janela'); if (!j || !j.showModal) return;
  var campo = function (k) { return j.querySelector('[data-j="' + k + '"]'); };
  function abre(item) {
    var img = item.querySelector('img.produto-foto'), foto = j.querySelector('.janela-foto');
    if (img) { foto.src = img.getAttribute('src'); foto.alt = img.alt; foto.hidden = false; } else foto.hidden = true;
    ['selo', 'detalhe', 'descricao'].forEach(function (k) {
      var o = item.querySelector('.produto-' + k); campo(k).textContent = o ? o.textContent : ''; campo(k).hidden = !o;
    });
    campo('nome').textContent = item.querySelector('h3').textContent;
    var extra = item.querySelector('.item-proteina'); campo('extra').innerHTML = extra ? extra.innerHTML : '';
    j.showModal();
  }
  document.querySelectorAll('.item-menu').forEach(function (item) {
    item.addEventListener('click', function (e) { if (!e.target.closest('a')) abre(item); });
  });
  j.querySelector('.janela-fechar').addEventListener('click', function () { j.close(); });
  j.addEventListener('click', function (e) { if (e.target === j) j.close(); });
})();
</script>`;

// ---------- Páginas ----------

const paginas = [];

paginas.push({
  caminho: '',
  profundidade: 0,
  titulo: `${site.nome} | Hamburgueria em São Paulo, Guarulhos e ABC`,
  descricao: `Just Burger: hamburgueria com hambúrguer de 150 g no pão brioche e entrega pelo iFood na Zona Leste, Pirituba, Guarulhos e São Bernardo do Campo. Veja o cardápio, o pedido ideal para o seu perfil e a unidade mais perto.`,
  schema: [
    { '@type': 'WebSite', '@id': abs('#site'), name: site.nome, url: abs(''), inLanguage: 'pt-BR', publisher: { '@id': orgId } },
    ...lojas.map(schemaLoja),
    schemaFaq(faq),
  ],
  corpo: (base) => `
<section class="heroi">
  <div class="largura heroi-grade">
    <div class="heroi-texto">
      <p class="sobretitulo">Desde ${esc(site.fundacao)} fazendo sucesso</p>
      ${site.destaque ? `<h1><a class="heroi-nome" href="${base}cardapio/${itemHeroi ? `#${itemHeroi.id}` : ''}"><span class="so-leitor">Just Burger, hamburgueria em São Paulo: </span>${esc(site.destaque.produto)}</a></h1>
      <p class="heroi-ingredientes">${site.destaque.ingredientes.map((t, k, a) => k === a.length - 1 ? `<span>${esc(t)}.</span>` : `${esc(t)}.`).join('<br>')}</p>
      <h2 class="heroi-sub">${esc(site.destaque.titulo)}</h2>
      <p class="lead">${esc(site.destaque.texto)}</p>
      <p class="destaque-frase">${esc(site.destaque.frase)}</p>` : `<h1>150 g de carne.<br>Pão brioche.<br><span>Molho Just.</span></h1>`}
    </div>
    ${temHeroi
      ? `<a class="heroi-burger-caixa" href="${base}cardapio/${itemHeroi ? `#${itemHeroi.id}` : ''}" aria-label="Ver ${esc(itemHeroi ? itemHeroi.nome : 'o destaque')} no cardápio"><img class="heroi-burger" src="${base}${imagemHeroi}" width="1000" height="1000" alt="${esc(itemHeroi ? `${itemHeroi.nome}, burger da Just Burger` : site.heroi.alt)}" fetchpriority="high"></a>`
      : `<img class="heroi-logo" src="${base}assets/img/logo-640.webp" srcset="${base}assets/img/logo-320.webp 320w, ${base}assets/img/logo-640.webp 640w" sizes="(min-width: 900px) 420px, 70vw" width="640" height="536" alt="Just Burger Hamburgueria" fetchpriority="high">`}
  </div>
</section>

${site.contador ? blocoContador() : ''}

<section class="secao">
  <div class="largura">
    <div class="titulo-secao">
      <h2>Os mais pedidos</h2>
      <a class="link" href="${base}cardapio/">Cardápio completo</a>
    </div>
    <div class="grade-produtos">${maisPedidos().map((i) => cartaoProduto(i, base)).join('')}</div>
  </div>
</section>

<section class="secao secao-clara">
  <div class="largura">
    <div class="titulo-secao">
      <h2>Cardápio</h2>
      <p>Hambúrgueres, combos, porções, saladas, shakes e sobremesas.</p>
    </div>
    <div class="grade-categorias">${categoriasHome().map(({ categoria, item }) => `
      <a class="categoria" href="${base}cardapio/#${slug(categoria)}">
        ${imgProduto(item, base, '(min-width: 900px) 280px, 46vw')}
        <span>${esc(categoria)}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="secao secao-unidades" id="unidades">
  <div class="largura">
    <div class="titulo-secao">
      <h2>Nossas unidades</h2>
    </div>
    <div class="grade-lojas lojas-centro">${lojas.map((l) => cartaoLoja(l, base)).join('')}</div>
  </div>
</section>

${blocoCulinarias(base)}

<section class="secao">
  <div class="largura dividido">
    <div>
      <h2>O que pedir</h2>
      <p class="suave">Primeira vez, muita fome, pedido para dividir ou algo mais leve: um atalho para cada situação.</p>
    </div>
    <div class="lista-perfis">${perfis.map((p) => cartaoPerfil(p, base)).join('')}</div>
  </div>
</section>

<section class="secao secao-clara">
  <div class="largura">
    <h2 class="midia-titulo">Na mídia</h2>
    ${citacaoMidia(base)}
    ${midia.find((m) => m.youtube === site.videoMidia) ? `<div class="video-midia"><iframe src="https://www.youtube-nocookie.com/embed/${site.videoMidia}" title="${esc(midia.find((m) => m.youtube === site.videoMidia).titulo)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : ''}
    <p class="visto-em-rotulo">Visto em</p>
    <ul class="visto-em">${[...new Map(midiaOrdenada.map((m) => [m.veiculo.split(' · ')[0], m])).values()].map((m) => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.veiculo.split(' · ')[0])}</a></li>`).join('')}</ul>
  </div>
</section>

<section class="secao">
  <div class="largura dividido">
    <div>
      <h2>Perguntas frequentes</h2>
      <p class="suave">Não achou o que procurava? Fale com a loja pelo chat do iFood.</p>
    </div>
    ${blocoFaq(faq)}
  </div>
</section>
${site.avaliacoes ? blocoAvaliacoes() : ''}`,
  md: () => `# ${site.nome}

> ${site.descricaoCurta}. Pedidos pelo iFood (${site.nomeIfood}).
${site.contador ? `\nMais de ${fmtInt(site.contador.basePedidos)} pedidos e ${fmtInt(site.contador.basePedidos * site.contador.lanchesPorPedido)} lanches vendidos desde a abertura.\n` : ''}
${diferenciais.map((d) => `- **${d.titulo}:** ${d.texto}`).join('\n')}
${itemDestaque() ? `\n## Destaque: ${itemDestaque().nome}\n\n${site.destaque.texto} ${site.destaque.frase}\n` : ''}
## Qual é o seu pedido?

${perfis.map((p) => `- ${mdLink(p.nome, `para-voce/${p.slug}/`)}: ${p.resposta}`).join('\n')}

## Unidades

${lojas.map(mdLoja).join('\n\n')}

## Perguntas frequentes

${mdFaq(faq)}
`,
});

paginas.push({
  caminho: 'cardapio/',
  profundidade: 1,
  titulo: `Cardápio ${site.nome} | Hambúrgueres, combos, saladas e shakes`,
  descricao: `Cardápio da hamburgueria Just Burger: hambúrgueres de 150 g no pão brioche, combos com batata e refrigerante, frango, saladas, milk-shakes e sobremesas. Peça pelo iFood na unidade mais perto.`,
  schema: [schemaCardapio(), schemaBreadcrumb([['Início', ''], ['Cardápio', 'cardapio/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Cardápio', 'cardapio/']])}
    <h1>Cardápio Just Burger</h1>
    ${respostaRapida('Hambúrguer de 150 g no pão brioche com o Molho Just. Os mais vendidos são o Top Smash, o Just House e o Dolce Gabana.')}
    <p class="aviso">Preços, promoções e disponibilidade do dia no iFood da sua unidade. A Just não faz trocas de itens.</p>
  </div>
</section>
<nav class="categorias" aria-label="Categorias do cardápio"><div class="largura">${cardapio.map((c) => `<a href="#${slug(c.categoria)}">${esc(c.categoria)}</a>`).join('')}</div></nav>
<section class="secao secao-menu">
  <div class="largura">
    ${cardapio.map((c) => `<h2 class="categoria-titulo" id="${slug(c.categoria)}">${esc(c.categoria)}</h2><div class="lista-menu">${c.itens.map((i) => cartaoProduto({ ...i, categoria: c.categoria }, base, { ancora: true })).join('')}</div>`).join('\n')}
    <div class="acoes">${botaoPedido(base)}</div>
${janelaFoto(base)}
  </div>
</section>`,
  md: () => `# Cardápio ${site.nome}

> Hambúrguer de 150 g no pão brioche com Molho Just. Mais vendidos: Top Smash, Just House, Dolce Gabana. Preço e disponibilidade do dia no iFood de cada unidade. Não fazemos trocas de itens.

${cardapio.map((c) => `## ${c.categoria}\n\n${c.itens.map((i) => mdItem({ ...i, categoria: c.categoria })).join('\n')}`).join('\n\n')}
`,
});

paginas.push({
  caminho: 'para-voce/',
  profundidade: 1,
  titulo: `O que pedir na ${site.nome} | Recomendações para cada perfil`,
  descricao: `Primeira vez, fome grande, pedido em grupo, gastar pouco, smash, frango, algo leve, ou sobremesa: veja o que pedir na Just Burger para cada perfil.`,
  schema: [
    { '@type': 'CollectionPage', name: 'O que pedir na Just Burger', hasPart: perfis.map((p) => ({ '@id': abs(`para-voce/${p.slug}/#pagina`) })) },
    schemaBreadcrumb([['Início', ''], ['Para você', 'para-voce/']]),
  ],
  corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Para você', 'para-voce/']])}
    <h1>O que pedir na Just Burger</h1>
    <p class="lead">Cada pessoa chega com uma fome diferente. Escolha o perfil mais parecido com o seu.</p>
    <div class="grade-perfis">${perfis.map((p) => cartaoPerfil(p, base)).join('')}</div>
  </div>
</section>`,
  md: () => `# O que pedir na ${site.nome}

${perfis.map((p) => `## ${p.nome}\n\n${p.resposta}\n\n${mdLink('Página completa', `para-voce/${p.slug}/`)}`).join('\n\n')}
`,
});

for (const p of perfis) {
  const caminho = `para-voce/${p.slug}/`;
  const trilha = [['Início', ''], ['Para você', 'para-voce/'], [p.nome, caminho]];
  paginas.push({
    caminho,
    profundidade: 2,
    titulo: `${p.nome}: o que pedir na ${site.nome}`,
    descricao: p.resposta.slice(0, 155),
    schema: [schemaPerfil(p), schemaFaq(p.perguntas), schemaBreadcrumb(trilha)],
    corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, trilha)}
    <p class="sobretitulo">Para você</p>
    <h1>${esc(p.nome)}</h1>
    <p class="lead">${esc(p.chamada)}</p>
    ${respostaRapida(p.resposta)}
    ${produtosDe(p).length ? `<h2>Recomendados</h2><div class="grade-produtos">${produtosDe(p).map((i) => cartaoProduto(i, base)).join('')}</div>` : ''}
  </div>
</section>
<section class="secao">
  <div class="largura estreita">
    <h2>Por que esse pedido</h2>
    ${p.texto.map((t) => `<p>${esc(t)}</p>`).join('')}
    <h2>Perguntas</h2>
    ${blocoFaq(p.perguntas)}
    <div class="acoes">${botaoPedido(base)}</div>
  </div>
</section>
<section class="secao">
  <div class="largura">
    <h2>Outros perfis</h2>
    <div class="grade-perfis">${perfis.filter((o) => o !== p).map((o) => cartaoPerfil(o, base)).join('')}</div>
  </div>
</section>`,
    md: () => `# ${p.nome}: o que pedir na ${site.nome}

> ${p.resposta}

${produtosDe(p).length ? `## Recomendados\n\n${produtosDe(p).map(mdItem).join('\n')}\n\n` : ''}## Por que esse pedido

${p.texto.join('\n\n')}

## Perguntas

${mdFaq(p.perguntas)}

Pedidos pelo iFood: ${mdLink('escolha a unidade', 'unidades/')}.
`,
  });
}

paginas.push({
  caminho: 'unidades/',
  profundidade: 1,
  titulo: `Unidades ${site.nome} | Zona Leste, Pirituba, Guarulhos e ABC`,
  descricao: `Endereços, horários e bairros de entrega das quatro hamburguerias Just Burger em ${listaCidades}.`,
  schema: [schemaBreadcrumb([['Início', ''], ['Unidades', 'unidades/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Unidades', 'unidades/']])}
    <h1>Unidades Just Burger</h1>
    ${respostaRapida(`São quatro unidades: ${juntar(lojas.map((l) => `${l.bairro} (${l.cidade})`))}. Todas entregam pelo iFood; escolha a mais perto para ver endereço, horário e bairros atendidos.`)}
    <div class="grade-2 lojas-centro">${lojas.map((l) => cartaoLoja(l, base)).join('')}</div>
  </div>
</section>
${culinarias.some((c) => c.lojas) ? `<section class="secao">
  <div class="largura">
    <h2>Nossas culinárias</h2>
    <div class="grade-2 lojas-centro">${culinarias.map((c) => cartaoMarca(c, base)).join('')}</div>
  </div>
</section>` : ''}`,
  md: () => `# Unidades ${site.nome}\n\n${lojas.map(mdLoja).join('\n\n')}\n`,
});

for (const l of lojas) {
  const local = `${l.bairro}, ${l.cidade}`;
  const termo = l.termoBusca;
  const caminho = `unidades/${l.slug}/`;
  const trilha = [['Início', ''], ['Unidades', 'unidades/'], [l.nome, caminho]];
  const faqLoja = [
    { p: `Onde fica a Just Burger ${termo}?`, r: pendente(l.endereco) ? `No bairro ${l.bairro}, em ${l.cidade}. PREENCHER endereço completo.` : `${l.endereco}, ${local} — SP${pendente(l.cep) ? '' : `, CEP ${l.cep}`}.` },
    { p: `Qual o horário da Just Burger ${termo}?`, r: l.horarios.map(textoHorario).join('; ') + '.' },
    { p: `A Just Burger ${termo} entrega em quais bairros?`, r: `Entregamos pelo iFood em ${juntar(l.bairrosAtendidos)} e região. Confirme digitando seu endereço no iFood.` },
  ];
  paginas.push({
    caminho,
    profundidade: 2,
    titulo: `Hamburgueria ${termo} | ${site.nome} ${l.bairro}`,
    descricao: `${l.nome}: hamburgueria ${termo}${termo.includes(l.bairro) ? '' : ` (${l.bairro})`}. Endereço, horário, bairros de entrega e link direto para pedir no iFood.`,
    schema: [schemaLoja(l), schemaFaq(faqLoja), schemaBreadcrumb(trilha)],
    corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, trilha)}
    <p class="sobretitulo">Hamburgueria ${esc(termo)}</p>
    <h1>${esc(l.nome)}</h1>
    <p class="lead resumo">${esc(l.intro)}</p>
    <div class="acoes acoes-loja">${acoesLoja(l)}</div>
  </div>
</section>
<section class="secao">
  <div class="largura grade-3">
    <article class="cartao">
      <h2>Endereço</h2>
      <address>${esc(l.endereco)}<br>${esc(local)} — SP<br>${pendente(l.cep) ? '' : 'CEP ' + esc(l.cep)}</address>
      ${l.telefone ? `<p><a href="tel:${l.telefone.replace(/\D/g, '')}">${esc(l.telefone)}</a></p>` : ''}
    </article>
    <article class="cartao">
      <h2>Horário</h2>
      <p class="suave">${l.horarios.map((h) => esc(textoHorario(h))).join('<br>')}</p>
    </article>
    <article class="cartao">
      <h2>Bairros atendidos</h2>
      <p>${l.bairrosAtendidos.map(esc).join(' · ')}${geo ? ' e região' : ''}.</p>
      ${geo ? `<p><a class="link" href="${base}entrega/#${l.slug}">Ver os ${bairrosDaLoja(l).length} bairros no raio de ${geo.raioKm} km →</a></p>` : ''}
    </article>
  </div>
</section>
<section class="secao">
  <div class="largura">
    <h2>O que pedir</h2>
    <div class="grade-perfis">${perfis.map((p) => cartaoPerfil(p, base)).join('')}</div>
  </div>
</section>
<section class="secao">
  <div class="largura estreita">
    <h2>Perguntas sobre a unidade</h2>
    ${blocoFaq(faqLoja)}
    <p><a class="link" href="${base}cardapio/">Ver o cardápio →</a></p>
  </div>
</section>`,
    md: () => `# Hamburgueria ${termo}: ${l.nome}\n\n> ${l.intro}\n\n${mdLoja(l)}\n\n## Perguntas\n\n${mdFaq(faqLoja)}\n`,
  });
}

if (geo) {
  const faixas = [[0, 3, 'Até 3 km'], [3, 6, 'De 3 a 6 km'], [6, Infinity, `De 6 a ${geo.raioKm} km`]];
  const rotuloBairro = (b) => (b.tipo === 'bairro' ? b.nome : b.tipo === 'cidade' ? `${b.cidade} (cidade)` : b.nome);
  paginas.push({
    caminho: 'entrega/',
    profundidade: 1,
    titulo: `Onde a ${site.nome} entrega | ${bairros.length} bairros e cidades`,
    descricao: `Lista completa dos bairros, distritos e cidades no raio de ${geo.raioKm} km das quatro unidades da Just Burger: Zona Leste, Pirituba, Guarulhos e São Bernardo do Campo.`,
    schema: [schemaBreadcrumb([['Início', ''], ['Onde entregamos', 'entrega/']])],
    corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Onde entregamos', 'entrega/']])}
    <h1>Onde a Just Burger entrega</h1>
    ${respostaRapida(`Cada unidade da Just Burger atende um raio de ${geo.raioKm} km. São ${bairros.length} distritos, bairros e cidades no total. Encontre o seu abaixo; a entrega final é confirmada pelo iFood quando você digita o endereço.`)}
    ${lojas.map((l) => `
    <details class="bloco-loja" id="${l.slug}">
      <summary><span class="bloco-loja-nome">${esc(l.nome)}</span> <span class="suave pequeno">${bairrosDaLoja(l).length} bairros</span></summary>
      ${faixas.map(([de, ate, rot]) => {
        const lista = bairrosDaLoja(l).filter((b) => b.distanciaKm >= de && b.distanciaKm < ate);
        return lista.length ? `<h3 class="faixa">${rot}</h3><p class="chips">${lista.map((b) => `<a href="${base}entrega/${b.slug}/">${esc(rotuloBairro(b))}</a>`).join('')}</p>` : '';
      }).join('')}
    </details>`).join('')}
    <script>(function () { var d = location.hash && document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') d.open = true; })();</script>
    <p class="suave pequeno">Bairros e distâncias calculados a partir do OpenStreetMap e dos distritos oficiais da Prefeitura de São Paulo (GeoSampa), em ${dataMidia(geo.geradoEm)}.</p>
  </div>
</section>`,
    md: () => `# Onde a ${site.nome} entrega\n\nRaio de ${geo.raioKm} km de cada unidade. Confirme o endereço no iFood.\n\n${lojas.map((l) => `## ${l.nome}\n\n${bairrosDaLoja(l).map((b) => `- [${rotuloBairro(b)}](${abs(`entrega/${b.slug}/`)}) — ${kmTxt(b.distanciaKm)} km${b.variacoes.length ? ` (inclui ${b.variacoes.slice(0, 6).join(', ')})` : ''}`).join('\n')}`).join('\n\n')}\n`,
  });

  for (const b of bairros) {
    const l = lojaPorSlug(b.loja);
    const caminho = `entrega/${b.slug}/`;
    const onde = `${prep(b.nome)} ${b.nome}`;
    const deOnde = `${prepDe(b.nome)} ${b.nome}`;
    const regiao = localBairro(b);
    const nomeCompleto = b.tipo === 'cidade' ? b.nome : `${b.nome}, ${regiao}`;
    const vizinhos = b.vizinhos.map((v) => bairroPorSlug.get(v)).filter(Boolean);
    const outras = b.outrasLojas.map((o) => ({ ...o, l: lojaPorSlug(o.loja) }));
    const trilha = [['Início', ''], ['Onde entregamos', 'entrega/'], [b.nome, caminho]];
    const casa = l.distritoOficial === b.nome; // distrito onde a própria loja fica
    const resumo = casa
      ? `A ${l.nome} fica ${onde} (${regiao}): é aqui que está a loja${l.outrosNomes ? `, na ${l.bairro} (também chamada de ${juntar(l.outrosNomes)})` : ''}. O pedido é feito pelo iFood, a partir das 18h.`
      : `A Just Burger entrega ${onde} (${regiao}) pela unidade ${l.nome}, a cerca de ${kmTxt(b.distanciaKm)} km. O pedido é feito pelo iFood, a partir das 18h.`;
    const borda = b.inteiroNoRaio ? '' : ` Parte ${esc(deOnde)} passa do raio: nas ruas mais afastadas, a entrega depende da área do iFood.`;
    const paragrafoDistancia = casa
      ? `A ${esc(l.nome)} fica ${esc(onde)}, então o bairro inteiro está perto da cozinha.`
      : `${b.tipo === 'cidade' ? `A parte de ${esc(b.nome)} dentro do raio fica` : `${esc(b.nome)} fica`} a cerca de ${kmTxt(b.distanciaKm)} km ${rumo(b.direcao)} da ${esc(l.nome)} (${esc(l.bairro)}, ${esc(l.cidade)}), dentro do raio de entrega de ${geo.raioKm} km.${borda}`;
    const perguntas = [
      { p: `A Just Burger entrega ${onde}?`, r: b.tipo === 'cidade'
        ? `Em parte. A região de ${b.nome} mais perto da ${l.nome} está dentro do raio de ${geo.raioKm} km. Digite seu endereço no iFood para saber se a sua rua é atendida.`
        : `Sim. ${b.nome} está dentro do raio de ${geo.raioKm} km da ${l.nome}${b.inteiroNoRaio ? '' : ' (nas ruas mais afastadas, confirme no iFood)'}. Digite seu endereço no iFood para ver a taxa e o tempo de entrega.` },
      { p: `Qual a Just Burger mais perto ${deOnde}?`, r: `A ${l.nome}, a cerca de ${kmTxt(b.distanciaKm)} km${outras.length ? `. Também fica no raio da ${juntar(outras.map((o) => `${o.l.nome} (${kmTxt(o.distanciaKm)} km)`))}` : ''}.` },
      { p: `Como pedir hambúrguer ${onde}?`, r: `Abra a loja ${l.nome} no iFood (${site.nomeIfood}), escolha o lanche e informe seu endereço ${onde}. Pedido mínimo de R$ ${site.pedidoMinimo}.` },
    ];
    if (b.variacoes.length) perguntas.push({ p: `Quais bairros ${deOnde} a Just Burger atende?`, r: `Entre outros: ${juntar(b.variacoes.slice(0, 12))}.` });
    paginas.push({
      caminho,
      profundidade: 2,
      // Bairro pequeno sem sub-bairros (1 ponto da varredura): fica fora do Google para não parecer página-isca.
      noindex: !site.indexarBairrosPequenos && b.pontos === 1 && !b.variacoes.length,
      titulo: `Hamburgueria ${onde}${b.tipo === 'bairro' ? `, ${b.cidade.replace(' do Campo', '')}` : ''} | ${site.nome}`,
      descricao: `Delivery de hambúrguer ${onde} (${regiao}): hambúrguer de 150 g da Just Burger, unidade ${l.bairro} a ${kmTxt(b.distanciaKm)} km. Bairros atendidos e como pedir pelo iFood.`,
      schema: [
        {
          '@type': 'WebPage',
          '@id': abs(caminho + '#pagina'),
          name: `Hamburgueria ${onde}`,
          inLanguage: 'pt-BR',
          about: { '@id': abs(`unidades/${l.slug}/#restaurante`) },
          spatialCoverage: {
            '@type': 'Place',
            name: nomeCompleto,
            geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lon },
            ...(b.variacoes.length && { containsPlace: b.variacoes.map((v) => ({ '@type': 'Place', name: v })) }),
          },
        },
        schemaFaq(perguntas),
        schemaBreadcrumb(trilha),
      ],
      corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, trilha)}
    <p class="sobretitulo">${esc(regiao)} · ${kmTxt(b.distanciaKm)} km da unidade ${esc(l.bairro)}</p>
    <h1>Hamburgueria ${esc(onde)}</h1>
    ${respostaRapida(resumo)}
    <div class="acoes">
      <a class="botao" href="${esc(l.ifood)}" rel="noopener">Fazer pedido</a>
      <a class="botao botao-contorno" href="${base}unidades/${l.slug}/">Ver a unidade ${esc(l.bairro)}</a>
    </div>
  </div>
</section>
<section class="secao">
  <div class="largura estreita">
    <h2>Entrega ${esc(onde)}</h2>
    <p>${paragrafoDistancia}</p>
    ${outras.length ? `<p>${esc(b.nome)} também está no raio da ${outras.map((o) => `<a href="${base}unidades/${o.l.slug}/">${esc(o.l.nome)}</a> (${kmTxt(o.distanciaKm)} km)`).join(' e da ')}. O iFood mostra a loja que atende o seu endereço.</p>` : ''}
    ${b.variacoes.length ? `
    <h2>Bairros, vilas e jardins ${esc(deOnde)}</h2>
    <p>${b.variacoes.length === 1 ? 'Parte da região que também recebe' : `Os ${b.variacoes.length} bairros, vilas e jardins abaixo fazem parte ${esc(deOnde)} e também recebem`} a Just pelo iFood:</p>
    <p class="chips chips-texto">${b.variacoes.map((v) => `<span>${esc(v)}</span>`).join('')}</p>` : ''}
    <h2>O que pedir</h2>
    <div class="grade-perfis">${perfis.slice(0, 3).map((p) => cartaoPerfil(p, base)).join('')}</div>
    <p><a class="link" href="${base}cardapio/">Ver o cardápio completo →</a></p>
    <h2>Perguntas</h2>
    ${blocoFaq(perguntas)}
    <h2>Bairros vizinhos</h2>
    <p class="chips">${vizinhos.map((v) => `<a href="${base}entrega/${v.slug}/">${esc(v.nome)}</a>`).join('')}</p>
  </div>
</section>`,
      md: () => `# Hamburgueria ${onde}\n\n> ${resumo}\n\n- Unidade: ${l.nome} (${abs(`unidades/${l.slug}/`)})\n- Distância: ${kmTxt(b.distanciaKm)} km ${rumo(b.direcao)}\n- Pedir no iFood: ${l.ifood}\n${b.variacoes.length ? `- Inclui: ${b.variacoes.join(', ')}\n` : ''}\n## Perguntas\n\n${mdFaq(perguntas)}\n`,
    });
  }
}

paginas.push({
  caminho: 'na-midia/',
  profundidade: 1,
  titulo: `${site.nome} na mídia | Matérias, vídeos e cases`,
  descricao: `Matérias, vídeos e cases que falam da Just Burger: a ação com a Coca-Cola no Dia do Hambúrguer, o case do iFood e guias de hambúrguer.`,
  schema: [schemaMidia(), schemaBreadcrumb([['Início', ''], ['Na mídia', 'na-midia/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Na mídia', 'na-midia/']])}
    <h1>Just Burger na mídia</h1>
    ${respostaRapida(`A Just Burger já foi assunto no Meio & Mensagem e em outros veículos de publicidade pela ação com a Coca-Cola no Dia do Hambúrguer de 2021 (QR code no pão contra a fome) e virou case no blog de parceiros do iFood em 2024. Toque em qualquer cartão para abrir o original.`)}
    <div class="grade-midia">${midiaOrdenada.map((m) => cartaoMidia(m, base)).join('')}</div>
    <p class="suave pequeno">Os textos, fotos e vídeos pertencem a cada veículo. Saiu alguma matéria que não está aqui? Fale com a gente pelo Instagram.</p>
  </div>
</section>`,
  md: () => `# ${site.nome} na mídia

${midiaOrdenada.map((m) => `- **${m.titulo}** — ${m.veiculo}${m.data ? `, ${dataMidia(m.data)}` : ''} (${TIPO_MIDIA[m.tipo] || 'Matéria'}). ${m.resumo} ${m.url}`).join('\n')}
`,
});

// Nossa história: texto da diretoria (30/10/2026) com fatos da entrevista ao iFood (2023).
// Os episódios do Falando de Delivery (midia) aparecem logo abaixo.
const historia = [
  `A Just Burger nasceu em ${new Date(site.fundacaoData + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}, na Zona Leste de São Paulo, com uma aposta clara: fazer o melhor hambúrguer de delivery de uma região carente de qualidade na entrega. Começamos pequenos, com 12 pessoas e foco 100% no delivery: um hambúrguer de 150 g no pão brioche, feito para chegar quentinho e no tempo certo. À frente da Just estão Maikon e Juliana.`,
  `Deu certo: só no primeiro ano as vendas dobraram. Crescemos para São Bernardo do Campo (2021), Guarulhos (2022) e Pirituba, passamos de ${fmtInt(site.contador.basePedidos)} pedidos, e as quatro unidades têm o selo Super Restaurante no iFood, com uma das entregas mais rápidas da cidade.`,
  'Da Just Burger nasceu um grupo. Em 2020 veio a Just Gourmet, de comida brasileira, que hoje está entre as maiores do grupo em pedidos e em faturamento. Em 2024 chegaram a Just Forneria, de pizza, e a Just Esfiha, e em 2025 a Just Sushi. Hoje são 11 operações abertas no iFood e na Keeta.',
  'Em 2026, as lojas do grupo chegaram também à Keeta, plataforma da Meituan, líder do delivery na China e a maior plataforma de delivery do mundo. É uma nova fase, com novos desafios e espaço para crescer no mercado brasileiro nos próximos anos.',
  'Seguimos com a mesma ideia do primeiro dia: comida boa de verdade, na casa de cada cliente.',
];
const videosHistoria = () => midia.filter((m) => m.youtube && /falando de delivery/i.test(m.veiculo));

paginas.push({
  caminho: 'sobre/',
  profundidade: 1,
  titulo: `Sobre a ${site.nome} | Hamburgueria paulistana desde ${site.fundacao}`,
  descricao: `A história da Just Burger, hamburgueria criada na Zona Leste de São Paulo em ${site.fundacao}.`,
  schema: [schemaBreadcrumb([['Início', ''], ['Sobre', 'sobre/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura estreita">
    ${migalhas(base, [['Início', ''], ['Sobre', 'sobre/']])}
    <h1>Sobre a Just Burger</h1>
    <p class="lead">A Just Burger começou em ${esc(site.fundacao)} na Zona Leste de São Paulo, no delivery, e hoje tem quatro unidades na Grande São Paulo.</p>
    ${historia.map((t) => `<p>${esc(t)}</p>`).join('')}
  </div>
</section>
${videosHistoria().length ? `<section class="secao">
  <div class="largura">
    <h2>Assista à nossa história</h2>
    <div class="grade-midia">${videosHistoria().map((m) => cartaoMidia(m, base)).join('')}</div>
  </div>
</section>` : ''}`,
  md: () => `# Sobre a ${site.nome}\n\nA Just Burger começou em ${site.fundacao} na Zona Leste de São Paulo, no delivery, e hoje tem quatro unidades na Grande São Paulo.\n\n${historia.join('\n\n')}\n\n${videosHistoria().map((m) => `- ${m.titulo}: ${m.url}`).join('\n')}\n`,
});

paginas.push({
  caminho: 'pedir/',
  profundidade: 1,
  titulo: `Faça seu pedido | ${site.nome}`,
  descricao: 'Digite seu CEP e veja qual unidade da Just Burger atende você, com o link direto para pedir.',
  schema: [schemaBreadcrumb([['Início', ''], ['Faça seu pedido', 'pedir/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura estreita">
    ${migalhas(base, [['Início', ''], ['Faça seu pedido', 'pedir/']])}
    <h1>Faça seu pedido</h1>
    <p class="lead">Digite seu CEP: mostramos a unidade mais perto, com o link direto para pedir.</p>
    ${buscaCep('cep-pagina')}
    ${outrasOpcoes()}
  </div>
</section>
<section class="secao">
  <div class="largura">
    <h2>Ou escolha a unidade</h2>
    <div class="grade-lojas lojas-centro">${lojas.map((l) => cartaoLoja(l, base)).join('')}</div>
  </div>
</section>`,
  md: () => `# Faça seu pedido na ${site.nome}\n\n${lojas.map((l) => `- ${l.nome} (${l.endereco}, ${l.bairro}, ${l.cidade}): ${l.ifood}`).join('\n')}\n${site.telefoneCentral ? `\nWhatsApp e telefone: ${site.telefoneCentral}\n` : ''}`,
});

// Culinárias do grupo: índice e uma página por marca. Sem conteúdo ainda (culinarias[].conteudo),
// a página sai com noindex e fora do sitemap.
paginas.push({
  caminho: 'culinarias/',
  profundidade: 1,
  titulo: `Nossas culinárias | ${site.nome}`,
  descricao: `As marcas do grupo da Just Burger: ${culinarias.map((c) => `${c.nome} (${c.tipo.toLowerCase()})`).join(', ')}.`,
  noindex: !culinarias.some((c) => c.conteudo),
  schema: [schemaBreadcrumb([['Início', ''], ['Culinárias', 'culinarias/']])],
  corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, [['Início', ''], ['Culinárias', 'culinarias/']])}
    <h1>Conheça nossas culinárias</h1>
    <p class="lead">Da Just Burger nasceu um grupo. Conheça as outras marcas.</p>
    <div class="grade-2 lojas-centro">${culinarias.map((c) => cartaoMarca(c, base)).join('')}</div>
  </div>
</section>`,
  md: () => `# Nossas culinárias\n\n${culinarias.map((c) => `- ${c.nome}: ${c.tipo}`).join('\n')}\n`,
});
for (const c of culinarias) {
  const trilha = [['Início', ''], ['Culinárias', 'culinarias/'], [c.nome, `culinarias/${c.slug}/`]];
  const outras = culinarias.filter((o) => o !== c);
  paginas.push({
    caminho: `culinarias/${c.slug}/`,
    profundidade: 2,
    titulo: `${c.nome} | ${c.tipo} do grupo Just Burger: unidades e pedido`,
    descricao: `${c.nome}: ${c.tipo.toLowerCase()} do grupo Just Burger em ${(c.lojas || []).map((x) => x.regiao).join(' e ')}. Endereço, horário e pedido no iFood.`,
    noindex: !c.conteudo,
    schema: [schemaBreadcrumb(trilha)],
    corpo: (base) => `
<section class="secao">
  <div class="largura">
    ${migalhas(base, trilha)}
    <h1 class="so-leitor">${esc(c.nome)}: ${esc(c.tipo.toLowerCase())} do grupo Just Burger</h1>
    <div class="marca-destaque lojas-centro">${cartaoMarca(c, base)}</div>
    ${c.conteudo ? `<div class="largura estreita">${c.conteudo.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
  </div>
</section>
<section class="secao">
  <div class="largura">
    <h2>Conheça também</h2>
    <div class="grade-2 lojas-centro">${outras.map((o) => cartaoMarca(o, base)).join('')}</div>
  </div>
</section>`,
    md: () => `# ${c.nome}\n\n${c.tipo} do grupo Just Burger.\n\n${(c.lojas || []).map((x) => `- ${x.regiao}${x.endereco ? `: ${x.endereco}` : ''} · pedido: ${x.ifood}`).join('\n')}\n`,
  });
}

// ---------- Escrita ----------

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });
cpSync(join(RAIZ, 'assets'), join(SAIDA, 'assets'), { recursive: true });
{
  // Busca por CEP (assets/pedido.js): lojas com coordenadas e, de reserva, bairro -> loja (bairros.json).
  const normB = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const comGeo = lojas.filter((l) => l.geo);
  const bairros = {};
  for (const b of geo ? geo.bairros : []) {
    const i = comGeo.findIndex((l) => l.slug === b.loja);
    if (i < 0) continue;
    for (const n of [b.nome, ...(b.variacoes || [])]) {
      bairros[`${normB(n)}|${normB(b.cidade)}`] ??= i;
      bairros[normB(n)] ??= i;
    }
  }
  const dados = {
    raio: RAIO_KM,
    whatsapp: linkWhats,
    lojas: comGeo.map((l) => ({ nome: l.nome, endereco: l.endereco, bairro: l.bairro, cidade: l.cidade, lat: l.geo.lat, lng: l.geo.lng, ifood: l.ifood })),
    bairros,
  };
  writeFileSync(join(SAIDA, 'assets', 'pedido-dados.js'), `window.JUST_PEDIDO = ${JSON.stringify(dados)};\n`);
}

for (const p of paginas) {
  const pasta = join(SAIDA, p.caminho);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'index.html'), pagina(p));
  writeFileSync(join(pasta, 'index.md'), p.md());
}

writeFileSync(
  join(SAIDA, '404.html'),
  pagina({
    caminho: '404.html',
    profundidade: 0,
    // A 404 é servida em qualquer endereço, então os arquivos precisam de caminho absoluto.
    base: site.url + '/',
    markdown: false,
    titulo: `Página não encontrada | ${site.nome}`,
    descricao: 'Página não encontrada.',
    corpo: () => `
<section class="secao"><div class="largura estreita">
  <h1>Essa página saiu da chapa.</h1>
  <p class="lead">O endereço não existe mais ou foi digitado errado.</p>
  <div class="acoes"><a class="botao" href="${site.url}/">Voltar para o início</a></div>
</div></section>`,
  }).replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">'),
);

// llms.txt (padrão llmstxt.org): resumo + mapa do site em Markdown para assistentes de IA.
const llms = `# ${site.nome}

> ${site.descricaoCurta}. Especialidade: hambúrguer de 150 g no pão brioche com Molho Just; mais vendidos Top Smash, Just House e Dolce Gabana. Pedidos somente pelo iFood, na loja "${site.nomeIfood}" da unidade mais próxima.

Fatos principais:
${site.avaliacoes && site.avaliacoes.notaInformada ? `- Nota ${nota1(site.avaliacoes.notaInformada)} no iFood nas quatro lojas.\n` : ''}${site.contador ? `- Mais de ${fmtInt(site.contador.basePedidos)} pedidos e ${fmtInt(site.contador.basePedidos * site.contador.lanchesPorPedido)} lanches vendidos desde a abertura (total ao vivo na home).\n` : ''}- Quatro unidades: ${juntar(lojas.map((l) => `${l.bairro} (${l.cidade}, ${l.regiao})`))}.
- Horário: a partir das 18h (detalhes por unidade).
- Pedido mínimo no iFood: R$ ${site.pedidoMinimo}.
- Instagram: ${site.instagram}
- Dados estruturados (unidades, cardápio, links de pedido): ${abs('dados.json')}

## Páginas

${paginas.filter((p) => !/^(para-voce|entrega)\/./.test(p.caminho)).map((p) => `- [${p.titulo}](${abs(p.caminho + 'index.md')}): ${p.descricao}`).join('\n')}

## Recomendações por perfil

${perfis.map((p) => `- [${p.nome}](${abs(`para-voce/${p.slug}/index.md`)}): ${p.resposta}`).join('\n')}

${geo ? `## Onde entregamos\n\nRaio de ${geo.raioKm} km de cada unidade: ${abs('entrega/index.md')}\n\n${lojas.map((l) => `- ${l.nome}: ${bairrosDaLoja(l).map((b) => b.nome).join(', ')}`).join('\n')}\n\n` : ''}## Na mídia

${midiaOrdenada.map((m) => `- [${m.titulo}](${m.url}) — ${m.veiculo}${m.data ? `, ${dataMidia(m.data)}` : ''}`).join('\n')}

## Opcional

- [Conteúdo completo em um arquivo](${abs('llms-full.txt')})
`;
writeFileSync(join(SAIDA, 'llms.txt'), llms);
writeFileSync(join(SAIDA, 'llms-full.txt'), paginas.map((p) => `<!-- ${abs(p.caminho)} -->\n${p.md()}`).join('\n---\n\n'));

// dados.json: o mesmo conteúdo em formato de dados para agentes (ex.: "qual unidade entrega no meu bairro?").
writeFileSync(
  join(SAIDA, 'dados.json'),
  JSON.stringify(
    {
      atualizado: HOJE,
      marca: { nome: site.nome, nomeNoIfood: site.nomeIfood, site: abs(''), instagram: site.instagram, pedidoMinimo: `R$ ${site.pedidoMinimo}`, comoPedir: 'Somente pelo iFood, pelo link da unidade.' },
      unidades: lojas.map((l) => ({
        nome: l.nome, bairro: l.bairro, cidade: l.cidade, regiao: l.regiao, endereco: l.endereco, cep: l.cep,
        horarios: l.horarios.map(textoHorario), bairrosAtendidos: l.bairrosAtendidos, pedirNoIfood: l.ifood, pagina: abs(`unidades/${l.slug}/`),
      })),
      cardapio: cardapio.map((c) => ({
        categoria: c.categoria,
        itens: c.itens.map((i) => ({ id: i.id, nome: i.nome, descricao: i.descricao, ...(i.preco && { precoReferencia: `R$ ${i.preco}` }), url: abs(`cardapio/#${i.id}`) })),
      })),
      entrega: geo && { raioKm: geo.raioKm, bairros: bairros.map((b) => ({ nome: b.nome, cidade: b.cidade, regiao: localBairro(b), unidade: lojaPorSlug(b.loja).nome, distanciaKm: b.distanciaKm, inclui: b.variacoes, pagina: abs(`entrega/${b.slug}/`) })) },
      naMidia: midiaOrdenada.map(({ tipo, veiculo, titulo, data, url }) => ({ tipo, veiculo, titulo, data, url })),
      observacaoPrecos: 'Preços de referência; o valor vigente e as promoções do dia estão no iFood.',
      perfis: perfis.map((p) => ({ perfil: p.nome, recomendacao: p.resposta, produtos: produtosDe(p).map((i) => i.id), pagina: abs(`para-voce/${p.slug}/`) })),
    },
    null,
    2,
  ),
);

writeFileSync(
  join(SAIDA, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.filter((p) => !p.noindex).map((p) => `  <url><loc>${abs(p.caminho)}</loc><lastmod>${HOJE}</lastmod></url>`).join('\n')}
</urlset>
`,
);

writeFileSync(
  join(SAIDA, 'robots.txt'),
  site.publicado
    ? `${ROBOS_IA.map((r) => `User-agent: ${r}`).join('\n')}\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`
    : `User-agent: *\nDisallow: /\n`,
);

writeFileSync(
  join(SAIDA, 'site.webmanifest'),
  JSON.stringify(
    { name: site.nome, short_name: site.nome, start_url: './', display: 'browser', background_color: '#000000', theme_color: '#000000', icons: [{ src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }] },
    null,
    2,
  ),
);

const texto = JSON.stringify({ site, diferenciais, lojas, cardapio, perfis, faq });
const faltando = texto.match(/PREENCHER/g)?.length ?? 0;
const conferir = texto.match(/"conferir":true/g)?.length ?? 0;
const semFoto = [...itens.keys()].filter((id) => !foto(id));
console.log(`${paginas.length + 1} páginas geradas em ${SAIDA} (+ index.md, llms.txt, llms-full.txt, dados.json)`);
console.log(site.publicado ? 'Modo: PUBLICADO (indexável)' : 'Modo: rascunho (noindex) — mude site.publicado para true quando estiver pronto');
if (faltando) console.log(`Faltam ${faltando} campo(s) PREENCHER em dados.mjs`);
if (conferir) console.log(`${conferir} item(ns) do cardápio marcados para conferir`);
if (doIfood) console.log(`Cardápio: ${itens.size} itens do iFood (cópia de ${doIfood.copiadoDoIfoodEm ? new Date(doIfood.copiadoDoIfoodEm).toLocaleDateString('pt-BR') : '?'})`);
if (naoEncontrados.size) console.log(`Produtos dos perfis que não estão no cardápio (ajuste os ids em dados.mjs): ${[...naoEncontrados].join('; ')}`);
if (semFoto.length) console.log(`Sem foto (${semFoto.length}): ${semFoto.join(', ')}`);

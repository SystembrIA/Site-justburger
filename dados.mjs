// Tudo o que aparece no site sai deste arquivo. Edite aqui e rode `node build.mjs`.
// "PREENCHER" = dado que falta. "conferir: true" = dado tirado de páginas públicas do iFood
// (busca do Google, out/2026) que precisa ser confirmado por alguém da Just antes de publicar.

export const site = {
  // Domínio definitivo do site (sem barra no final). Usado em canonical, sitemap e schema.
  url: 'https://www.justburger.com.br',
  nome: 'Just Burger',
  nomeIfood: 'Just Burger Hamburgueria Lanches & Dog', // nome igual ao do iFood/Google ajuda o Google a ligar as fichas
  descricaoCurta: 'Hamburgueria em São Paulo, Guarulhos e São Bernardo do Campo',
  // false = páginas saem com "noindex" (Google não indexa). Só trocar para true
  // quando todos os PREENCHER estiverem resolvidos e o domínio estiver no ar.
  publicado: false,
  fundacao: '2018', // ano que aparece nos textos ("desde 2018")
  fundacaoData: '2018-10-04', // data de nascimento da Just Burger, informada pela diretoria (vai no schema)
  telefoneCentral: '(11) 2622-8800', // telefone e WhatsApp central (diretoria, 30/10/2026)
  whatsapp: '551126228800', // botão de WhatsApp em todas as páginas (wa.me)
  // Botão "Ver todas as opções" da janela "Faça seu pedido". Vazio = o botão não aparece.
  linktree: '', // PREENCHER: link do Linktree da Just
  emailContato: '', // vazio = não aparece
  instagram: 'https://www.instagram.com/justburgersp/',
  pedidoMinimo: '20,00', // conferir: valor mostrado no iFood
  // Preço em site é oferta (CDC art. 30) e envelhece rápido. Com false, o site mostra
  // "ver preço no iFood"; os preços continuam só nos dados para robôs (dados.json).
  mostrarPrecos: false,
  // Cardápio do site (diretoria, 30/10/2026): sem energéticos; em Bebidas, só a Pink Lemonade.
  cardapioOcultar: ['Energéticos'],
  cardapioSoEstes: { Bebidas: ['pink lemonade'] },
  faixaPreco: '$$',
  googleSiteVerification: '',
  // Páginas de bairro pequeno sem sub-bairros saem com noindex (risco de "página-isca" no Google).
  indexarBairrosPequenos: false,
  // Painel de números da home: BASE informada pela Just + o que a função contadorSite soma desde
  // que entrou no ar (site_publico/contador: pedidos novos e pedidos prontos, iFood + Keeta + Saipos).
  // lanches = (base de pedidos + pedidos prontos desde então) × lanchesPorPedido.
  contador: {
    url: 'https://justburger-producao-e9b27-default-rtdb.firebaseio.com/site_publico/contador.json',
    basePedidos: 3100000, // informado pela diretoria em 30/10/2026
    lanchesPorPedido: 2.5, // média informada pela diretoria
    rotuloPedidos: 'pedidos feitos',
    rotuloLanches: 'lanches vendidos',
  },
  // Painel de avaliações: nota e quantidade de cada loja no iFood (robô diário do just-burger-producao).
  // notaInformada: aparece já no HTML (todas as lojas) até o robô trazer a nota e a quantidade do iFood.
  avaliacoes: {
    url: 'https://systembria.github.io/just-burger-producao/site-dados/avaliacoes-just-burger.json',
    notaInformada: 4.9, // nota no iFood das 4 lojas, informada pela diretoria em 30/10/2026
  },
  // Burger flutuando no topo da home: recorte (sem fundo) do produto com este nome, gerado pelo robô
  // a partir da foto do iFood. Sem recorte, usa `imagem` (PNG/WebP transparente) e, sem ela, o logo.
  heroi: { produto: 'Dolce Gabana', imagem: 'assets/img/heroi-dolce-gabana.webp', alt: 'Dolce Gabana, burger da Just Burger' },
  // Destaque do topo da home (texto da diretoria, 30/10/2026).
  // Nome sempre como no iFood ("Dolce Gabana"), sem a grafia da marca de moda.
  destaque: {
    produto: 'Dolce Gabana',
    ingredientes: ['150 g de carne', 'Pão brioche', 'Gorgonzola', 'Geleia de damasco'],
    titulo: 'Uma explosão de sabores',
    texto: 'O gorgonzola cremoso derrete sobre o hambúrguer de 150 g e encontra a geleia de damasco: o doce que equilibra o salgado. Por cima, bacon fatiado e farofa de bacon crocante, tudo no pão brioche com mayo e Molho Just.',
    frase: 'Gorgonzola e geleia de damasco: a combinação perfeita.',
  },
};

// Diferenciais da home. Só o que for verdade e verificável.
export const diferenciais = [
  {
    titulo: 'Hambúrguer de 150 g',
    texto: 'Carne de 150 g no pão brioche com o Molho Just. Os mais pedidos: Top Smash, Just House e Dolce Gabana.',
  },
  {
    titulo: 'Feito para o delivery',
    texto: 'A Just nasceu no delivery: você pede pelo iFood e o burger sai da cozinha mais perto da sua casa.',
  },
  {
    titulo: 'Quatro cozinhas, um padrão',
    texto: 'Mesma receita na Zona Leste, em Pirituba, em Guarulhos e em São Bernardo do Campo.',
  },
];

// Unidades. Cada uma vira /unidades/<slug>/ — é o que faz aparecer em "hamburgueria em Guarulhos".
export const lojas = [
  {
    slug: 'zona-leste-vila-buenos-aires',
    nome: 'Just Burger Zona Leste',
    bairro: 'Vila Buenos Aires', // bairro dos Correios (CEP 03627-010, Rua Peixoto)
    // Como a vizinhança chama a mesma região. Oficialmente (Prefeitura/GeoSampa) o ponto fica no
    // distrito Ponte Rasa (subprefeitura Ermelino Matarazzo), a ~300 m da divisa com Cangaíba (subprefeitura Penha).
    outrosNomes: ['Vila Fidelis Ribeiro', 'Jardim Popular'],
    regiaoConhecida: 'região da Penha',
    distritoOficial: 'Ponte Rasa', // GeoSampa; a página /entrega/ponte-rasa/ ganha os nomes acima
    preposicao: 'na',
    termoBusca: 'na Zona Leste', // como a página se apresenta no título
    cidade: 'São Paulo',
    regiao: 'Zona Leste',
    endereco: 'Rua Peixoto, 156', // endereço oficial (diretoria, 30/10/2026); corrigir o Guia do Hambúrguer, que mostra R. Santa Germana, 152
    cep: '03627-010',
    telefone: '(11) 2622-8800', // central (telefone e WhatsApp)
    geo: { lat: -23.5114779, lng: -46.5052967 }, // Rua Peixoto (OpenStreetMap); conferir o pino exato no Google Maps
    ifood: 'https://www.ifood.com.br/delivery/sao-paulo-sp/just-burger-hamburgueria-lanches--dog-vila-buenos-aires/8f8983b5-89d1-4a88-9e3a-88dc8c8d76de',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Vila+Buenos+Aires+São+Paulo',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Su'], abre: '11:00', fecha: '23:00' }, { dias: ['Fr', 'Sa'], abre: '11:00', fecha: '23:59' }], // iFood (ifood_horarios do Hub, 30/10/2026); quinta igual aos outros dias (Michael, 30/10) — falta cadastrar no iFood
    bairrosAtendidos: ['Vila Buenos Aires', 'Penha', 'Cangaíba', 'Vila Matilde', 'Ermelino Matarazzo'], // raio de 10 km (lista completa em bairros.json)
    intro:
      'A matriz da Just Burger fica na Vila Buenos Aires, que muita gente da vizinhança chama de Vila Fidelis Ribeiro ou Jardim Popular, na região da Penha, Zona Leste de São Paulo. Foi aqui que a receita da Just foi acertada e é daqui que sai o padrão das outras lojas.',
  },
  {
    slug: 'pirituba',
    nome: 'Just Burger Pirituba',
    bairro: 'Pirituba',
    preposicao: 'em',
    termoBusca: 'em Pirituba',
    superIfood: true, // Super Restaurante iFood (nível 5 de 5, jun-ago/2026, painel do Hub)
    cidade: 'São Paulo',
    regiao: 'Zona Norte', // Prefeitura de SP (GeoSampa): distrito Pirituba, região Norte 2
    endereco: 'Av. Raimundo Pereira de Magalhães, 3850', // CNPJ 31.394.735/0004-13 (Receita Federal), Jardim Íris
    cep: '05145-200',
    telefone: '(11) 2622-8800',
    geo: { lat: -23.4940394, lng: -46.7310058 }, // OpenStreetMap (avenida no CEP); conferir o pino no Google Maps
    ifood: 'https://www.ifood.com.br/delivery/sao-paulo-sp/just-burger-pirituba-jardim-iris/b1f195b5-8ec5-4b9a-ae71-cd55d969a4df', // merchant do iFood (Hub)
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Pirituba',
    horarios: [{ dias: ['Tu', 'We', 'Th'], abre: '18:00', fecha: '23:00' }, { dias: ['Fr', 'Sa'], abre: '18:00', fecha: '23:59' }, { dias: ['Su'], abre: '17:30', fecha: '23:00' }], // iFood (ifood_horarios do Hub, 30/10/2026)
    bairrosAtendidos: ['Pirituba', 'Jaraguá', 'São Domingos', 'Vila Mangalot', 'Parque São Domingos'],
    intro:
      'Pirituba é a unidade mais nova da Just Burger e leva para a região a mesma receita da matriz, preparada na hora e entregue pelo iFood.',
  },
  {
    slug: 'guarulhos',
    nome: 'Just Burger Guarulhos',
    bairro: 'Vila Endres',
    preposicao: 'em',
    termoBusca: 'em Guarulhos',
    cidade: 'Guarulhos',
    regiao: 'Grande São Paulo',
    endereco: 'Rua Espanhola, 470', // CNPJ 31.394.735/0003-32 (Receita Federal)
    cep: '07043-060',
    telefone: '(11) 2622-8800',
    geo: { lat: -23.4833176, lng: -46.5482269 }, // OpenStreetMap (rua); conferir o pino no Google Maps
    ifood: 'https://www.ifood.com.br/delivery/guarulhos-sp/just-burger-hamburgueria-lanches--dog-vila-endres/8432b620-27ea-48fb-bf3b-a0b76bbf3516',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Vila+Endres+Guarulhos',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '17:00', fecha: '23:00' }], // iFood (ifood_horarios do Hub, 30/10/2026)
    bairrosAtendidos: ['Vila Endres', 'Itapegica', 'Vila Augusta', 'Ponte Grande', 'Porto da Igreja', 'Tranquilidade'],
    intro:
      'A unidade de Guarulhos fica na Vila Endres e leva o burger da Just para quem mora e trabalha em Guarulhos, com entrega pelo iFood.',
  },
  {
    slug: 'sao-bernardo-do-campo',
    nome: 'Just Burger São Bernardo',
    bairro: 'Baeta Neves',
    preposicao: 'em',
    termoBusca: 'em São Bernardo do Campo',
    superIfood: true, // Super Restaurante iFood (nível 5 de 5, jun-ago/2026, painel do Hub)
    cidade: 'São Bernardo do Campo',
    regiao: 'ABC Paulista',
    endereco: 'Av. Getúlio Vargas, 600', // CNPJ 31.394.735/0002-51 (Receita Federal), lotes 38 e 39
    cep: '09751-250',
    telefone: '(11) 2622-8800',
    geo: { lat: -23.6857582, lng: -46.5448592 }, // OpenStreetMap (avenida); conferir o pino no Google Maps
    ifood: 'https://www.ifood.com.br/delivery/sao-bernardo-do-campo-sp/just-burger-hamburgueria-lanches--dog-baeta-neves/aa6576e8-574e-42c5-8d38-0d7df31f3fcc',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Baeta+Neves+São+Bernardo+do+Campo',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '17:00', fecha: '23:00' }], // iFood (ifood_horarios do Hub, 30/10/2026)
    bairrosAtendidos: ['Baeta Neves', 'Centro de São Bernardo', 'Nova Petrópolis', 'Anchieta', 'Jardim Stella (Santo André)', 'Jardim Las Vegas (Santo André)'], // o iFood mostra a mesma loja atendendo parte de Santo André
    intro:
      'No ABC, a Just Burger fica no Baeta Neves e atende São Bernardo do Campo (e parte de Santo André) com a mesma receita da matriz.',
  },
];

// Cardápio. "id" é usado nos links (/cardapio/#id) e no nome da foto:
// assets/img/cardapio/<id>.webp (ver preparar-fotos.py).
export const cardapio = [
  // Reserva: só é usado se o cardápio do iFood (cardapio-ifood.json, robô do Hub) não estiver disponível.
  {
    categoria: 'Hambúrguers',
    itens: [
      { id: 'top-smash-top-1-mais-vendido', nome: 'Top Smash', descricao: 'Pão brioche, hambúrguer de 150 g, bacon, cheddar, queijo prato, cebola caramelizada, picles, mayo e Molho Just.', preco: '' },
      { id: 'just-house-top-2-mais-vendido', nome: 'Just House', descricao: 'Pão brioche, hambúrguer de 150 g, cheddar, mayo, cebola roxa, bacon e Molho Just.', preco: '' },
      { id: 'dolce-gabana-top-4-mais-vendido', nome: 'Dolce Gabana', descricao: 'Pão brioche, hambúrguer de 150 g, gorgonzola, geleia de damasco, farofa de bacon, mayo e Molho Just.', preco: '' },
      { id: 'just-burger-hamburguer-de-150-g', nome: 'Just Burger', descricao: 'Pão brioche, hambúrguer de 150 g, queijo, cebola, mayo e Molho Just.', preco: '' },
    ],
  },
];

// Páginas por perfil (/para-voce/<slug>/). Cada uma responde "o que eu peço?" para um tipo
// de cliente e liga para produtos específicos do cardápio (por id).
export const perfis = [
  {
    slug: 'primeira-vez',
    nome: 'Primeira vez na Just',
    chamada: 'Comece pelos mais vendidos.',
    resposta:
      'Comece pelo Top Smash, o lanche mais vendido da Just: hambúrguer de 150 g com bacon, cheddar, queijo prato e cebola caramelizada no pão brioche. O segundo mais pedido é o Just House. Com mais fome, o Just Combo 1 traz o Top Smash com batata e refrigerante.',
    texto: [
      'Quem pede pela primeira vez quer acertar, e os clientes já escolheram: no iFood, o Top Smash é o 1º mais vendido e o Just House, com cheddar, bacon e cebola roxa, é o 2º.',
      'Se estiver com mais fome, vá de combo: o lanche chega com batata palito e refrigerante.',
    ],
    produtos: ['top-smash-top-1-mais-vendido', 'just-house-top-2-mais-vendido', 'just-combo-1-burguer-batata-refri'],
    perguntas: [
      { p: 'Qual o lanche mais vendido da Just Burger?', r: 'O Top Smash é o 1º mais vendido no iFood; o Just House é o 2º e o Dolce Gabana está entre os 4 mais vendidos.' },
      { p: 'O que é o Molho Just?', r: 'É o molho da casa, que vai na maioria dos burgers da Just.' },
    ],
  },
  {
    slug: 'fome-grande',
    nome: 'Fome de verdade',
    chamada: 'Para quem não quer passar vontade.',
    resposta:
      'Com muita fome, vá de Double Smash ou Double Burger Day: os dois levam duas carnes de 150 g. Para a refeição completa, o Just Combo 1 vem com Top Smash, batata e refrigerante.',
    texto: [
      'Os burgers da Just já têm 150 g de carne. Nas versões double são duas carnes de 150 g, 300 g no total.',
      'Para acompanhar, a Batata Palito Grande tem 400 g.',
    ],
    produtos: ['double-smash-2-hamburguer-de-150-gr', 'double-burger-day', 'just-combo-1-burguer-batata-refri'],
    perguntas: [{ p: 'Qual o maior lanche da Just Burger?', r: 'Os doubles: Double Smash e Double Burger Day, com duas carnes de 150 g cada.' }],
  },
  {
    slug: 'para-dividir',
    nome: 'Galera, família e casal',
    chamada: 'Pedido para mais de uma pessoa.',
    resposta:
      'Para duas pessoas, o Combo 2 traz dois lanches à sua escolha, batata grande e refrigerante de 600 ml. Também tem o Passado em Dobro (dois Just Passado) e o Just Chicken Supreme, com 12 unidades de frango empanado para dividir.',
    texto: [
      'Pedido em grupo dá certo quando cada um escolhe o seu lanche e existe algo para beliscar no meio. O Just Chicken Supreme e a batata grande cumprem esse papel.',
      'Dica: faça um pedido único pelo iFood para tudo chegar no mesmo horário e economizar na taxa de entrega.',
    ],
    produtos: ['combo-2-lanches-a-sua-escolha-batata-grande-refri-de-600ml', '2-just-passado', 'just-chicken-supreme-seara'],
    perguntas: [{ p: 'A Just Burger tem combo para duas pessoas?', r: 'Sim: o Combo 2 tem dois lanches à sua escolha, batata grande e refrigerante de 600 ml.' }],
  },
  {
    slug: 'custo-beneficio',
    nome: 'Quer gastar pouco',
    chamada: 'O melhor pedido pelo menor valor.',
    resposta:
      'Para gastar pouco, o Just Burger é o lanche de entrada da casa (150 g no pão brioche) e o Combo Just Burger leva lanche, batata e refrigerante num pedido só. Pedido mínimo no iFood: R$ 20,00.',
    texto: [
      'Combo quase sempre sai mais barato do que os itens separados. Vale olhar as promoções da loja no iFood antes de fechar o pedido: a Just costuma ter itens com preço promocional.',
    ],
    produtos: ['just-burger-hamburguer-de-150-g', 'combo-just-burger-burguer-batata-refri', '2-just-passado'],
    perguntas: [{ p: 'Qual o pedido mínimo da Just Burger?', r: 'O pedido mínimo no iFood é de R$ 20,00 (pode variar por unidade).' }],
  },
  {
    slug: 'fa-de-smash',
    nome: 'Fã de smash burger',
    chamada: 'Carne prensada na chapa, com crosta.',
    resposta:
      'Os smash da Just estão na linha Turma da Canetinha: Just Moun (1 carne smash de 80 g), Just Jaro (2 carnes smash) e Just Ozem (2 carnes smash com molho rosé), todos no pão brioche.',
    texto: [
      'No smash, a bola de carne é prensada na chapa muito quente. A carne fica fina, sela rápido e ganha uma crosta caramelizada, que é o que dá o sabor característico.',
      'Para quem prefere hambúrguer alto, os clássicos da casa têm 150 g, como o Top Smash e o Just House.',
    ],
    produtos: ['just-moun', 'just-jaro', 'just-ozem'],
    perguntas: [
      { p: 'O que é smash burger?', r: 'É o hambúrguer em que a carne é prensada na chapa quente, ficando fina e com crosta caramelizada.' },
    ],
  },
  {
    slug: 'frango-e-outras-carnes',
    nome: 'Prefere frango',
    chamada: 'Nem todo mundo quer carne bovina.',
    resposta:
      'Para quem prefere frango: Just Chicken (frango especial temperado no pão de gergelim), Just Pic (dois frangos grelhados) e, para beliscar, o Just Chicken Supreme (12 unidades) e o Just Franguito.',
    texto: [
      'A linha de frango da Just tem lanche com frango temperado, lanche com frango grelhado e porções de frango empanado.',
      'Também há saladas e um prato fitness com filé de frango grelhado (veja "Quer algo mais leve").',
    ],
    produtos: ['just-chicken', 'just-pic', 'just-chicken-supreme-seara', 'just-franguito-2'],
    perguntas: [{ p: 'A Just Burger tem opção vegetariana?', r: 'Há saladas no cardápio (Just Garden, Tradicional, Cheese, Completa).' }],
  },
  {
    slug: 'mais-leve',
    nome: 'Quer algo mais leve',
    chamada: 'Saladas e prato fitness.',
    resposta:
      'Para algo mais leve, a Just tem saladas individuais (Just Garden, Caesar, Tradicional, Cheese e Completa) e o Prato Fitness, com filé de frango grelhado, legumes e ovo.',
    texto: ['As saladas são para uma pessoa e saem da mesma cozinha dos burgers, pelo mesmo pedido no iFood.'],
    produtos: ['just-garden', 'salada-caesar', 'prato-fitness'],
    perguntas: [{ p: 'A Just Burger tem salada?', r: 'Sim: Just Garden, Caesar, Tradicional, Cheese, Completa e a Salada Especial, além do Prato Fitness.' }],
  },
  {
    slug: 'sobremesa',
    nome: 'Para a sobremesa',
    chamada: 'Shake, pudim e sorvete.',
    resposta:
      'Para fechar o pedido: milk-shakes Just Shake de 300 ml (Ninho com Nutella, Nutella, Ninho, Morango, Pistache e Café), pudim de brigadeirão, Franuí e sorvetes Ben & Jerry\'s.',
    texto: ['A sobremesa vem no mesmo pedido do iFood, junto com o lanche.'],
    produtos: ['milk-shake-de-ninho-com-nutella-300ml', 'pudim-de-brigadeirao-de-chocolate', 'franui-chocolate-ao-leite'],
    perguntas: [{ p: 'A Just Burger tem milk-shake?', r: 'Sim, os Just Shake de 300 ml: Ninho com Nutella, Nutella, Ninho, Morango, Pistache e Café.' }],
  },
];

// Perguntas frequentes da home. Respostas curtas e diretas: é o formato que
// buscadores e assistentes de IA usam para citar o site.
export const faq = [
  {
    p: 'Onde fica a Just Burger?',
    r: 'A Just Burger tem quatro unidades: Vila Buenos Aires (Rua Peixoto, 156, Zona Leste de São Paulo), Pirituba (São Paulo), Vila Endres (Guarulhos) e Baeta Neves (São Bernardo do Campo).',
  },
  {
    p: 'Como pedir na Just Burger?',
    r: 'Os pedidos são feitos pelo iFood. Em cada página de unidade há o link direto para a loja certa no iFood.',
  },
  {
    p: 'Qual o lanche mais vendido da Just Burger?',
    r: 'O Top Smash é o 1º mais vendido no iFood, seguido do Just House. O Dolce Gabana está entre os 4 mais vendidos. Todos levam hambúrguer de 150 g no pão brioche.',
  },
  {
    p: 'Qual o horário da Just Burger?',
    r: 'As unidades abrem a partir das 18h. O horário de cada loja está na página dela e no iFood.',
  },
];

// Na mídia (/na-midia/). Só links para o original — o texto e as fotos são de cada veículo.
// tipo: 'materia' | 'video' | 'guia' | 'case'. Para vídeo do YouTube, preencher youtube: '<id>' (a capa vem sozinha).
// imagem: só foto PRÓPRIA da Just (assets/img/midia/...) ou com autorização do veículo.
export const midia = [
  {
    tipo: 'video',
    veiculo: 'Raphael Silva · YouTube',
    titulo: 'EP 1: O segredo do maior delivery do Brasil (Maikon Rangel, Just Burger)',
    data: '2023',
    url: 'https://www.youtube.com/watch?v=lSlosRHjGHY',
    youtube: 'lSlosRHjGHY',
    resumo: 'Maikon Rangel conta como a Just Burger chegou ao topo do delivery.',
  },
  {
    tipo: 'video',
    veiculo: 'Raphael Silva · YouTube',
    titulo: 'Just Burger: os bastidores de uma das maiores hamburguerias do Brasil',
    data: '2026',
    url: 'https://www.youtube.com/watch?v=W-RG0fWdwG4',
    youtube: 'W-RG0fWdwG4',
    resumo: 'Os bastidores da operação da Just Burger em 2026.',
  },
  {
    tipo: 'video',
    veiculo: 'Raphael Silva · YouTube',
    titulo: 'Marca vs branding no delivery: o que faz a Just Burger ser a maior do iFood?',
    data: '2025',
    url: 'https://www.youtube.com/watch?v=gfK-fc5MDmY',
    youtube: 'gfK-fc5MDmY',
    resumo: 'Como a marca Just Burger foi construída no delivery.',
  },
  {
    tipo: 'video',
    veiculo: 'Donos de Restaurantes · YouTube',
    titulo: '3 pedidos por minuto: o segredo da cozinha ultra veloz (Maikon Rangel, Just Burger)',
    data: '2026',
    url: 'https://www.youtube.com/watch?v=CIN0kJGCVEE',
    youtube: 'CIN0kJGCVEE',
    resumo: 'Episódio 150 do podcast de Marcelo Marani sobre a cozinha da Just Burger.',
  },
  {
    tipo: 'video',
    veiculo: 'Rolê na Operação · YouTube',
    titulo: 'O segredo por trás do Just Burger',
    data: '2026',
    url: 'https://www.youtube.com/watch?v=8M-2pY1_ZQE',
    youtube: '8M-2pY1_ZQE',
    resumo: 'Rodrigo Barros visita a operação da Just Burger.',
  },
  {
    tipo: 'video',
    veiculo: 'Falando de Delivery · YouTube',
    titulo: 'Evento Gigantes do Delivery: Guilherme (Grupo Rão), Maikon (Just Burger) e Pedro (Rede Azilados)',
    data: '2024',
    url: 'https://www.youtube.com/watch?v=8RwsjN17w6I',
    youtube: '8RwsjN17w6I',
    resumo: 'Maikon Rangel no palco do evento Gigantes do Delivery.',
  },
  {
    tipo: 'video',
    veiculo: 'Maicão na Carona · YouTube',
    titulo: 'O sucesso da Just Burger no delivery',
    data: '2025',
    url: 'https://www.youtube.com/watch?v=R3akf0r5OeE',
    youtube: 'R3akf0r5OeE',
    resumo: 'Conversa sobre o crescimento da Just Burger no delivery.',
  },
  {
    tipo: 'materia',
    veiculo: 'Clube de Criação',
    titulo: 'Combate à fome',
    data: '2021-05-28',
    url: 'https://clubedecriacao.com.br/ultimas/combate-a-fome-2/',
    resumo: 'Registro da campanha "Por Todas as Mesas", que teve o hambúrguer com QR code da Just Burger como ativação.',
  },
  {
    tipo: 'materia',
    veiculo: 'iFood · Blog de Parceiros',
    titulo: 'Especialista indica como montar uma hamburgueria delivery',
    data: '2023-11-28',
    url: 'https://blog-parceiros.ifood.com.br/hamburgueria-delivery/',
    resumo: 'Maikon Rangel, diretor da Just Burger e Expert iFood, dá dicas para montar uma hamburgueria de delivery.',
  },
  {
    tipo: 'materia',
    veiculo: 'Portal Sabores',
    titulo: 'Empresas que atuam com delivery terão um dia de imersão para potencializar negócios em Fortaleza',
    data: '2022-11-22',
    url: 'https://portalsabores.com.br/empresas-que-atuam-com-delivery-terao-um-dia-de-imersao-para-potencializar-negocios-em-fortaleza/',
    resumo: 'Maikon Rangel, da Just Burger, entre os palestrantes de um dia de imersão em delivery em Fortaleza.',
  },
  {
    tipo: 'materia',
    veiculo: 'iFood · Notícias',
    titulo: 'O que são as dark kitchens e como elas estão se expandindo?',
    data: '2023-10-30',
    url: 'https://institucional.ifood.com.br/noticias/o-que-sao-as-dark-kitchens-e-como-elas-estao-se-expandindo/',
    resumo: 'Maikon Rangel conta por que a Just Burger nasceu 100% delivery: um estudo mostrou que a região não tinha delivery de qualidade.',
  },
  {
    tipo: 'video',
    veiculo: 'Falando de Delivery · YouTube',
    titulo: 'Ep 01 | Just Burger e Kitchen Central: como bombar de vender no delivery da forma certa',
    data: '2021',
    url: 'https://www.youtube.com/watch?v=xjfp81p9lsE',
    youtube: 'xjfp81p9lsE',
    resumo: 'O primeiro episódio do podcast Falando de Delivery conta a história da Just Burger.',
  },
  {
    tipo: 'video',
    veiculo: 'Falando de Delivery · YouTube',
    titulo: 'Ep 44 | Como empreender em casal ou família? (Juliana e Maikon da Just Burger)',
    data: '2023',
    url: 'https://www.youtube.com/watch?v=9rHGvTRfxHs',
    youtube: '9rHGvTRfxHs',
    resumo: 'Juliana e Maikon, fundadores da Just Burger, falam sobre tocar o negócio juntos.',
  },
  {
    tipo: 'video',
    veiculo: 'iFood para Parceiros · YouTube',
    titulo: 'Como a Just Burger se diferenciou da concorrência e escalou no delivery',
    data: '2025',
    url: 'https://www.youtube.com/watch?v=3LWBLZ1NZ-8',
    youtube: '3LWBLZ1NZ-8',
    resumo: 'O canal oficial do iFood para restaurantes mostra como a Just Burger cresceu no delivery.',
  },
  {
    tipo: 'video',
    veiculo: 'Hambúrguer Perfeito · YouTube',
    titulo: 'Invadimos o Just Burger, sensação do delivery paulistano',
    data: '2021',
    url: 'https://www.youtube.com/watch?v=a742uPTdHss',
    youtube: 'a742uPTdHss',
    resumo: 'Visita à cozinha da Just Burger na Zona Leste de São Paulo.',
  },
  {
    tipo: 'materia',
    veiculo: 'Meio & Mensagem',
    titulo: 'Coca cria hambúrguer com QR code em ação contra fome',
    data: '2021-05-28',
    url: 'https://www.meioemensagem.com.br/comunicacao/coca-cola-estampa-qr-code-em-hamburguer-em-acao-contra-fome',
    resumo: 'No Dia do Hambúrguer, a Coca-Cola e a Just Burger lançaram o combo "Not Just a Burger" com QR code no pão, levando à campanha Brasil Sem Fome.',
  },
  {
    tipo: 'guia',
    veiculo: 'Rodrigues e Tecelão Arquitetura',
    titulo: 'Projeto de Arquitetura Just Burger',
    data: '2020-10',
    url: 'https://www.rodriguesetecelao.com/projeto-arquitetura-em-sao-paulo/just-burguer',
    resumo: 'O projeto da loja da Zona Leste: estilo industrial, pensado para o delivery, com espaço feito para fotos e redes sociais.',
  },
  {
    tipo: 'guia',
    veiculo: 'Guia do Hambúrguer',
    titulo: 'Just Burger',
    data: '',
    url: 'https://guiadohamburguer.com/hamburgueria/just-burger/',
    resumo: 'Ficha da Just Burger no maior site especializado em hambúrguer do Brasil.',
  },
  {
    tipo: 'guia',
    veiculo: 'Guia Abrasel SP',
    titulo: 'Just Burger Hamburgueria ABC',
    data: '',
    url: 'https://www.guiaabraselsp.com.br/just-burger-hamburgueria-abc',
    resumo: 'A unidade do ABC no guia de bares e restaurantes da Abrasel São Paulo.',
  },
];

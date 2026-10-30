// Tudo o que aparece no site sai deste arquivo. Edite aqui e rode `node build.mjs`.
// "PREENCHER" = dado que falta. "conferir: true" = dado tirado de páginas públicas do iFood
// (busca do Google, out/2026) que precisa ser confirmado por alguém da Just antes de publicar.

export const site = {
  // Domínio definitivo do site (sem barra no final). Usado em canonical, sitemap e schema.
  url: 'https://www.justburger.com.br',
  nome: 'Just Burger',
  nomeIfood: 'Just Burger Hamburgueria Lanches & Dog', // nome igual ao do iFood/Google ajuda o Google a ligar as fichas
  descricaoCurta: 'Hamburgueria de smash burger em São Paulo, Guarulhos e São Bernardo do Campo',
  // false = páginas saem com "noindex" (Google não indexa). Só trocar para true
  // quando todos os PREENCHER estiverem resolvidos e o domínio estiver no ar.
  publicado: false,
  fundacao: '2018', // conferir: CNPJ 31.394.735/0001-70 aberto em 31/08/2018; o blog do iFood fala em "início da pandemia" (2020)
  telefoneCentral: '', // PREENCHER (formato +55 11 9XXXX-XXXX) ou deixar vazio
  emailContato: '', // PREENCHER (ex.: contato@justburger.com.br) ou deixar vazio
  instagram: 'https://www.instagram.com/justburgersp/',
  pedidoMinimo: '20,00', // conferir: valor mostrado no iFood
  // Preço em site é oferta (CDC art. 30) e envelhece rápido. Com false, o site mostra
  // "ver preço no iFood"; os preços continuam só nos dados para robôs (dados.json).
  mostrarPrecos: false,
  faixaPreco: '$$',
  googleSiteVerification: '',
  // Páginas de bairro pequeno sem sub-bairros saem com noindex (risco de "página-isca" no Google).
  indexarBairrosPequenos: false,
  // Painel de números da home: BASE informada pela Just + o que a função contadorSite soma desde
  // que entrou no ar (site_publico/contador: pedidos novos e pedidos prontos, iFood + Keeta + Saipos).
  // lanches = (base de pedidos + pedidos prontos desde então) × lanchesPorPedido.
  contador: {
    url: 'https://justburger-producao-e9b27-default-rtdb.firebaseio.com/site_publico/contador.json',
    basePedidos: 3100000, // informado pelo Maikon em 30/10/2026
    lanchesPorPedido: 2.4, // conferir: 2,4 ou 2,5? (as duas aparecem no pedido)
    rotuloPedidos: 'pedidos feitos',
    rotuloLanches: 'lanches vendidos',
  },
  // Painel de avaliações: nota e quantidade de cada loja no iFood (robô diário do just-burger-producao).
  // notaInformada: aparece já no HTML (todas as lojas) até o robô trazer a nota e a quantidade do iFood.
  avaliacoes: {
    url: 'https://systembria.github.io/just-burger-producao/site-dados/avaliacoes-just-burger.json',
    notaInformada: 4.9, // nota no iFood das 4 lojas, informada pelo Maikon em 30/10/2026
  },
  // Burger flutuando no topo da home: recorte (sem fundo) do produto com este nome, gerado pelo robô
  // a partir da foto do iFood. Sem recorte, usa `imagem` (PNG/WebP transparente) e, sem ela, o logo.
  heroi: { produto: 'Dolce Cabana', imagem: 'assets/img/heroi-dolce-cabana.webp', alt: 'Dolce Cabana, burger da Just Burger' },
};

// Diferenciais da home. Só o que for verdade e verificável.
export const diferenciais = [
  {
    titulo: 'Smash de verdade',
    texto: 'Carne prensada na chapa bem quente até formar crosta, montada no pão brioche com o Molho Just.',
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
    endereco: 'PREENCHER', // conflito na internet: Rua Santa Germana, 152 (Guia do Hambúrguer) x Rua Peixoto, 156 (Delivery Direto) — definir UM e corrigir nos outros
    cep: 'PREENCHER',
    telefone: '(11) 2682-0227', // conferir: telefone do Guia do Hambúrguer
    geo: { lat: -23.5125411, lng: -46.5049994 }, // conferir: coordenadas do Guia do Hambúrguer
    ifood: 'https://www.ifood.com.br/delivery/sao-paulo-sp/just-burger-hamburgueria-lanches--dog-vila-buenos-aires/8f8983b5-89d1-4a88-9e3a-88dc8c8d76de',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Vila+Buenos+Aires+São+Paulo',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '18:00', fecha: '23:30' }], // PREENCHER: o iFood mostra abertura às 18h; confirmar fechamento
    bairrosAtendidos: ['Vila Buenos Aires', 'Penha', 'Cangaíba', 'Vila Matilde', 'Ermelino Matarazzo'], // PREENCHER: confirmar raio de entrega
    intro:
      'A matriz da Just Burger fica na Vila Buenos Aires, que muita gente da vizinhança chama de Vila Fidelis Ribeiro ou Jardim Popular, na região da Penha, Zona Leste de São Paulo. Foi aqui que a receita do smash foi acertada e é daqui que sai o padrão das outras lojas.',
  },
  {
    slug: 'pirituba',
    nome: 'Just Burger Pirituba',
    bairro: 'Pirituba',
    preposicao: 'em',
    termoBusca: 'em Pirituba',
    cidade: 'São Paulo',
    regiao: 'Zona Norte', // Prefeitura de SP (GeoSampa): distrito Pirituba, região Norte 2
    endereco: 'Av. Raimundo Pereira de Magalhães, PREENCHER número', // conferir: filial no CNPJ (Jardim Íris)
    cep: 'PREENCHER',
    telefone: '',
    geo: null,
    ifood: 'https://www.ifood.com.br/PREENCHER',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Pirituba',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '18:00', fecha: '23:30' }],
    bairrosAtendidos: ['Pirituba', 'Jaraguá', 'São Domingos', 'Vila Mangalot', 'Parque São Domingos'],
    intro:
      'Pirituba é a unidade mais nova da Just Burger e leva para a região a mesma receita da matriz, preparada na hora e entregue pelo iFood.',
  },
  {
    slug: 'guarulhos',
    nome: 'Just Burger Guarulhos',
    bairro: 'Vila Endres', // conferir: bairro mostrado no iFood
    preposicao: 'em',
    termoBusca: 'em Guarulhos',
    cidade: 'Guarulhos',
    regiao: 'Grande São Paulo',
    endereco: 'PREENCHER: rua e número',
    cep: 'PREENCHER',
    telefone: '',
    geo: null,
    ifood: 'https://www.ifood.com.br/delivery/guarulhos-sp/just-burger-hamburgueria-lanches--dog-vila-endres/8432b620-27ea-48fb-bf3b-a0b76bbf3516',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Vila+Endres+Guarulhos',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '18:00', fecha: '23:30' }],
    bairrosAtendidos: ['Vila Endres', 'PREENCHER'],
    intro:
      'A unidade de Guarulhos fica na Vila Endres e leva o smash da Just para quem mora e trabalha em Guarulhos, com entrega pelo iFood.',
  },
  {
    slug: 'sao-bernardo-do-campo',
    nome: 'Just Burger São Bernardo',
    bairro: 'Baeta Neves', // conferir: bairro mostrado no iFood
    preposicao: 'em',
    termoBusca: 'em São Bernardo do Campo',
    cidade: 'São Bernardo do Campo',
    regiao: 'ABC Paulista',
    endereco: 'PREENCHER: rua e número',
    cep: 'PREENCHER',
    telefone: '',
    geo: null,
    ifood: 'https://www.ifood.com.br/delivery/sao-bernardo-do-campo-sp/just-burger-hamburgueria-lanches--dog-baeta-neves/aa6576e8-574e-42c5-8d38-0d7df31f3fcc',
    googleMaps: 'https://maps.google.com/?q=Just+Burger+Hamburgueria+Baeta+Neves+São+Bernardo+do+Campo',
    horarios: [{ dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], abre: '18:00', fecha: '23:30' }],
    bairrosAtendidos: ['Baeta Neves', 'PREENCHER'], // o iFood mostra a mesma loja atendendo parte de Santo André
    intro:
      'No ABC, a Just Burger fica no Baeta Neves e atende São Bernardo do Campo (e parte de Santo André) com a mesma receita da matriz.',
  },
];

// Cardápio. "id" é usado nos links (/cardapio/#id) e no nome da foto:
// assets/img/cardapio/<id>.webp (ver preparar-fotos.py).
export const cardapio = [
  {
    categoria: 'Smash burgers',
    itens: [
      {
        id: 'just-smash',
        nome: 'Just Smash',
        descricao: 'Pão brioche, 1 carne smash de 80 g, queijo prato, Molho Just, alface americana e tomate.',
        preco: '32,90',
        conferir: true, // nome do item a confirmar; descrição e preço vistos no iFood
      },
      { id: 'top-smash', nome: 'Top Smash', descricao: 'PREENCHER: ingredientes.', preco: '', conferir: true },
      { id: 'double-smash', nome: 'Double Smash', descricao: 'Dois hambúrgueres smash. PREENCHER: gramatura e ingredientes.', preco: '', conferir: true },
      { id: 'just-calabria', nome: 'Just Calabria', descricao: 'Hambúrguer de calabresa. PREENCHER: ingredientes.', preco: '', conferir: true },
      { id: 'just-burger-day', nome: 'Just Burger Day', descricao: 'PREENCHER: ingredientes.', preco: '', conferir: true },
    ],
  },
  {
    categoria: 'Combos',
    itens: [
      { id: 'just-combo-1', nome: 'Just Combo 1', descricao: 'Burger + batata + refrigerante.', preco: '52,90', conferir: true },
      { id: 'combo-just-passado', nome: 'Combo Just Passado', descricao: 'Burger + batata + refrigerante. PREENCHER: qual burger.', preco: '', conferir: true },
      { id: 'combo-top-smash', nome: 'Combo Top Smash', descricao: 'Top Smash + batata + refrigerante.', preco: '61,90', conferir: true },
    ],
  },
  {
    categoria: 'Frango',
    itens: [
      { id: 'just-balde-m-sassami', nome: 'Just Balde M Sassami', descricao: 'Balde médio com 500 g de sassami (tiras de peito de frango) empanado.', preco: '59,90', conferir: true },
    ],
  },
  {
    categoria: 'Bebidas',
    itens: [{ id: 'monster-mango-loco', nome: 'Monster Juice Mango Loco', descricao: 'Energético, lata.', preco: '', conferir: true }],
  },
];

// Páginas por perfil (/para-voce/<slug>/). Cada uma responde "o que eu peço?" para um tipo
// de cliente e liga para produtos específicos do cardápio (por id).
export const perfis = [
  {
    slug: 'primeira-vez',
    nome: 'Primeira vez na Just',
    chamada: 'Nunca pediu? Comece pelo clássico.',
    resposta:
      'Para o primeiro pedido, peça o Just Smash ou o Just Combo 1 (burger, batata e refrigerante). É a receita base da casa: carne smash com crosta, queijo prato e Molho Just no pão brioche.',
    texto: [
      'Quem pede pela primeira vez quer acertar. Por isso a recomendação é a receita que define a Just: um smash simples, sem excesso de ingredientes, onde dá para sentir a crosta da carne e o Molho Just.',
      'Se estiver com mais fome, vá de combo: o burger chega com batata e refrigerante, e sai mais em conta do que pedir tudo separado.',
    ],
    produtos: ['just-smash', 'just-combo-1', 'top-smash'],
    perguntas: [
      { p: 'Qual o lanche mais pedido da Just Burger?', r: 'PREENCHER: o item mais vendido segundo o iFood/sistema da loja.' },
      { p: 'O que é o Molho Just?', r: 'É o molho da casa, que vai nos smash burgers. PREENCHER: descrição curta (sem revelar receita).' },
    ],
  },
  {
    slug: 'fome-grande',
    nome: 'Fome de verdade',
    chamada: 'Para quem não quer passar vontade.',
    resposta:
      'Com muita fome, peça o Double Smash (duas carnes) ou o Combo Top Smash, que já vem com batata e refrigerante. Para dividir ou complementar, o Just Balde M Sassami traz 500 g de frango.',
    texto: [
      'Smash burger é fino por natureza: a carne é prensada para criar crosta. Por isso, quem tem fome grande deve ir direto nas versões com duas carnes.',
      'O combo resolve a refeição inteira em um pedido só, e o balde de sassami funciona como acompanhamento para mais de uma pessoa.',
    ],
    produtos: ['double-smash', 'combo-top-smash', 'just-balde-m-sassami'],
    perguntas: [
      { p: 'Qual o maior lanche da Just Burger?', r: 'O Double Smash, com duas carnes. PREENCHER: confirmar se há versão maior.' },
    ],
  },
  {
    slug: 'para-dividir',
    nome: 'Galera, família e casal',
    chamada: 'Pedido para mais de uma pessoa.',
    resposta:
      'Para dividir, combine um combo por pessoa com o Just Balde M Sassami (500 g de frango) no meio da mesa. Um pedido só, na unidade mais perto, chega tudo junto.',
    texto: [
      'Pedido em grupo dá certo quando cada um escolhe o seu burger e existe algo para beliscar no meio. O balde de sassami cumpre esse papel.',
      'Dica: faça um pedido único pelo iFood para tudo chegar no mesmo horário e economizar na taxa de entrega.',
    ],
    produtos: ['just-balde-m-sassami', 'just-combo-1', 'combo-top-smash'],
    perguntas: [{ p: 'A Just Burger tem combo para duas pessoas?', r: 'PREENCHER: confirmar se existe combo para 2 no cardápio atual.' }],
  },
  {
    slug: 'custo-beneficio',
    nome: 'Quer gastar pouco',
    chamada: 'O melhor pedido pelo menor valor.',
    resposta:
      'Para gastar pouco, o Just Smash é o burger de entrada da casa, e o Just Combo 1 é a forma mais econômica de levar burger, batata e refrigerante. Pedido mínimo no iFood: R$ 20,00.',
    texto: [
      'Combo quase sempre sai mais barato do que os itens separados. E vale olhar a aba de promoções da loja no iFood antes de fechar o pedido: a Just costuma ter itens com preço promocional.',
    ],
    produtos: ['just-smash', 'just-combo-1'],
    perguntas: [{ p: 'Qual o pedido mínimo da Just Burger?', r: 'O pedido mínimo no iFood é de R$ 20,00 (pode variar por unidade).' }],
  },
  {
    slug: 'fa-de-smash',
    nome: 'Fã de smash burger',
    chamada: 'Crosta, queijo derretido e pão brioche.',
    resposta:
      'Smash burger é a especialidade da Just. Para quem já é fã, a ordem é: Just Smash (a base), Top Smash (a versão completa) e Double Smash (duas carnes, mais crosta).',
    texto: [
      'No smash, a bola de carne é prensada na chapa muito quente. A carne fica fina, sela rápido e ganha uma crosta caramelizada que é o que dá o sabor característico.',
      'Na Just, o smash vai no pão brioche, com queijo prato derretendo direto sobre a carne e o Molho Just.',
    ],
    produtos: ['just-smash', 'top-smash', 'double-smash'],
    perguntas: [
      { p: 'O que é smash burger?', r: 'É o hambúrguer em que a carne é prensada na chapa quente, ficando fina e com crosta caramelizada.' },
    ],
  },
  {
    slug: 'frango-e-outras-carnes',
    nome: 'Prefere frango ou outra carne',
    chamada: 'Nem todo mundo quer carne bovina.',
    resposta:
      'Para quem não quer carne bovina, a Just tem o Just Balde M Sassami (500 g de tiras de frango empanado) e o Just Calabria, burger de calabresa.',
    texto: [
      'O sassami é o filé mais macio do peito de frango, servido em tiras empanadas. O Just Calabria troca o blend bovino por calabresa.',
      'PREENCHER: se houver burger de frango, opção vegetariana ou vegana, incluir aqui.',
    ],
    produtos: ['just-balde-m-sassami', 'just-calabria'],
    perguntas: [{ p: 'A Just Burger tem opção vegetariana?', r: 'PREENCHER: sim/não e qual item.' }],
  },
  {
    slug: 'alergias-e-restricoes',
    nome: 'Alergias e restrições',
    chamada: 'Antes de pedir, confira os ingredientes.',
    resposta:
      'Os burgers da Just levam pão brioche (que normalmente contém glúten, ovo e leite) e queijo prato (contém lactose). Quem tem alergia ou restrição deve falar com a loja pelo chat do iFood antes de pedir.',
    texto: [
      'A cozinha da Just manipula trigo, leite, ovos e carnes na mesma chapa e bancada, então não é possível garantir ausência de traços. PREENCHER: lista oficial de alérgenos por item, validada pela cozinha.',
      'Dá para pedir para tirar ingredientes (como alface, tomate ou molho) nas observações do pedido no iFood.',
    ],
    produtos: [],
    perguntas: [
      { p: 'A Just Burger tem pão sem glúten?', r: 'PREENCHER: sim/não.' },
      { p: 'Dá para tirar ingredientes do lanche?', r: 'Sim. Escreva nas observações do item no iFood (ex.: "sem tomate").' },
    ],
  },
];

// Perguntas frequentes da home. Respostas curtas e diretas: é o formato que
// buscadores e assistentes de IA usam para citar o site.
export const faq = [
  {
    p: 'Onde fica a Just Burger?',
    r: 'A Just Burger tem quatro unidades: Vila Buenos Aires (Zona Leste de São Paulo), Pirituba (São Paulo), Vila Endres (Guarulhos) e Baeta Neves (São Bernardo do Campo).',
  },
  {
    p: 'Como pedir na Just Burger?',
    r: 'Os pedidos são feitos pelo iFood. Em cada página de unidade há o link direto para a loja certa no iFood.',
  },
  {
    p: 'Qual a especialidade da Just Burger?',
    r: 'Smash burger: carne prensada na chapa quente, com crosta, queijo prato e Molho Just no pão brioche.',
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
    tipo: 'case',
    veiculo: 'iFood · Blog de Parceiros',
    titulo: 'Case de sucesso: Como a Integração Consumer e iFood ajudou a Just Burger a ser a Melhor',
    data: '2024-10-21',
    url: 'https://blog-parceiros.ifood.com.br/integracao-consumer-ifood/',
    resumo: 'O iFood conta como a Just Burger, Super Restaurante na plataforma, chega a cerca de 600 pedidos por noite com um dos tempos de entrega mais rápidos da cidade.',
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
    tipo: 'materia',
    veiculo: 'GKPB – Geek Publicitário',
    titulo: 'Coca-Cola faz ação solidária com QR Code em hambúrguer',
    data: '2021-05-28',
    url: 'https://gkpb.com.br/66630/coca-cola-qr-code-hamburguer/',
    resumo: 'A ação com a Just Burger, na Zona Leste de São Paulo, estampou um QR code no pão do lanche para incentivar doações.',
  },
  {
    tipo: 'materia',
    veiculo: 'Grandes Nomes da Propaganda',
    titulo: 'Coca-Cola apoia hambúrguer com QR Code que incentiva doação de alimentos',
    data: '2021-05-28',
    url: 'https://grandesnomesdapropaganda.com.br/anunciantes/coca-cola-apoia-hamburguer-com-qr-code-que-incentiva-doacao-de-alimentos/',
    resumo: 'Edição especial vendida pelo iFood, com QR code no pão que leva à campanha Por Todas as Mesas.',
  },
  {
    tipo: 'materia',
    veiculo: 'Publicitários Criativos',
    titulo: 'Coca-Cola lança hambúrguer com QR Code para convidar público a conhecer campanha de combate à fome',
    data: '2021-05',
    url: 'https://www.publicitarioscriativos.com/coca-cola-lanca-hamburguer-com-qr-code-para-convidar-publico-a-conhecer-campanha-de-combate-a-fome/',
    resumo: 'O combo especial da Just Burger convidava o cliente a escanear o pão e doar para a Ação da Cidadania.',
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
    veiculo: 'Marcas pelo Mundo',
    titulo: 'Coca-Cola apoia hambúrguer que incentiva doação de alimentos',
    data: '2021-05-28',
    url: 'https://marcaspelomundo.com.br/destaques/coca-cola-apoia-hamburguer-que-incentiva-doacao-de-alimentos/',
    resumo: 'Quem pediu na Just Burger no Dia do Hambúrguer recebeu o lanche com QR code no pão.',
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

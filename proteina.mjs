// Proteína aproximada dos lanches Just Burger, pelas médias da Just (base: bloco do Top Smash no iFood
// e tabela TACO/Unicamp). O site usa isto só enquanto a descrição do iFood não traz o bloco
// "Proteína (aproximada) por ...:" — quando traz, vale o texto do iFood.
// Pesos sem gramatura na descrição (frango do Just Chicken e do Just Pic, carne seca do Just Farm):
// médias aprovadas pelo Michael em 30/10/2026.

const I = {
  carne: ['Carne 150g', 28],
  carne2: ['Carne 2x 150g', 56],
  smash: ['Carne smash 80g', 15],
  smash2: ['Carne smash 2x 80g', 30],
  frangoJust: ['Frango temperado 120g', 30],
  frangoGrelhado2: ['Frango grelhado 2x 80g', 50],
  carneSeca: ['Carne seca desfiada 40g', 11],
  bacon: ['Bacon', 6],
  baconTriturado: ['Bacon triturado', 4],
  farofaBacon: ['Farofa de bacon', 4],
  cheddar: ['Queijo cheddar', 5],
  prato: ['Queijo prato', 4],
  prato2: ['Queijo prato 2x', 8],
  gorgonzola: ['Queijo gorgonzola', 6],
  coalho: ['Queijo coalho', 7],
  catupiry: ['Catupiry', 2],
  provolone: ['Provolone', 5],
  brioche: ['Pão brioche', 6],
  pao: ['Pão', 6],
  paoGergelim: ['Pão de gergelim', 6],
  paoAustraliano: ['Pão australiano', 6],
  molhos: ['Cebola/molhos', 1],
  salada: ['Alface/tomate/molhos', 1],
  batata: ['Batata palito 200g', 6],
};

const lanches = {
  'just burger': ['carne', 'prato', 'brioche', 'molhos'],
  'just passado': ['carne', 'prato', 'pao', 'salada'],
  'just house': ['carne', 'bacon', 'cheddar', 'brioche', 'molhos'],
  'just top smash': ['carne', 'bacon', 'cheddar', 'prato', 'brioche', 'molhos'],
  'top smash': ['carne', 'bacon', 'cheddar', 'prato', 'brioche', 'molhos'],
  'just chicken': ['frangoJust', 'paoGergelim', 'salada'],
  'just brasil': ['carne', 'coalho', 'bacon', 'brioche', 'molhos'],
  'catupi burger': ['carne', 'catupiry', 'baconTriturado', 'brioche', 'molhos'],
  'just cheddar melt': ['carne', 'cheddar', 'paoAustraliano', 'molhos'],
  'dolce gabana': ['carne', 'gorgonzola', 'bacon', 'farofaBacon', 'brioche', 'molhos'],
  'double burger day': ['carne2', 'bacon', 'prato', 'cheddar', 'paoGergelim', 'salada'],
  'just burger day': ['carne', 'bacon', 'prato', 'cheddar', 'paoGergelim', 'salada'],
  'just three cheese': ['carne', 'cheddar', 'catupiry', 'provolone', 'bacon', 'brioche', 'molhos'],
  'double smash': ['carne2', 'prato', 'cheddar', 'pao', 'molhos'],
  'just moun': ['smash', 'prato', 'brioche', 'salada'],
  'just jaro': ['smash2', 'prato', 'brioche', 'salada'],
  'just ozem': ['smash2', 'prato2', 'salada'],
  'just pic': ['frangoGrelhado2', 'prato2', 'salada'],
  'just farm': ['carne', 'carneSeca', 'coalho', 'brioche', 'molhos'],
  '2 just passado': ['carne', 'prato', 'pao', 'salada'], // por lanche (vêm dois)
};
// combo = lanche + batata palito individual (refrigerante não tem proteína)
const combos = {
  'combo just burger': 'just burger',
  'combo just passado': 'just passado',
  'combo just house': 'just house',
  'just combo 1': 'top smash',
  'combo just chicken': 'just chicken',
  'just combo 3': 'just cheddar melt',
};

const chave = (nome) => String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// A receita segue a descrição do item quando ela é passada: o Top Smash tem cadastros com e sem queijo
// prato no iFood, e algumas lojas usam pão tradicional em vez de brioche.
function ajusta(c, desc) {
  if (!desc) return c;
  if (c === 'prato' && !/prato|queijo\s*,\s*cheddar|\bqueijo\s*(\n|,|$)/i.test(desc)) return null;
  if (c === 'brioche' && !/brioche/i.test(desc)) return 'pao';
  return c;
}

// { por: 'lanche' | 'combo', linhas: [{ nome, g }], total } com g em número; null se não for lanche conhecido
export function receitaDe(nome, descricao = '') {
  const k = chave(nome);
  const lanche = combos[k] || k;
  if (!lanches[lanche]) return null;
  const itens = lanches[lanche].concat(combos[k] ? ['batata'] : []).map((c) => ajusta(c, descricao)).filter(Boolean)
    .map((c) => ({ nome: I[c][0], g: I[c][1] }));
  return { por: combos[k] ? 'combo' : 'lanche', linhas: itens, total: itens.reduce((s, l) => s + l.g, 0) };
}

// Texto no padrão do iFood (o mesmo do Top Smash, sem "~" e com "aproximada")
export function blocoIfood(r) {
  const col = (g) => `${g}g`.padEnd(6);
  return [`Proteína (aproximada) por ${r.por}:`, ...r.linhas.map((l) => `${col(l.g)}${l.nome}`), `${col(r.total)}Total`].join('\n');
}

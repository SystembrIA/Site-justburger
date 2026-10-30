// Gera a descrição nova de cada lanche para o iFood: descrição atual + bloco de proteína aproximada
// (proteina.mjs) + "Não Fazemos Trocas De Itens.". Lê cardapio-ifood.json. Saída em Markdown, para conferência.
// Uso: node ferramentas/descricoes-ifood.mjs > descricoes-ifood.md
import { readFileSync } from 'node:fs';
import { receitaDe, blocoIfood, pesosAConferir } from '../proteina.mjs';

const dados = JSON.parse(readFileSync(new URL('../cardapio-ifood.json', import.meta.url)));
const vistos = new Set();
const saida = ['# Just Burger: descrições com proteína (aproximada)', '',
  `Pesos a conferir pela cozinha: ${pesosAConferir.join(', ')}.`, ''];
for (const cat of dados.categorias) {
  for (const i of cat.itens) {
    const nome = i.nome.replace(/\s*-?\s*(hits|queridinhos)\s*$/i, '').split(/\s+-\s+/)[0].trim();
    const r = receitaDe(nome, i.descricao);
    if (!r) continue;
    const base = (i.descricao || '')
      .replace(/\s*prote[ií]na\s*\((estimativa|aproximada)\)[\s\S]*$/i, '')
      .replace(/\s*n[ãa]o fazemos trocas de itens\.?/gi, '')
      .split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
    const texto = `${base}\n\n${blocoIfood(r)}\n\nNão Fazemos Trocas De Itens.`;
    const marca = vistos.has(i.nome) ? ' (repetido em outra categoria)' : '';
    vistos.add(i.nome);
    saida.push(`## ${i.nome}${marca}`, `Categoria: ${cat.categoria}`, '', '```', texto, '```', '');
  }
}
console.log(saida.join('\n'));

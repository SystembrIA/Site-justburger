# Site Just Burger

Site institucional da hamburgueria: HTML estático gerado por um script em Node, sem framework
e sem JavaScript no navegador. Isso é o que deixa o site rápido (nota máxima de Core Web Vitals) e fácil de hospedar.

## Publicação

O workflow `.github/workflows/publicar.yml` gera o site e publica no GitHub Pages a cada push na `main`
e todo dia às 06:47 (depois do robô do `just-burger-producao`, trazendo cardápio, fotos e nota do iFood).
A pasta `publico/` não vai para o repositório: é gerada na publicação.

- Endereço provisório: https://systembria.github.io/site-justburger/ (com `noindex` até `site.publicado = true`).
- Domínio: Settings → Pages → Custom domain (publicando por Actions, o domínio fica nas configurações do
  repositório, sem arquivo CNAME) e apontar o DNS do domínio para o GitHub Pages.

## Como funciona

```
dados.mjs      ← TODO o conteúdo (lojas, cardápio, FAQ, textos). Só se edita aqui.
build.mjs      ← gera as páginas
assets/        ← CSS, logo, ícones
publico/       ← site pronto (gerado). É esta pasta que vai para o domínio.
```

```bash
node build.mjs                     # gera publico/
cd publico && python3 -m http.server 8000   # ver em http://localhost:8000
```

## Páginas geradas

| Página | Busca que ela mira |
|---|---|
| `/` | hamburgueria em São Paulo / Just Burger |
| `/unidades/zona-leste-vila-buenos-aires/` | hamburgueria na Zona Leste, Vila Buenos Aires, Penha |
| `/unidades/pirituba/` | hamburgueria em Pirituba |
| `/unidades/guarulhos/` | hamburgueria em Guarulhos |
| `/unidades/sao-bernardo-do-campo/` | hamburgueria em São Bernardo do Campo |
| `/cardapio/` | cardápio Just Burger (cada produto tem âncora: `/cardapio/#double-smash`) |
| `/para-voce/<perfil>/` (7 páginas) | "o que pedir na Just", "maior lanche", "opção de frango", "pão sem glúten"… |
| `/sobre/` | marca / confiança (E-E-A-T) |

Cada página já sai com: `title` e `description` próprios, canonical, Open Graph (prévia no WhatsApp/Instagram),
breadcrumb e dados estruturados Schema.org (`Restaurant` por unidade com endereço, horário, área de entrega e
link de pedido; `Menu`; `FAQPage`; `Organization`). Também gera `sitemap.xml`, `robots.txt` e `404.html`.

## Preparado para IA e agentes

Assistentes (ChatGPT, Claude, Gemini, Perplexity) e agentes leem melhor texto limpo e dados estruturados do que HTML com layout. Por isso o build gera:

| Arquivo | Para quê |
|---|---|
| `/llms.txt` | resumo da marca + mapa do site (padrão llmstxt.org) |
| `/llms-full.txt` | todo o conteúdo em um único arquivo Markdown |
| `/<página>/index.md` | versão Markdown de cada página (ligada no `<head>` por `rel="alternate"`) |
| `/dados.json` | unidades, bairros atendidos, links de pedido, cardápio e perfis em JSON |
| `robots.txt` | libera explicitamente GPTBot, ClaudeBot, PerplexityBot, Google-Extended etc. (quando publicado) |

Toda página abre com uma **Resposta rápida** (2–3 frases que respondem a pergunta da página). É o trecho que pessoas com pressa leem e que a IA costuma citar.

## Cardápio e fotos direto do iFood (automático)

O JARVIS já copia o cardápio do iFood para o banco do Hub (`catalogo_ifood/copia/burger-penha`).
O workflow `dados-site.yml` do repositório `just-burger-producao` (todo dia às 06:17):

1. exporta a parte pública do cardápio (nome, descrição, preço, foto) — `exportar-cardapio-site.py`;
2. trata as fotos no padrão do site — `fotos-site.py`: recorte do produto com IA (rembg) sobre fundo
   preto, brilho laranja e sombra, 1200×900; produto cortado pela borda da foto ou recorte duvidoso
   vira a foto inteira dissolvendo no preto. Gera também o recorte sem fundo (`<id>-recorte.webp`);
3. publica tudo em `https://systembria.github.io/just-burger-producao/site-dados/`.

```bash
python3 importar-cardapio.py   # baixa cardápio + fotos prontas → cardapio-ifood.json e assets/img/cardapio/
node build.mjs                 # site usa o cardápio real; o "Dolce Cabana" recortado vira o destaque da home
```

Com `cardapio-ifood.json` presente, o cardápio de `dados.mjs` é ignorado. Perfis (`perfis[].produtos`)
acham o produto pelo começo do id (`double-smash` acha `double-smash-2-hamburguer-de-150-gr`); o build
avisa o que não achou.

## Bairros atendidos (raio de 10 km)

`bairros.json` lista cada distrito oficial de SP e cada bairro de Guarulhos, ABC, Osasco e vizinhas
dentro de 10 km de alguma unidade, com distância, direção, loja mais perto, vizinhos e os sub-bairros
(vilas, jardins, nomes alternativos) encontrados em cada um. Cada item vira `/entrega/<slug>/`;
o índice fica em `/entrega/`. Bairro pequeno sem sub-bairros sai com `noindex`
(`site.indexarBairrosPequenos`) para não parecer página-isca ao Google.

Como foi gerado: varredura de pontos a cada 1,2 km no raio de cada loja, perguntando ao
OpenStreetMap (Nominatim) o bairro de cada ponto, e cruzamento com os distritos oficiais da
Prefeitura de SP (GeoSampa). Para refazer (ex.: loja nova ou raio diferente), os scripts estão em
`ferramentas/` — mudar `LOJAS`/`RAIO` em `varrer-bairros.py` e `montar-bairros.py`.

Raio em linha reta não é a área real do iFood (que segue ruas e é definida por loja). Os textos dizem
"confirme seu endereço no iFood" de propósito.

## Painel de números, avaliações e burger flutuando (home)

- **Números históricos:** `site.contador.basePedidos` (3,1 mi, informado pela Just) + o que a função
  `contadorSite` (repositório `just-burger-producao`) soma desde que entrou no ar: cada pedido novo das
  lojas Burger soma 1 em pedidos; cada pedido pronto soma `lanchesPorPedido` em lanches. Fonte: monitor
  das lojas do JARVIS (iFood + Keeta + Saipos). Ao vivo pelo streaming do Firebase; sem conexão,
  mostra a base. A base aparece no HTML (Google e IA leem).
- **Avaliações:** nota e quantidade de cada loja no iFood, do JSON diário do robô `avaliacoes-site.py`.
  Média geral ponderada pela quantidade. Sem dado, o bloco não aparece. Sem schema de nota de propósito
  (o Google não aceita nota da própria empresa em dados estruturados).
- **Burger flutuando:** foto em `assets/img/heroi-dolce-cabana.webp` (fundo transparente, ~1200 px).

## Na mídia

Lista em `dados.mjs` → `midia`. Cada cartão abre o original em outra aba. Para vídeo do YouTube,
preencher `youtube: '<id do vídeo>'` (a capa vem do próprio YouTube). Foto em cartão de matéria: só
foto própria da Just ou com autorização do veículo (`imagem: 'assets/img/midia/arquivo.webp'`).

## Fotos manuais (fora do iFood)

`python3 preparar-fotos.py <pasta>` (arquivos com o id do produto) → 1200×900 e 600×450. Para o mesmo
visual de fundo preto, passe antes cada foto por `just-burger-producao/scripts/fotos-site.py foto.jpg saida.webp`.

## Antes de publicar (obrigatório)

`site.publicado` está `false`: todas as páginas saem com `noindex` e o `robots.txt` bloqueia tudo.
Isso é proposital, para o Google não indexar uma versão com dados de exemplo.

1. Trocar todos os `PREENCHER` de `dados.mjs` e confirmar os itens `conferir: true` (o build avisa quantos faltam).
   Nomes de produtos, bairros e links do iFood de 3 lojas foram tirados de páginas públicas do iFood — alguém da Just precisa confirmar.
2. **Rodar o workflow `dados-site.yml`** no just-burger-producao e depois `python3 importar-cardapio.py` (fotos e cardápio reais).
3. Endereço/telefone **idênticos** ao que está no Google Business Profile e no iFood (mesma grafia).
4. Apontar o domínio (`justburger.com.br`) para a pasta `publico/` (Cloudflare Pages, Netlify ou GitHub Pages em repositório próprio).
5. Mudar `site.publicado` para `true`, rodar `node build.mjs`, publicar.
6. Cadastrar o domínio no Google Search Console e enviar `sitemap.xml`.
7. Testar em https://search.google.com/test/rich-results e https://pagespeed.web.dev

## Skills recomendadas para Claude Code

Instalar só depois de ler o `SKILL.md` de cada uma (skill é código/instrução de terceiro rodando no seu ambiente).

| Skill | Para quê | Instalação |
|---|---|---|
| `anthropics/skills` → **frontend-design** (oficial Anthropic) | visual com identidade, fugindo do "cara de template" | `npx skills add https://github.com/anthropics/skills --skill frontend-design` |
| **AgriciDaniel/claude-seo** | auditoria SEO técnica, schema, SEO local, GEO (busca por IA) | `/plugin marketplace add AgriciDaniel/claude-seo` |
| **coreyhaines31/marketingskills** | copy, páginas de conversão, estratégia de conteúdo | ver README do repositório |
| **obra/superpowers** | disciplina de desenvolvimento (planejar, testar, revisar) | ver README do repositório |

"""Traz o cardápio real e as fotos (já tratadas em fundo preto) para o site.

Uso: python3 importar-cardapio.py [url-base]

O robô do repositório just-burger-producao (workflow dados-site.yml) publica todo dia em
https://systembria.github.io/just-burger-producao/site-dados/:
  cardapio-just-burger.json   nomes, descrições e preços (cópia do iFood)
  fotos/<id>.webp             foto 1200x900 em fundo preto
  fotos/<id>-recorte.webp     produto sem fundo (destaque flutuante da home)
Este script baixa tudo, grava cardapio-ifood.json e assets/img/cardapio/ (1200 e 600 px).
Com esse arquivo presente, o build.mjs usa o cardápio real no lugar do de dados.mjs.
"""
import io
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://systembria.github.io/just-burger-producao/site-dados').rstrip('/')
PASTA = Path(__file__).parent
FOTOS = PASTA / 'assets' / 'img' / 'cardapio'


def baixar(caminho):
    with urllib.request.urlopen(f'{BASE}/{caminho}', timeout=60) as r:
        return r.read()


dados = json.loads(baixar('cardapio-just-burger.json'))
try:
    indice = json.loads(baixar('fotos/indice.json'))
except urllib.error.HTTPError:
    indice = {}
FOTOS.mkdir(parents=True, exist_ok=True)

ids = {i['id'] for c in dados['categorias'] for i in c['itens']}
for velho in FOTOS.glob('*.webp'):  # item que saiu do cardápio
    if velho.stem.removesuffix('-600').removesuffix('-recorte') not in ids:
        velho.unlink()

com_foto = 0
for cat in dados['categorias']:
    for item in cat['itens']:
        info = indice.get(item['id'])
        if not info:
            continue
        foto = Image.open(io.BytesIO(baixar(f"fotos/{item['id']}.webp")))
        foto.save(FOTOS / f"{item['id']}.webp", 'WEBP', quality=86, method=6)
        foto.resize((600, 450), Image.LANCZOS).save(FOTOS / f"{item['id']}-600.webp", 'WEBP', quality=84, method=6)
        if info.get('modo') == 'recorte':
            (FOTOS / f"{item['id']}-recorte.webp").write_bytes(baixar(f"fotos/{item['id']}-recorte.webp"))
        com_foto += 1

(PASTA / 'cardapio-ifood.json').write_text(json.dumps(dados, ensure_ascii=False, indent=2) + '\n')
print(f'{len(ids)} itens importados ({com_foto} com foto). Rode: node build.mjs')

# ---------- Outras culinárias (JARVIS, 01/11): cardápio do iFood da Penha ----------
# Foto: a original do iFood em 1200x900 com sombra suave só nas bordas (Maikon 01/11: o prato inteiro
# aparece; sem recorte, que cortava pratos de cor parecida com o fundo).
from PIL import ImageDraw, ImageFilter
VERSAO_FOTO = 'v3'
_MASCARA = None
def foto_marca(raw):
    global _MASCARA
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    W, H = 1200, 900
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((x, y, x + W, y + H))
    if _MASCARA is None:
        _MASCARA = Image.new('L', (W, H), 0)
        ImageDraw.Draw(_MASCARA).ellipse((W * 0.05, H * 0.03, W * 0.95, H * 0.97), fill=255)
        _MASCARA = _MASCARA.filter(ImageFilter.GaussianBlur(100))
    # Foto de produto em fundo branco (lata, pote, garrafa): fica como está, sem sombra (a sombra fazia um oval branco).
    borda = [im.getpixel((x, y)) for x in range(0, W, 40) for y in (2, H - 3)] + [im.getpixel((x, y)) for y in range(0, H, 40) for x in (2, W - 3)]
    if sum(sum(p) / 3 for p in borda) / len(borda) > 200:
        return im
    return Image.composite(im, Image.new('RGB', (W, H)), _MASCARA)

def baixar_url(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'JustBurgerSite/1.0'}), timeout=60) as r:
        return r.read()

for marca in ['just-gourmet', 'just-forneria', 'just-esfiha', 'just-sushi']:
    try:
        dm = json.loads(baixar(f'cardapio-{marca}.json'))
    except urllib.error.HTTPError as erro:
        print(f'{marca}: sem cardápio ({erro.code})')
        continue
    pasta = PASTA / 'assets' / 'img' / f'cardapio-{marca}'
    pasta.mkdir(parents=True, exist_ok=True)
    marca_v = pasta / '.versao'
    if not marca_v.exists() or marca_v.read_text().strip() != VERSAO_FOTO:  # tratamento mudou: refaz tudo
        for velho in pasta.glob('*.webp'):
            velho.unlink()
        marca_v.write_text(VERSAO_FOTO)
    ids_m = {i['id'] for c in dm['categorias'] for i in c['itens']}
    for velho in pasta.glob('*.webp'):
        if velho.stem.removesuffix('-600') not in ids_m:
            velho.unlink()
    n = 0
    for c in dm['categorias']:
        for item in c['itens']:
            destino = pasta / f"{item['id']}.webp"
            if not destino.exists() and item.get('foto'):
                try:
                    f = foto_marca(baixar_url(item['foto']))
                except Exception:  # noqa: BLE001 — sem foto, o site mostra o nome
                    continue
                f.save(destino, 'WEBP', quality=84, method=6)
                f.resize((600, 450), Image.LANCZOS).save(pasta / f"{item['id']}-600.webp", 'WEBP', quality=82, method=6)
            if destino.exists():
                n += 1
    (PASTA / f'cardapio-{marca}.json').write_text(json.dumps(dm, ensure_ascii=False, indent=2) + '\n')
    print(f'{marca}: {len(ids_m)} itens ({n} com foto)')

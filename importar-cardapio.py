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

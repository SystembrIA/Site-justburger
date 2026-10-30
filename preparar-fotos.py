"""Fotos manuais de produto (quando não vierem do iFood).

Uso: python3 preparar-fotos.py <pasta-com-fotos>

Cada arquivo com o id do produto (ex.: double-smash.jpg). Sai em assets/img/cardapio/<id>.webp
(1200x900) e <id>-600.webp. Para o padrão do site (recorte + fundo preto), passe antes cada foto por
just-burger-producao/scripts/fotos-site.py: python3 scripts/fotos-site.py foto.jpg foto.webp
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

destino = Path(__file__).parent / 'assets' / 'img' / 'cardapio'
destino.mkdir(parents=True, exist_ok=True)

origem = Path(sys.argv[1]) if len(sys.argv) > 1 else sys.exit(__doc__)
for arquivo in sorted(origem.iterdir()):
    if arquivo.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'} or arquivo.stem.endswith('-recorte'):
        continue
    img = ImageOps.fit(ImageOps.exif_transpose(Image.open(arquivo)).convert('RGB'), (1200, 900), Image.LANCZOS)
    nome = arquivo.stem.lower()
    img.save(destino / f'{nome}.webp', 'WEBP', quality=86, method=6)
    img.resize((600, 450), Image.LANCZOS).save(destino / f'{nome}-600.webp', 'WEBP', quality=84, method=6)
    print(f'{arquivo.name} -> assets/img/cardapio/{nome}.webp')

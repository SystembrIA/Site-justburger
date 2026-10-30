"""Foto própria de um produto para o site (vale mais que a do iFood).

Uso: python3 ferramentas/foto-propria.py fotos-proprias/<nome>-original.jpg <pasta-saida>
Gera menu-1200.webp e menu-600.webp (4:3, foto inteira) e recorte.webp (produto sem fundo, destaque da home).
Copiar para assets/img/proprias/<começo do id>.webp, <começo do id>-600.webp e <começo do id>-recorte.webp.
Precisa de: pip install "rembg[cpu]" pillow
"""
import sys
from PIL import Image, ImageFilter
from rembg import new_session, remove
src, out = sys.argv[1], sys.argv[2]
img = Image.open(src).convert('RGB')
W, H = img.size
# cardápio: recorte 4:3 com a altura toda, centrado no burger
cx = int(W * 0.50)
cw = int(H * 4 / 3)
x0 = max(0, min(W - cw, cx - cw // 2))
menu = img.crop((x0, 0, x0 + cw, H)).resize((1200, 900), Image.LANCZOS)
menu.save(f'{out}/menu-1200.webp', 'WEBP', quality=88, method=6)
menu.resize((600, 450), Image.LANCZOS).save(f'{out}/menu-600.webp', 'WEBP', quality=84, method=6)
# destaque da home: burger sem fundo
rgba = remove(img, session=new_session('isnet-general-use'), post_process_mask=True)
a = rgba.getchannel('A')
rgba.putalpha(a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))
rgba = rgba.crop(rgba.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
rgba.thumbnail((1200, 1200), Image.LANCZOS)
rgba.save(f'{out}/recorte.webp', 'WEBP', quality=90, method=6)
print('menu', menu.size, 'recorte', rgba.size)
# prévia do recorte sobre preto
prev = Image.new('RGB', rgba.size, (0, 0, 0)); prev.paste(rgba, (0, 0), rgba); prev.save(f'{out}/recorte-previa.jpg', quality=85)

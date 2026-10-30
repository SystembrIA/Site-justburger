"""Varre uma grade de pontos dentro de 10 km de cada loja e pergunta ao Nominatim (OSM)
qual é o bairro de cada ponto. Respeita 1 consulta/s e guarda cache (pode rodar de novo)."""
import json, math, sys, time, urllib.request, urllib.parse
from pathlib import Path

SAIDA = Path(sys.argv[1])
LOJAS = {
    'zona-leste': (-23.5125411, -46.5049994),
    'pirituba': (-23.5026330, -46.7204837),
    'guarulhos': (-23.4859083, -46.5518263),
    'sao-bernardo': (-23.6909846, -46.5406792),
}
RAIO, PASSO = 10.0, 1.2  # km

def dist(a, b):
    R = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

lat0 = -23.55
dlat = PASSO / 111.32
dlon = PASSO / (111.32 * math.cos(math.radians(lat0)))
pontos = set()
for c in LOJAS.values():
    n = int(RAIO / PASSO) + 1
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            # grade global (alinhada) para não repetir ponto entre lojas próximas
            p = (round(round((c[0] + i * dlat) / dlat) * dlat, 5), round(round((c[1] + j * dlon) / dlon) * dlon, 5))
            if dist(c, p) <= RAIO:
                pontos.add(p)
pontos = sorted(pontos)
feitos = {}
if SAIDA.exists():
    for linha in SAIDA.read_text().splitlines():
        r = json.loads(linha); feitos[(r['lat'], r['lon'])] = r
print(f'{len(pontos)} pontos, {len(feitos)} já no cache', flush=True)
with SAIDA.open('a') as f:
    for k, p in enumerate(pontos):
        if p in feitos:
            continue
        url = 'https://nominatim.openstreetmap.org/reverse?' + urllib.parse.urlencode(
            {'lat': p[0], 'lon': p[1], 'format': 'jsonv2', 'zoom': 17, 'addressdetails': 1})
        req = urllib.request.Request(url, headers={'User-Agent': 'JustBurgerSite/1.0 (site institucional, consulta pontual)'})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                end = json.load(r).get('address', {})
        except Exception as e:  # ponto com erro fica de fora; roda de novo depois
            print('erro', p, e, flush=True); time.sleep(5); continue
        f.write(json.dumps({'lat': p[0], 'lon': p[1], 'address': end}, ensure_ascii=False) + '\n'); f.flush()
        if k % 50 == 0:
            print(k, end.get('suburb') or end.get('neighbourhood'), end.get('city') or end.get('town'), flush=True)
        time.sleep(1.1)
print('fim', flush=True)

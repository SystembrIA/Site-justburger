"""Monta site-justburger/bairros.json a partir da varredura (grade.jsonl, OSM/Nominatim)
e dos distritos oficiais de SP (distritos.json, GeoSampa).

Página por: distrito oficial (cidade de SP); bairro (Guarulhos, ABC, Osasco e demais cidades).
Uso: python3 -I ferramentas/montar-bairros.py <grade.jsonl> <distritos.json> bairros.json
distritos.json: GeoSampa WFS geoportal:distrito_municipal (outputFormat=application/json, srsName=EPSG:4326).
"""
import json, math, sys, unicodedata
from collections import Counter, defaultdict
from datetime import date

grade_arq, distritos_arq, saida_arq = sys.argv[1:4]
RAIO = 10.0
BORDA = 8.5        # centro do bairro além disso = só parte dele está no raio
CORTE = 9.5        # centro além disso = só encosta no raio; fica de fora
CORTE_CIDADE = 9.0  # bairro de cidade vizinha sem loja: mais exigente (área real do iFood costuma ser menor)
LOJAS = {
    'zona-leste-vila-buenos-aires': (-23.5125411, -46.5049994),
    'pirituba': (-23.5026330, -46.7204837),
    'guarulhos': (-23.4859083, -46.5518263),
    'sao-bernardo-do-campo': (-23.6909846, -46.5406792),
}
CIDADES_COM_LOJA = {'Guarulhos', 'São Bernardo do Campo'}

ACENTOS = {
    'AGUA RASA': 'Água Rasa', 'BELEM': 'Belém', 'BRAS': 'Brás', 'BRASILANDIA': 'Brasilândia', 'BUTANTA': 'Butantã',
    'CANGAIBA': 'Cangaíba', 'CAPAO REDONDO': 'Capão Redondo', 'CARRAO': 'Carrão', 'CIDADE LIDER': 'Cidade Líder',
    'CONSOLACAO': 'Consolação', 'FREGUESIA DO O': 'Freguesia do Ó', 'GRAJAU': 'Grajaú', 'JACANA': 'Jaçanã',
    'JAGUARE': 'Jaguaré', 'JARAGUA': 'Jaraguá', 'JARDIM ANGELA': 'Jardim Ângela', 'JARDIM SAO LUIS': 'Jardim São Luís',
    'JOSE BONIFACIO': 'José Bonifácio', 'LIMAO': 'Limão', 'REPUBLICA': 'República', 'SACOMA': 'Sacomã',
    'SANTA CECILIA': 'Santa Cecília', 'SAO DOMINGOS': 'São Domingos', 'SAO LUCAS': 'São Lucas', 'SAO MATEUS': 'São Mateus',
    'SAO MIGUEL': 'São Miguel', 'SAO RAFAEL': 'São Rafael', 'SAUDE': 'Saúde', 'SE': 'Sé', 'TATUAPE': 'Tatuapé',
    'TREMEMBE': 'Tremembé', 'VILA CURUCA': 'Vila Curuçá', 'VILA JACUI': 'Vila Jacuí', 'VILA SONIA': 'Vila Sônia',
}
MINUSCULAS = {'do', 'da', 'de', 'dos', 'das', 'e'}
ZONA = {'Leste': 'Zona Leste', 'Norte': 'Zona Norte', 'Oeste': 'Zona Oeste', 'Sul': 'Zona Sul', 'Centro': 'Centro'}
DIRECOES = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste']


def nome_distrito(bruto):
    if bruto in ACENTOS:
        return ACENTOS[bruto]
    return ' '.join(p if i and p in MINUSCULAS else p.capitalize() for i, p in enumerate(bruto.lower().split()))


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return '-'.join(''.join(c if c.isalnum() else ' ' for c in t).split())


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def direcao(de, para):
    dy = para[0] - de[0]
    dx = (para[1] - de[1]) * math.cos(math.radians(de[0]))
    ang = (math.degrees(math.atan2(dx, dy)) + 360) % 360  # 0 = norte, sentido horário
    return DIRECOES[int((ang + 22.5) // 45) % 8]


def dentro(pt, aneis):
    """Ponto no polígono (ray casting). aneis[0] = contorno externo, demais = buracos."""
    lat, lon = pt

    def no_anel(anel):
        d = False
        for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
            if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                d = not d
        return d

    return no_anel(aneis[0]) and not any(no_anel(b) for b in aneis[1:])


distritos = []
for f in json.load(open(distritos_arq))['features']:
    g = f['geometry']
    poligonos = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    p = f['properties']
    distritos.append((nome_distrito(p['nm_distrito_municipal']), ZONA.get(p['nm_regiao_05'], p['nm_regiao_05']), poligonos))


def distrito_de(pt):
    for nome, zona, poligonos in distritos:
        if any(dentro(pt, [[tuple(c) for c in anel] for anel in pol]) for pol in poligonos):
            return nome, zona
    return None, None


grupos = defaultdict(lambda: {'pontos': [], 'nomes': Counter(), 'cidade': '', 'zona': ''})
for linha in open(grade_arq):
    r = json.loads(linha)
    a = r['address']
    if a.get('state') != 'São Paulo':
        continue
    cidade = a.get('city') or a.get('town') or a.get('municipality')
    if not cidade:
        continue
    pt = (r['lat'], r['lon'])
    bairro = a.get('suburb') or a.get('quarter') or a.get('neighbourhood')
    sub = a.get('neighbourhood') if a.get('neighbourhood') != bairro else None
    if cidade == 'São Paulo':
        nome, zona = distrito_de(pt)
        if not nome:
            continue
        chave = ('São Paulo', nome)
    else:
        if not bairro:
            continue
        nome, zona, chave = bairro, a.get('district') or '', (cidade, bairro)
    g = grupos[chave]
    g['pontos'].append(pt)
    g['cidade'], g['zona'], g['nome'] = cidade, zona, nome
    for n in (bairro, sub):
        if n and 'subdistrito' not in n.lower():
            n = n.title() if n == n.lower() else n  # OSM às vezes vem em minúsculas
            if n != nome:
                g['nomes'][n] += 1

paginas = []
for (cidade, _), g in grupos.items():
    lat = sum(p[0] for p in g['pontos']) / len(g['pontos'])
    lon = sum(p[1] for p in g['pontos']) / len(g['pontos'])
    centro = (lat, lon)
    # loja = a mais perto do CENTRO do bairro (é a que o cliente reconhece como "a da região")
    dists = sorted((km(LOJAS[l], centro), min(km(LOJAS[l], p) for p in g['pontos']), l) for l in LOJAS)
    km_centro, perto, loja = dists[0]
    if perto > RAIO or km_centro >= CORTE or (cidade != 'São Paulo' and cidade not in CIDADES_COM_LOJA and km_centro >= CORTE_CIDADE):
        continue
    nome = g['nome']
    paginas.append({
        'slug': slug(nome if cidade == 'São Paulo' or nome == cidade else f'{nome} {cidade}'),
        'nome': nome,
        'tipo': 'distrito' if cidade == 'São Paulo' else ('cidade' if nome == cidade else 'bairro'),
        'cidade': cidade,
        'zona': g['zona'],
        'lat': round(lat, 5), 'lon': round(lon, 5),
        'loja': loja,
        'distanciaKm': round(km_centro, 1),
        # cidade vizinha sem loja: sempre só a parte mais perto; distrito/bairro: pelo centro
        'inteiroNoRaio': not (nome == cidade and cidade not in CIDADES_COM_LOJA) and km_centro < BORDA,
        'direcao': direcao(LOJAS[loja], centro),
        'outrasLojas': [{'loja': l, 'distanciaKm': round(k, 1)} for k, _, l in dists[1:] if k <= RAIO],
        'variacoes': [n for n, _ in g['nomes'].most_common()],
        'pontos': len(g['pontos']),
    })

for p in paginas:
    p['vizinhos'] = [o['slug'] for o in sorted(paginas, key=lambda o: km((p['lat'], p['lon']), (o['lat'], o['lon']))) if o is not p][:6]

assert len({p['slug'] for p in paginas}) == len(paginas), 'slug repetido'
paginas.sort(key=lambda p: (p['loja'], p['distanciaKm']))
json.dump({
    'geradoEm': date.today().isoformat(),
    'fontes': ['OpenStreetMap (Nominatim), varredura de pontos a cada 1,2 km', 'Prefeitura de São Paulo (GeoSampa), distritos municipais'],
    'raioKm': RAIO,
    'lojas': {k: {'lat': v[0], 'lon': v[1]} for k, v in LOJAS.items()},
    'bairros': paginas,
}, open(saida_arq, 'w'), ensure_ascii=False, indent=1)
por_loja = Counter(p['loja'] for p in paginas)
print(f'{len(paginas)} páginas; por loja: {dict(por_loja)}; variações: {sum(len(p["variacoes"]) for p in paginas)}')

# -*- coding: utf-8 -*-
"""Convierte el docx de Anahí (exportado a _anahi_docx.md con markitdown)
al formato reviews_anahi.json que consume build_resenas.py.
Reutilizable: cuando Anahí mande más reseñas, re-exportar el docx y correr esto.
"""
import re, json, unicodedata
from pathlib import Path

def norm(s):
    s = s.replace('™','').replace('®','').replace('’', "'")
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode()
    s = s.replace("'", '')
    return re.sub(r'\s+',' ', s.lower()).strip()

md = Path('_anahi_docx.md').read_text(encoding='utf-8')

def inline(t):
    t = t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*([^*\n]+?)\*(?!\*)', r'<i>\1</i>', t)
    return t

bloques = re.split(r'^# \*\*(.+?)\*\*\s*$', md, flags=re.M)
# bloques[0] = preambulo; luego pares (nombre, cuerpo)
out = []
for i in range(1, len(bloques), 2):
    nombre = bloques[i].strip()
    cuerpo = bloques[i+1].strip()
    partes = []
    parrafos = [p.strip() for p in re.split(r'\n\s*\n', cuerpo) if p.strip()]
    for j, p in enumerate(parrafos):
        p1 = re.sub(r'\s*\n\s*', ' ', p)
        # subtitulo estilo portada: primer parrafo TODO en negritas y en mayusculas
        m = re.fullmatch(r'\*\*(.+?)\*\*', p1)
        if j == 0 and m and m.group(1) == m.group(1).upper():
            partes.append(f'<div class="bb_h2">{inline(m.group(1))}</div>')
        else:
            partes.append(f'<p>{inline(p1)}</p>')
    out.append({"nombre": nombre, "voto": "up", "html": ''.join(partes)})

Path('reviews_anahi.json').write_text(
    json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8', newline='\n')

# reporte de match contra las reseñas de Jack (paginas existentes)
jack = {norm(r['nombre']) for r in json.loads(Path('reviews_jack_raw.json').read_text(encoding='utf-8'))}
con, sin = [], []
for r in out:
    (con if norm(r['nombre']) in jack else sin).append(r['nombre'])
print(f'Total Anahí: {len(out)} | con página de Jack: {len(con)} | SIN página (no se mostrarán aún): {len(sin)}')
for n in sin: print('  SIN PAGINA:', n)

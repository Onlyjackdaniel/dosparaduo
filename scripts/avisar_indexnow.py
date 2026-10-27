# -*- coding: utf-8 -*-
"""Avisa a Bing (IndexNow) de las páginas que cambiaron en el último commit.
Lo corre el workflow diario justo después del push del bot. Solo manda URLs que
están en sitemap.xml (nada de 404, verificaciones ni archivos internos).
Uso manual: `python scripts/avisar_indexnow.py --todo` manda el sitemap completo.
Nunca debe romper el build: ante cualquier error imprime y sale con 0 (27 oct 2026)."""
import json, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://dosparaduo.com'

def main():
    llaves = [p for p in ROOT.glob('*.txt') if re.fullmatch(r'[0-9a-f]{32}\.txt', p.name)]
    if not llaves:
        print('IndexNow: no hay archivo de llave en la raíz; no se avisa.'); return
    key = llaves[0].stem
    en_sitemap = set(re.findall(r'<loc>([^<]+)</loc>', (ROOT / 'sitemap.xml').read_text(encoding='utf-8')))

    if '--todo' in sys.argv:
        urls = sorted(en_sitemap)
    else:
        cambiados = subprocess.run(['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'], cwd=ROOT,
                                   capture_output=True, text=True, check=True).stdout.split()
        urls = set()
        for f in cambiados:
            if not f.endswith('.html'):
                continue
            ruta = f[:-len('index.html')] if f.endswith('index.html') else f
            urls.add(f'{BASE}/{ruta}')
        urls = sorted(urls & en_sitemap)

    if not urls:
        print('IndexNow: ninguna página del sitemap cambió; nada que avisar.'); return
    body = json.dumps({'host': 'dosparaduo.com', 'key': key,
                       'keyLocation': f'{BASE}/{key}.txt', 'urlList': urls}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body,
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        print(f'IndexNow: {len(urls)} URL avisadas, HTTP {r.status}')
    except urllib.error.HTTPError as e:
        print(f'IndexNow: HTTP {e.code} al avisar {len(urls)} URL: {e.read()[:200]!r}')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('IndexNow: falló el aviso, el build sigue:', e)

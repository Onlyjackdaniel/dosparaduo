# -*- coding: utf-8 -*-
"""Actualiza la seccion Videos de index.html con lo ultimo del canal de YouTube.
Corre en GitHub Actions (diario). Lee el feed RSS del canal, clasifica cada video
como Short o largo (probando la URL /shorts/), y reescribe los bloques entre los
marcadores AUTO:LARGOS y AUTO:SHORTS de index.html. Si no hay cambios, no toca nada.
"""
import re, urllib.request, html as hm
from pathlib import Path

CHANNEL_ID = 'UCgb9fFANiLW5zgiPVXBRBdw'
FEED = f'https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}'
INDEX = Path(__file__).resolve().parent.parent / 'index.html'
N_LARGOS = 3
N_SHORTS = 6

MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=30)


def es_short(video_id):
    """La URL /shorts/<id> responde 200 para Shorts; para videos largos redirige a /watch."""
    try:
        resp = fetch(f'https://www.youtube.com/shorts/{video_id}')
        return '/shorts/' in resp.geturl()
    except Exception:
        return False


def es_en_vivo(video_id):
    """Las transmisiones en vivo (y sus VOD) llevan isLiveBroadcast en el microdata
    de la página de watch. Esos no van a la portada del sitio."""
    try:
        html_page = fetch(f'https://www.youtube.com/watch?v={video_id}').read(400000).decode('utf-8', 'ignore')
        return 'isLiveBroadcast' in html_page
    except Exception:
        return False


def main():
    xml = fetch(FEED).read().decode('utf-8', 'ignore')
    entries = re.findall(r'<entry>(.*?)</entry>', xml, re.S)
    videos = []
    for e in entries:
        vid = re.search(r'<yt:videoId>([^<]+)</yt:videoId>', e)
        tit = re.search(r'<title>([^<]*)</title>', e)
        pub = re.search(r'<published>(\d{4})-(\d{2})-(\d{2})', e)
        if not (vid and tit):
            continue
        y, m, d = (pub.group(1), int(pub.group(2)), int(pub.group(3))) if pub else ('', 1, 1)
        videos.append({
            'id': vid.group(1),
            'titulo': hm.unescape(tit.group(1)),
            'fecha': f'{d} {MESES[m-1]} {y}' if pub else '',
        })

    largos, shorts = [], []
    for v in videos:
        if len(largos) >= N_LARGOS and len(shorts) >= N_SHORTS:
            break
        if es_short(v['id']):
            shorts.append(v)
        elif len(largos) < N_LARGOS and 'en vivo' not in v['titulo'].lower() and not es_en_vivo(v['id']):
            largos.append(v)

    largos = largos[:N_LARGOS]
    shorts = shorts[:N_SHORTS]
    if not largos and not shorts:
        print('Feed vacio; no se toca nada.')
        return

    def card_largo(v):
        t = hm.escape(v['titulo'])
        return f'''    <article class="vcard reveal">
      <div class="vthumb" data-video="{v['id']}">
        <img src="https://i.ytimg.com/vi/{v['id']}/maxresdefault.jpg" width="1280" height="720" alt="{t}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg'">
        <div class="play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>
      </div>
      <div class="vinfo">
        <span class="vtag">{v['fecha']}</span>
        <h3>{t}</h3>
      </div>
    </article>'''

    def card_short(v):
        t = hm.escape(v['titulo'])
        return f'''    <a class="scard reveal" href="https://www.youtube.com/shorts/{v['id']}" target="_blank" rel="noopener">
      <img src="https://i.ytimg.com/vi/{v['id']}/oar2.jpg" width="720" height="1280" alt="{t}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg'">
      <span class="s-ico">SHORT</span>
      <p>{t}</p>
    </a>'''

    html_doc = INDEX.read_text(encoding='utf-8')
    nuevo = html_doc
    if largos:
        bloque = '<!-- AUTO:LARGOS:START -->\n' + '\n'.join(card_largo(v) for v in largos) + '\n<!-- AUTO:LARGOS:END -->'
        nuevo = re.sub(r'<!-- AUTO:LARGOS:START -->.*?<!-- AUTO:LARGOS:END -->', bloque, nuevo, flags=re.S)
    if shorts:
        bloque = '<!-- AUTO:SHORTS:START -->\n' + '\n'.join(card_short(v) for v in shorts) + '\n<!-- AUTO:SHORTS:END -->'
        nuevo = re.sub(r'<!-- AUTO:SHORTS:START -->.*?<!-- AUTO:SHORTS:END -->', bloque, nuevo, flags=re.S)

    if nuevo != html_doc:
        INDEX.write_text(nuevo, encoding='utf-8')
        print(f'index.html actualizado: {len(largos)} largos, {len(shorts)} shorts.')
    else:
        print('Sin cambios.')


if __name__ == '__main__':
    main()

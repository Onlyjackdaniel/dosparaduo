# -*- coding: utf-8 -*-
"""Genera la pestaña Reseñas de dosparaduo: galería + página por juego.
Lee reviews_jack_raw.json (extraído de Steam) y escribe resenas/*.html, sitemap.xml.
Re-ejecutable: cuando existan reseñas de Anahí se agregan al JSON y se regenera todo."""
import json, re, unicodedata, html as htmlmod
from pathlib import Path

ROOT = Path(r'D:\dosparaduo-web')
OUT = ROOT / 'resenas'
OUT.mkdir(exist_ok=True)
BASE = 'https://onlyjackdaniel.github.io/dosparaduo'

CSP = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
       "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src 'self' https://fonts.gstatic.com; "
       "img-src 'self' data: https:; "
       "frame-src https://www.youtube-nocookie.com https://www.youtube.com; "
       "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; "
       "form-action 'self' https://formsubmit.co; "
       'base-uri \'self\'; object-src \'none\'">')

GTAG = CSP + """
<!-- Google tag (gtag.js) + Consent Mode v2 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NXJ8PNJZFP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});
  gtag('js', new Date());
  gtag('config','G-NXJ8PNJZFP',{'anonymize_ip':true});
</script>
<script src="../assets/consent.js" defer></script>
<script src="../assets/analytics-events.js" defer></script>"""

SELECCION = ["Radical Rabbit Stew","Split Fiction","Borderlands 2","Blanc","We Were Here Too","We Were Here Expeditions: The FriendShip","SUPER CRAZY RHYTHM CASTLE","Stumble Guys","Screencheat","Sagrada","Pummel Party","Move or Die","Portal 2","Overcooked! All You Can Eat","METAL SLUG 3","METAL SLUG","Keep Talking and Nobody Explodes","Exploding Kittens 2","Disney Epic Mickey 2: The Power of Two","Biped","Bloons TD 6","It Takes Two","Cuphead","The Typing of The Dead: Overkill","VVVVVV","Resident Evil Requiem","The Stanley Parable: Ultra Deluxe","A Game About Digging A Hole","Bongo Cat","FUCK HITLER","Tiny Pasture","A Park Full of Cats","A Shelter Full of Cats","The Room Two","Resident Evil 3","Resident Evil 2","Ori and the Blind Forest: Definitive Edition","The Last Campfire","Ghost of Tsushima DIRECTOR'S CUT","Dofamine","Spirit City: Lofi Sessions","God of War Ragnarok","Florence","A Castle Full of Cats","A Building Full of Cats","Cats in Time","Bendy and the Dark Revival","Resident Evil Village","Sekiro: Shadows Die Twice - GOTY Edition","God of War","Marvel's Spider-Man Remastered","Resident Evil 4"]

EXTRAS = ["OBS Studio","3DMark","Banana","My Name is Mayo","My Name is Mayo 2","My Name is Mayo 3","Achievement Clicker 2018","Cookie Clicker","Duck Simulator 2","A Story About Farting"]

VIDEOS = {"move or die":"Ra5H1bkkEj4","god of war ragnarok":"PnrH_GSsT8k","resident evil 4":"EU0jZirCx6k"}

MESES = {'January':'ene','February':'feb','March':'mar','April':'abr','May':'may','June':'jun','July':'jul','August':'ago','September':'sep','October':'oct','November':'nov','December':'dic'}

def norm(s):
    s = s.replace('™','').replace('®','').replace('’',"'")
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode()
    s = s.replace("'", '')
    return re.sub(r'\s+',' ', s.lower()).strip()

def slug(s):
    s = s.replace('™','').replace('®','').replace('’',"'")
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode().lower()
    return re.sub(r'-+','-', re.sub(r'[^a-z0-9]+','-', s)).strip('-')

def fecha_es(f):
    if not f: return ''
    m = re.match(r'(\d+)\s+(\w+)(?:,\s*(\d{4}))?', f)
    if not m: return f
    return f"{m.group(1)} {MESES.get(m.group(2), m.group(2))} {m.group(3) or '2026'}"

def excerpt(h, n=155):
    t = re.sub(r'<[^>]+>',' ', h)
    t = htmlmod.unescape(re.sub(r'\s+',' ', t)).strip()
    t = des_guionar(t)
    return (t[:n].rsplit(' ',1)[0] + '…') if len(t) > n else t

# ---------- saneador de HTML (anti-XSS) ----------
# El cuerpo de las reseñas viene de Steam (HTML ya renderizado). Aunque la fuente
# son reseñas propias, NUNCA se inyecta crudo: se pasa por una allowlist de tags
# y atributos. Sin dependencias externas, solo la stdlib.
from html.parser import HTMLParser

_ALLOWED_TAGS = {
    'b','strong','i','em','u','s','strike','del','br','p','hr',
    'ul','ol','li','blockquote','pre','code','h1','h2','h3','h4',
    'span','div','a','img','table','thead','tbody','tr','td','th',
}
_ALLOWED_ATTRS = {
    'a':   {'href','title'},
    'img': {'src','alt','title'},
    'span':{'class'}, 'div':{'class'},
    'td':  {'colspan','rowspan'}, 'th':{'colspan','rowspan'},
}
_VOID = {'br','hr','img'}
_SAFE_URL = re.compile(r'^(https?:|/|\.\.?/|#|mailto:)', re.I)

class _Sanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
    def _clean_attrs(self, tag, attrs):
        allowed = _ALLOWED_ATTRS.get(tag, set())
        res = []
        for k, v in attrs:
            k = (k or '').lower()
            if k not in allowed:
                continue
            v = v or ''
            # bloquea javascript:, data:text/html, vbscript:, etc.
            if k in ('href','src') and not _SAFE_URL.match(v.strip()):
                continue
            res.append((k, v))
        return res
    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag not in _ALLOWED_TAGS:
            return
        a = self._clean_attrs(tag, attrs)
        if tag == 'a':
            a += [('rel','nofollow noopener noreferrer'), ('target','_blank')]
        attr_str = ''.join(f' {k}="{htmlmod.escape(v, quote=True)}"' for k, v in a)
        self.out.append(f'<{tag}{attr_str}>')
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in _ALLOWED_TAGS and tag not in _VOID:
            self.out.append(f'</{tag}>')
    def handle_data(self, data):
        self.out.append(htmlmod.escape(data, quote=False))


# ---------- limpiador de guiones largos (regla de estilo del sitio) ----------
# El contenido crudo de Steam puede traer em/en dashes; aqui se convierten a
# puntuacion natural para que cada rebuild salga limpio sin tocar el JSON crudo.
def des_guionar(t):
    if not t:
        return t
    t = re.sub(r'(\d)\s?[\u2014\u2013]\s?(\d)', r'\1-\2', t)              # rangos: 6-7 horas
    t = re.sub(r'\s[\u2014\u2013]\s?([^\u2014\u2013<>]{2,120}?)\s?[\u2014\u2013](?=[\s,.;:!?)])',
               r' (\1)', t)                                                   # pares -> parentesis
    t = re.sub(r'(<br\s*/?>|^)\s*[\u2014\u2013]\s*', r'\1&#8226; ', t)     # dialogo/vinetas
    t = t.replace(' \u2013 ', ': ')                                           # subtitulo con en dash
    t = re.sub(r'\s*\u2014\s*', ', ', t)                                     # em dash restante
    t = t.replace('\u2013', '-')                                              # en dash restante
    return t

def sanitize_html(s):
    if not s:
        return ''
    p = _Sanitizer()
    p.feed(s)
    p.close()
    return des_guionar(''.join(p.out))

reviews = json.loads((ROOT/'reviews_jack_raw.json').read_text(encoding='utf-8'))
for _r in reviews:
    _r['nombre'] = _r['nombre'].replace('\u2014','-').replace('\u2013','-')
idx = {norm(r['nombre']): r for r in reviews}

def buscar(nombres):
    out = []
    for n in nombres:
        r = idx.get(norm(n))
        if r: out.append(r)
        else: print('NO ENCONTRADO:', n)
    return out

juntos = buscar(SELECCION)
extras = buscar(EXTRAS)
_sel = {norm(n) for n in SELECCION} | {norm(n) for n in EXTRAS}
solo = [r for r in reviews if norm(r['nombre']) not in _sel]

# Reseñas manuales de Anahí (Player 2). Formato de cada entrada en reviews_anahi.json:
# {"nombre": "It Takes Two", "voto": "up"|"down", "horas": "15", "fecha": "jun 2026", "html": "<p>texto...</p>"}
# horas y fecha son opcionales. El match es por nombre normalizado contra el juego de la página.
ANAHI = {}
_anahi_path = ROOT / 'reviews_anahi.json'
if _anahi_path.exists():
    for a in json.loads(_anahi_path.read_text(encoding='utf-8')):
        ANAHI[norm(a['nombre'])] = a
print(f'Reseñas de Anahí cargadas: {len(ANAHI)}')

CSS = """
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}}
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;overflow-x:hidden}
::selection{background:var(--p1);color:#fff}
.atmos{position:fixed;inset:0;pointer-events:none;z-index:0}
.atmos::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(var(--p2-rgb),.04) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--p2-rgb),.04) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 90% 70% at 50% 0%,#000 30%,transparent 75%)}
nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:rgba(11,14,26,.78);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.logo{display:flex;align-items:center;gap:12px;text-decoration:none}
.logo img{width:36px;height:36px;border-radius:50%;border:2px solid var(--p2)}
.logo span{font-family:var(--display);font-size:.95rem;color:var(--text)}
.nav-links{display:flex;align-items:center;gap:26px}
.nav-links a{color:var(--muted);text-decoration:none;font-family:var(--mono);font-size:.78rem;text-transform:uppercase;letter-spacing:1.5px;transition:color .2s}
.nav-links a:hover{color:var(--p2)}
.btn-yt{display:inline-flex;align-items:center;gap:8px;background:var(--p2);color:#fff !important;padding:9px 18px;border-radius:8px;font-weight:700;letter-spacing:1px;box-shadow:0 0 18px rgba(var(--p2-rgb),.45)}
main{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:120px 24px 80px}
.crumb{font-family:var(--mono);font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.crumb a{color:var(--p2);text-decoration:none}
h1.sec{font-family:var(--display);font-size:clamp(1.8rem,5vw,3rem);text-transform:uppercase;margin:10px 0 8px}
.sub{color:var(--muted);max-width:640px;font-weight:300;margin-bottom:40px}
footer{position:relative;z-index:1;border-top:1px solid var(--line);padding:40px 24px;text-align:center;background:var(--bg-2)}
footer .f-logo{font-family:var(--display);font-size:1rem;text-transform:uppercase}
footer p{color:var(--muted);font-size:.78rem;margin-top:8px;font-family:var(--mono)}
footer a{color:var(--p2);text-decoration:none}
@media(max-width:760px){.nav-links a:not(.btn-yt){display:none}}
"""

NAV = """<nav>
  <a class="logo" href="__HOME__index.html">
    <img src="../assets/icon-512.png" width="36" height="36" alt="Logo Dos para Duo">
    <span>Dos <em style="color:var(--gold);font-style:normal">para</em> <b style="color:var(--p2)">Duo</b></span>
  </a>
  <button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button>
  <div class="nav-links">
    <a href="__HOME__index.html#inicio">Inicio</a>
    <a href="__HOME__index.html#videos">Videos</a>
    <a href="__HOME__resenas/">Reseñas</a>
    <a href="__HOME__merch.html">Merch</a>
    <a href="__HOME__apoyo.html">Apóyanos</a>
    <a href="__HOME__nosotros.html">Nosotros</a>
    <a class="btn-yt fx-btn" href="https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw?sub_confirmation=1" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#youtube-logo"/></svg> Suscríbete</a>
  </div>
</nav>"""

FOOTER = """<footer>
  <div class="f-logo">Dos <em style="font-style:normal;color:var(--p1)">para</em> <b style="color:var(--p2)">Duo</b></div>
  <p>© 2026 Dos para Duo · <a href="https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw" target="_blank" rel="noopener">YouTube</a> · <a href="__HOME__resenas/">Reseñas</a> · <a href="__HOME__apoyo.html">Apóyanos</a> · <a href="__HOME__contacto.html">Contacto</a></p>
  <div class="f-social">
    <a href="https://www.youtube.com/@DosparaDuo" target="_blank" rel="noopener" aria-label="YouTube de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#youtube-logo"/></svg></a>
    <a href="https://www.tiktok.com/@dosparaduo" target="_blank" rel="noopener" aria-label="TikTok de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#tiktok-logo"/></svg></a>
    <a href="https://www.reddit.com/user/Dosparaduo/" target="_blank" rel="noopener" aria-label="Reddit de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#reddit-logo"/></svg></a>
  </div>
</footer>"""

# ---------- página individual ----------
PAGE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__NOMBRE__: Reseña en español | Dos para Duo</title>
<meta name="description" content="__DESC__">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="../assets/icon-512.png">
<link rel="apple-touch-icon" href="../assets/icon-512.png">
<link rel="manifest" href="../site.webmanifest">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://onlyjackdaniel.github.io/dosparaduo/assets/icon-512.png">
<link rel="preconnect" href="https://i.ytimg.com" crossorigin>
<meta property="og:title" content="Reseña: __NOMBRE__ | Dos para Duo">
<meta property="og:description" content="__DESC__">
<meta property="og:type" content="article">
<meta property="og:image" content="__CAPSULE__">
<link rel="canonical" href="__URL__">
<script type="application/ld+json">__SCHEMA__</script>
<script type="application/ld+json">__BREADCRUMB__</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/menu.css?v=4">
<link rel="stylesheet" href="../assets/fx.css?v=3">
<script src="../assets/menu.js?v=4" defer></script>
<script src="../assets/fx.js?v=3" defer data-fx-base="../"></script>
<style>__CSS__
.game-head{text-align:center;margin-bottom:46px}
.game-head img{max-width:min(460px,100%);border-radius:14px;border:1px solid var(--line);box-shadow:0 18px 50px rgba(0,0,0,.5)}
.meta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:18px;font-family:var(--mono);font-size:.72rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.meta-row .chip{border:1px solid var(--line);border-radius:6px;padding:5px 12px}
.chip.rec{color:#6cf2a8;border-color:rgba(108,242,168,.4)}
.chip.norec{color:#ff7a7a;border-color:rgba(255,122,122,.4)}
.duo-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.rcard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:30px 28px;position:relative}
.rcard::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0}
.rcard.p1::before{background:linear-gradient(90deg,var(--p1),transparent)}
.rcard.p2::before{background:linear-gradient(90deg,var(--p2),transparent)}
.rcard .ptag{font-family:var(--mono);font-size:.65rem;letter-spacing:2.5px}
.rcard.p1 .ptag{color:var(--p1)}
.rcard.p2 .ptag{color:var(--p2)}
.rcard h2{font-family:var(--display);font-size:1.25rem;margin:8px 0 16px;text-transform:uppercase}
.rbody{color:#c8cdea;font-weight:300;font-size:.95rem}
.rbody .bb_h2{font-family:var(--display);font-size:1rem;color:var(--text);margin:14px 0 8px;text-transform:uppercase}
.rbody b{color:var(--text);font-weight:600}
.rbody u{text-decoration:none;color:var(--gold)}
.rbody img{max-width:100%}
.steam-link{display:inline-block;margin-top:18px;font-family:var(--mono);font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--p2);text-decoration:none;border:1px solid var(--line);border-radius:6px;padding:7px 13px}
.steam-link:hover{border-color:var(--p2)}
.pending{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;text-align:center;color:var(--muted);border:1.5px dashed rgba(var(--p2-rgb),.35);border-radius:12px;padding:30px;font-weight:300}
.pending .q{font-family:var(--display);font-size:2.2rem;color:rgba(var(--p2-rgb),.5);margin-bottom:10px}
.video-sec{margin-top:46px;text-align:center}
.video-sec h2{font-family:var(--display);font-size:1.3rem;text-transform:uppercase;margin-bottom:18px}
.video-sec h2 span{color:var(--p1)}
.vframe{position:relative;max-width:760px;margin:0 auto;aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid var(--line)}
.vframe iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.backrow{margin-top:50px;text-align:center}
.back{font-family:var(--mono);font-size:.78rem;letter-spacing:2px;text-transform:uppercase;color:var(--text);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:12px 24px}
.back:hover{border-color:var(--p1);color:var(--p1)}
@media(max-width:820px){.duo-cols{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="atmos"></div>
__NAV__
<main>
  <p class="crumb"><a href="./">← Reseñas</a> / __NOMBRE_ESC__</p>
  <div class="game-head">
    <h1 class="sec" data-scramble>__NOMBRE_ESC__</h1>
    <img src="__CAPSULE__" width="460" height="215" alt="Carátula de __NOMBRE_ESC__" onerror="this.style.display='none'">
    <div class="meta-row">
      <span class="chip __RECCLASS__">__RECTXT__</span>
      <span class="chip">__HORAS__ hrs jugadas</span>
      <span class="chip">__FECHA__</span>
    </div>
  </div>
  <div class="duo-cols">
    <article class="rcard p1 fx-spot" style="--spot-rgb:var(--p1-rgb)">
      <span class="ptag">▮ PLAYER 1 · ÉL</span>
      <h2>Su reseña</h2>
      <div class="rbody">__CONTENIDO__</div>
      <a class="steam-link fx-btn" href="__STEAMURL__" target="_blank" rel="noopener">Ver en Steam ↗</a>
    </article>
    <aside class="rcard p2 fx-spot" style="--spot-rgb:var(--p2-rgb)">
      <span class="ptag">▮ PLAYER 2 · ELLA</span>
      <h2>Su reseña</h2>
      __P2BODY__
    </aside>
  </div>
  __VIDEO__
  <div class="backrow"><a class="back fx-btn" href="./">◂ Todas las reseñas</a></div>
</main>
__FOOTER__
</body>
</html>"""

VIDEO_BLOCK = """<section class="video-sec">
    <h2>Lo jugamos <span>en el canal</span></h2>
    <div class="vframe"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/__VID__?rel=0" allow="encrypted-media; picture-in-picture" allowfullscreen title="Video de __NOMBRE_ESC__ en Dos para Duo"></iframe></div>
  </section>"""

def render_page(r, solo=False):
    nombre = r['nombre']; s = slug(nombre); app = r['appid']
    cap = f"https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{app}/header.jpg"
    rec = r['voto'] == 'up'
    desc = excerpt(r['html'])
    url = f"{BASE}/resenas/{s}.html"
    schema = json.dumps({
        "@context":"https://schema.org","@type":"Review",
        "itemReviewed":{"@type":"VideoGame","name":nombre},
        "author":{"@type":"Person","name":"Jack de Dos para Duo"},
        "publisher":{"@type":"Organization","name":"Dos para Duo","sameAs":"https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw"},
        "inLanguage":"es","reviewBody":desc,
        "positiveNotes" if rec else "negativeNotes":{"@type":"ItemList","itemListElement":[]}
    }, ensure_ascii=False)
    breadcrumb = json.dumps({
        "@context":"https://schema.org","@type":"BreadcrumbList",
        "itemListElement":[
            {"@type":"ListItem","position":1,"name":"Inicio","item":f"{BASE}/"},
            {"@type":"ListItem","position":2,"name":"Reseñas","item":f"{BASE}/resenas/"},
            {"@type":"ListItem","position":3,"name":nombre}
        ]
    }, ensure_ascii=False)
    p2txt = ('Run en solitario de Player 1.<br>Si Player 2 lo juega algún día, su reseña aparecerá aquí.'
             if solo else
             'La reseña de Player 2 está en camino.<br>Mientras tanto, ya saben quién escribe más rápido.')
    a2 = ANAHI.get(norm(nombre))
    if a2:
        chips = [('<svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#thumbs-up"/></svg> Recomendado' if a2.get('voto','up')=='up' else '<svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#thumbs-down"/></svg> No recomendado')]
        if a2.get('horas'): chips.append(f"{a2['horas']} hrs jugadas")
        if a2.get('fecha'): chips.append(a2['fecha'])
        chips_html = ''.join(f'<span class="chip{" rec" if i==0 and a2.get("voto","up")=="up" else (" norec" if i==0 else "")}">{c}</span>' for i,c in enumerate(chips))
        p2body = f'<div class="meta-row" style="justify-content:flex-start;margin:0 0 16px">{chips_html}</div><div class="rbody">{sanitize_html(a2["html"])}</div>'
    else:
        p2body = f'<div class="pending"><span class="q">?</span>{p2txt}</div>'
    vid = VIDEOS.get(norm(nombre))
    video_html = VIDEO_BLOCK.replace('__VID__', vid).replace('__NOMBRE_ESC__', htmlmod.escape(nombre)) if vid else ''
    page = (PAGE
        .replace('<head>', '<head>\n' + GTAG, 1)
        .replace('__BREADCRUMB__', breadcrumb)
        .replace('__P2BODY__', p2body)
        .replace('__CSS__', CSS)
        .replace('__NAV__', NAV.replace('__HOME__','../'))
        .replace('__FOOTER__', FOOTER.replace('__HOME__','../'))
        .replace('__NOMBRE_ESC__', htmlmod.escape(nombre))
        .replace('__NOMBRE__', htmlmod.escape(nombre))
        .replace('__DESC__', htmlmod.escape(desc))
        .replace('__CAPSULE__', cap)
        .replace('__URL__', url)
        .replace('__SCHEMA__', schema)
        .replace('__RECCLASS__', 'rec' if rec else 'norec')
        .replace('__RECTXT__', '<svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#thumbs-up"/></svg> Recomendado' if rec else '<svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#thumbs-down"/></svg> No recomendado')
        .replace('__HORAS__', r['horas'] or '?')
        .replace('__FECHA__', fecha_es(r['fecha']))
        .replace('__CONTENIDO__', sanitize_html(r['html']))
        .replace('__STEAMURL__', f"https://steamcommunity.com/id/Onlyjackdaniel/recommended/{app}/")
        .replace('__VIDEO__', video_html))
    (OUT / f'{s}.html').write_text(page, encoding='utf-8')
    return s

# ---------- galería ----------
def card(r, mini=False):
    nombre = r['nombre']; s = slug(nombre); app = r['appid']
    cap = f"https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{app}/header.jpg"
    vid = ' data-video="1"' if VIDEOS.get(norm(nombre)) else ''
    badge = '<span class="vbadge"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#play"/></svg> EN EL CANAL</span>' if VIDEOS.get(norm(nombre)) else ''
    cls = 'gcard mini reveal fx-spot' if mini else 'gcard reveal fx-spot'
    return f"""<a class="{cls}" href="{s}.html" data-nombre="{htmlmod.escape(norm(nombre))}"{vid}>
      <div class="gimg"><img src="{cap}" width="460" height="215" alt="Carátula de {htmlmod.escape(nombre)}" loading="lazy" onerror="this.parentElement.classList.add('noimg')">{badge}</div>
      <div class="ginfo"><h3>{htmlmod.escape(nombre)}</h3>
      <p><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#{'thumbs-up' if r['voto']=='up' else 'thumbs-down'}"/></svg> · {r['horas']} hrs · {fecha_es(r['fecha'])}</p></div>
    </a>"""

cards_juntos = '\n'.join(card(r) for r in juntos)
cards_extras = '\n'.join(card(r, mini=True) for r in extras)

INDEX = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reseñas de juegos en español | Dos para Duo</title>
<meta name="description" content="__NJ__ juegos que jugamos juntos, reseñados de verdad: co-op, terror, plataformas y joyitas raras. Las reseñas de Steam del dúo, con video del canal cuando existe.">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="../assets/icon-512.png">
<link rel="apple-touch-icon" href="../assets/icon-512.png">
<link rel="manifest" href="../site.webmanifest">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://onlyjackdaniel.github.io/dosparaduo/assets/icon-512.png">
<link rel="preconnect" href="https://i.ytimg.com" crossorigin>
<meta property="og:title" content="Reseñas | Dos para Duo">
<meta property="og:description" content="Los juegos que jugamos juntos, reseñados de verdad.">
<meta property="og:type" content="website">
<link rel="canonical" href="__BASE__/resenas/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Reseñas | Dos para Duo","description":"Reseñas en español de los juegos que jugamos juntos.","isPartOf":{"@type":"WebSite","name":"Dos para Duo","url":"__BASE__/"}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/menu.css?v=4">
<link rel="stylesheet" href="../assets/fx.css?v=3">
<script src="../assets/menu.js?v=4" defer></script>
<script src="../assets/fx.js?v=3" defer data-fx-base="../"></script>
<style>__CSS__
.guide-band{display:block;font-family:var(--mono);font-size:.72rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);text-decoration:none;border:1px solid rgba(255,209,102,.4);border-radius:10px;padding:14px 18px;margin-bottom:22px;transition:border-color .2s,background .2s}
.guide-band:hover{border-color:var(--gold);background:rgba(255,209,102,.06)}
.guide-band b{color:var(--text)}
.tools{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
#buscar{flex:1;min-width:220px;padding:12px 16px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);font-family:var(--body);font-size:.95rem}
#buscar:focus{outline:none;border-color:var(--p2)}
.fbtn{font-family:var(--mono);font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:10px 16px;cursor:pointer}
.fbtn.on{border-color:var(--p1);color:var(--p1)}
.ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
.gcard{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .22s,border-color .22s}
.gcard:hover{transform:translateY(-5px);border-color:var(--p2)}
.gimg{position:relative;aspect-ratio:460/215;background:var(--bg-2)}
.gimg img{width:100%;height:100%;object-fit:cover;display:block}
.gimg.noimg img{display:none}
.vbadge{position:absolute;top:8px;left:8px;font-family:var(--mono);font-size:.55rem;letter-spacing:1px;background:rgba(var(--p1-rgb),.92);color:#fff;padding:4px 8px;border-radius:4px}
.ginfo{padding:14px 16px 16px}
.ginfo h3{font-size:.95rem;font-weight:600;color:var(--text);line-height:1.35}
.ginfo p{font-family:var(--mono);font-size:.66rem;letter-spacing:1px;color:var(--muted);margin-top:6px}
.extras-head{font-family:var(--display);font-size:clamp(1.2rem,3.5vw,1.8rem);text-transform:uppercase;margin:70px 0 8px}
.extras-head span{color:var(--gold)}
.extras-sub{color:var(--muted);font-weight:300;margin-bottom:26px}
.ggrid.minis{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
.empty{display:none;text-align:center;color:var(--muted);padding:50px 0;font-family:var(--mono);font-size:.8rem;letter-spacing:1px}
</style>
</head>
<body>
<div class="atmos"></div>
__NAV__
<main>
  <p class="crumb"><a href="../index.html">← Inicio</a> / Reseñas</p>
  <h1 class="sec" data-scramble>Reseñas</h1>
  <p class="sub">Los <b style="color:var(--text)">__NJ__ juegos que hemos jugado juntos</b>, reseñados de verdad en Steam, con la reseña de cada quien y el video del canal cuando lo grabamos. Player 2 está afilando su teclado: sus reseñas vienen en camino.</p>
  <a class="guide-band" href="../listas/mejores-juegos-cooperativos-para-parejas.html">📜 <b>NUEVA GUÍA:</b> Los mejores juegos cooperativos para parejas: nuestro top 10 probado en pareja ▸</a>
  <div class="tools">
    <input id="buscar" type="text" placeholder="Buscar juego...">
    <button class="fbtn on" data-f="todos" type="button">Todos</button>
    <button class="fbtn" data-f="video" type="button">▶ Con video</button>
    <a class="fbtn" href="solo.html" style="text-decoration:none;display:inline-flex;align-items:center">◆ Solo runs</a>
  </div>
  <div class="ggrid" id="grid">
__CARDS__
  </div>
  <p class="empty" id="empty">▮ NADA POR AQUÍ. PRUEBA OTRA BÚSQUEDA ▮</p>
  <h2 class="extras-head">Cosas que <span>también</span> reseñamos</h2>
  <p class="extras-sub">Porque también le escribimos reseñas a un plátano, a la mayonesa y al programa con el que grabamos. Sin filtro.</p>
  <div class="ggrid minis">
__EXTRAS__
  </div>
</main>
__FOOTER__
<script>
const q=document.getElementById('buscar'),cards=[...document.querySelectorAll('#grid .gcard')];
let filtro='todos';
function aplicar(){
  const t=q.value.toLowerCase().trim();let vis=0;
  cards.forEach(c=>{
    const okT=!t||c.dataset.nombre.includes(t);
    const okF=filtro==='todos'||c.dataset.video==='1';
    c.style.display=(okT&&okF)?'':'none';if(okT&&okF)vis++;
  });
  document.getElementById('empty').style.display=vis?'none':'block';
}
q.addEventListener('input',aplicar);
document.querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');filtro=b.dataset.f;aplicar();
});
</script>
</body>
</html>"""

index_html = (INDEX
    .replace('<head>', '<head>\n' + GTAG, 1)
    .replace('__CSS__', CSS)
    .replace('__NAV__', NAV.replace('__HOME__','../'))
    .replace('__FOOTER__', FOOTER.replace('__HOME__','../'))
    .replace('__CARDS__', cards_juntos)
    .replace('__EXTRAS__', cards_extras)
    .replace('__NJ__', str(len(juntos)))
    .replace('__BASE__', BASE))
(OUT/'index.html').write_text(index_html, encoding='utf-8')

# ---------- galería Solo runs ----------
SOLO_INDEX = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Solo runs: reseñas de Player 1 | Dos para Duo</title>
<meta name="description" content="__NS__ juegos que Player 1 jugó en solitario, reseñados en Steam: souls, terror, indies y más. La otra mitad de la biblioteca de Dos para Duo.">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="../assets/icon-512.png">
<link rel="apple-touch-icon" href="../assets/icon-512.png">
<link rel="manifest" href="../site.webmanifest">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://onlyjackdaniel.github.io/dosparaduo/assets/icon-512.png">
<link rel="preconnect" href="https://i.ytimg.com" crossorigin>
<meta property="og:title" content="Solo runs | Dos para Duo">
<meta property="og:description" content="Los juegos que Player 1 jugó en solitario, reseñados de verdad.">
<meta property="og:type" content="website">
<link rel="canonical" href="__BASE__/resenas/solo.html">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Solo runs | Dos para Duo","description":"Reseñas en español de los juegos que Player 1 jugó en solitario.","isPartOf":{"@type":"WebSite","name":"Dos para Duo","url":"__BASE__/"}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/menu.css?v=4">
<link rel="stylesheet" href="../assets/fx.css?v=3">
<script src="../assets/menu.js?v=4" defer></script>
<script src="../assets/fx.js?v=3" defer data-fx-base="../"></script>
<style>__CSS__
.tools{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
#buscar{flex:1;min-width:220px;padding:12px 16px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);font-family:var(--body);font-size:.95rem}
#buscar:focus{outline:none;border-color:var(--p1)}
.fbtn{font-family:var(--mono);font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:10px 16px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.fbtn:hover{border-color:var(--p2);color:var(--p2)}
.ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
.gcard{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .22s,border-color .22s}
.gcard:hover{transform:translateY(-5px);border-color:var(--p1)}
.gimg{position:relative;aspect-ratio:460/215;background:var(--bg-2)}
.gimg img{width:100%;height:100%;object-fit:cover;display:block}
.gimg.noimg img{display:none}
.vbadge{position:absolute;top:8px;left:8px;font-family:var(--mono);font-size:.55rem;letter-spacing:1px;background:rgba(var(--p1-rgb),.92);color:#fff;padding:4px 8px;border-radius:4px}
.ginfo{padding:14px 16px 16px}
.ginfo h3{font-size:.95rem;font-weight:600;color:var(--text);line-height:1.35}
.ginfo p{font-family:var(--mono);font-size:.66rem;letter-spacing:1px;color:var(--muted);margin-top:6px}
.empty{display:none;text-align:center;color:var(--muted);padding:50px 0;font-family:var(--mono);font-size:.8rem;letter-spacing:1px}
</style>
</head>
<body>
<div class="atmos"></div>
__NAV__
<main>
  <p class="crumb"><a href="./">← Reseñas</a> / Solo runs</p>
  <h1 class="sec" data-scramble>Solo runs</h1>
  <p class="sub">Los <b style="color:var(--text)">__NS__ juegos que Player 1 jugó en solitario</b>: souls, terror, indies y experimentos. La otra mitad de la biblioteca, reseñada con el mismo rigor (y el mismo drama).</p>
  <div class="tools">
    <input id="buscar" type="text" placeholder="Buscar juego...">
    <a class="fbtn" href="./">◂ Jugados juntos</a>
  </div>
  <div class="ggrid" id="grid">
__CARDS__
  </div>
  <p class="empty" id="empty">▮ NADA POR AQUÍ. PRUEBA OTRA BÚSQUEDA ▮</p>
</main>
__FOOTER__
<script>
const q=document.getElementById('buscar'),cards=[...document.querySelectorAll('#grid .gcard')];
q.addEventListener('input',()=>{
  const t=q.value.toLowerCase().trim();let vis=0;
  cards.forEach(c=>{const ok=!t||c.dataset.nombre.includes(t);c.style.display=ok?'':'none';if(ok)vis++;});
  document.getElementById('empty').style.display=vis?'none':'block';
});
</script>
</body>
</html>"""

cards_solo = '\n'.join(card(r) for r in solo)
solo_html = (SOLO_INDEX
    .replace('<head>', '<head>\n' + GTAG, 1)
    .replace('__CSS__', CSS)
    .replace('__NAV__', NAV.replace('__HOME__','../'))
    .replace('__FOOTER__', FOOTER.replace('__HOME__','../'))
    .replace('__CARDS__', cards_solo)
    .replace('__NS__', str(len(solo)))
    .replace('__BASE__', BASE))
(OUT/'solo.html').write_text(solo_html, encoding='utf-8')

slugs = [render_page(r) for r in juntos + extras]
slugs += [render_page(r, solo=True) for r in solo]

# ---------- sitemap + robots + nojekyll ----------
urls = [f'{BASE}/', f'{BASE}/nosotros.html', f'{BASE}/merch.html', f'{BASE}/apoyo.html', f'{BASE}/contacto.html', f'{BASE}/listas/mejores-juegos-cooperativos-para-parejas.html', f'{BASE}/resenas/', f'{BASE}/resenas/solo.html'] + [f'{BASE}/resenas/{s}.html' for s in slugs]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sm += '\n'.join(f'  <url><loc>{u}</loc></url>' for u in urls) + '\n</urlset>'
(ROOT/'sitemap.xml').write_text(sm, encoding='utf-8')
(ROOT/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n', encoding='utf-8')
(ROOT/'.nojekyll').write_text('', encoding='utf-8')

print(f'OK: {len(juntos)} juntos + {len(extras)} extras + {len(solo)} solo runs = {len(slugs)} paginas, sitemap con {len(urls)} URLs')

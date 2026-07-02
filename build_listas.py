# -*- coding: utf-8 -*-
"""Genera las páginas de listas/guías evergreen del sitio.
Lee reviews_jack_raw.json para carátulas, horas y links a reseñas existentes.
v1: 'Los mejores juegos cooperativos para parejas'."""
import json, re, unicodedata, html as hm
from pathlib import Path

ROOT = Path(r'D:\dosparaduo-web')
OUT = ROOT / 'listas'
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

def norm(s):
    s = s.replace('™','').replace('®','').replace('’',"'")
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode()
    return re.sub(r'\s+',' ', s.replace("'",'').lower()).strip()

def slug(s):
    s = s.replace('™','').replace('®','').replace('’',"'")
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode().lower()
    return re.sub(r'-+','-', re.sub(r'[^a-z0-9]+','-', s)).strip('-')

reviews = json.loads((ROOT/'reviews_jack_raw.json').read_text(encoding='utf-8'))
idx = {norm(r['nombre']): r for r in reviews}

# ---- Ranking curado: (nombre, etiqueta "para qué pareja", blurb en voz del dúo) ----
RANKING = [
 ("It Takes Two", "El imprescindible",
  "Si solo van a jugar UN juego en pareja en su vida, que sea este. Hazelight lo diseñó literalmente para dos personas: cada nivel cambia las mecánicas y obliga a cooperar de verdad. Nosotros lo terminamos en ~16 horas entre risas y uno que otro reclamo. Bonus: con el Friend's Pass solo necesitan una copia."),
 ("Split Fiction", "El sucesor",
  "Del mismo estudio que It Takes Two, y se nota. Dos escritoras atrapadas entre mundos de fantasía y ciencia ficción: cada capítulo es una idea nueva. Le metimos casi 24 horas y el final nos dejó hablando del juego varios días. Si It Takes Two les gustó, este es el siguiente paso obligado."),
 ("Overcooked! All You Can Eat", "La prueba de fuego",
  "Hay parejas que sobreviven Overcooked y parejas que descubren cosas de sí mismas. Cocinar contra el reloj mientras la cocina se incendia, se mueve o se parte en dos es la prueba de comunicación definitiva. Llevamos casi 60 horas y seguimos gritando '¡PLATOS!'. Con una copia juegan los dos en el sillón."),
 ("Portal 2", "El de los puzzles",
  "El modo cooperativo de Portal 2 es una clase magistral: puzzles diseñados para que NINGUNO pueda resolverlos solo. Aquí no hay caos ni prisa: hay pensar juntos, señalar paredes y ese momento glorioso de '¡AHHH, YA ENTENDÍ!' al mismo tiempo. Más de 20 horas de pura química mental."),
 ("We Were Here Too", "El de comunicar o morir",
  "Cada quien en un cuarto distinto, comunicados solo por walkie-talkie. Uno ve símbolos, el otro ve palancas, y describir 'una cosa como tridente pero curveada' se vuelve un arte. Perfecto para parejas que creen que se comunican bien: este juego se los va a confirmar… o no. La saga completa vale la pena."),
 ("Keep Talking and Nobody Explodes", "El de la bomba",
  "Uno tiene una bomba frente a la pantalla; el otro, un manual incomprensible y prohibido ver la pantalla. Resultado: la conversación más estresante y divertida de su relación. Sesiones cortas, risas garantizadas y un nivel de tensión que ningún juego de terror logra. 10+ horas y seguimos explotando."),
 ("Move or Die", "El del caos en 20 segundos",
  "Rondas de 20 segundos donde las reglas cambian cada vez: muévete o muere, literal. Es competitivo, es injusto, es perfecto para descubrir quién de los dos es más rabioso. Lo jugamos en el canal y el veredicto fue claro: cuando todo es azar, gana quien grita menos. Ideal para cerrar la noche."),
 ("Pummel Party", "El destruye-relaciones",
  "Mario Party sin contrato de paz: tablero, minijuegos y traiciones con armas. Es el juego que sacas cuando la relación está sólida y quieres ponerla a prueba con risas. Cada partida termina con un '¿por qué me hiciste eso?' y con ganas de la revancha inmediata."),
 ("Biped", "El más tierno",
  "Dos robotitos que caminan con dos patas cada uno, y cada pata es un stick. Suena simple hasta que hay que coordinarse para cruzar un puente y los dos terminan en el suelo, de risa. Corto, precioso y accesible. De los mejores para una pareja donde uno apenas empieza a jugar."),
 ("Cuphead", "El de sufrir juntos",
  "Para parejas que ya pasaron las pruebas anteriores y quieren el modo difícil de la relación. Jefes brutales estilo caricatura de los años 30 donde morir es parte del ritmo. 43 horas en nuestro contador lo confirman: pocas cosas unen más que por fin tumbar juntos al jefe que los humilló veinte veces."),
]

MENCIONES = ["SUPER CRAZY RHYTHM CASTLE","Exploding Kittens 2","Stumble Guys","Screencheat","METAL SLUG","Bloons TD 6","Sagrada","Radical Rabbit Stew","Blanc","We Were Here Expeditions: The FriendShip"]

VIDEO_MOVE_OR_DIE = "Ra5H1bkkEj4"

def datos(nombre):
    r = idx.get(norm(nombre))
    if not r:
        print('NO ENCONTRADO:', nombre); return None
    return r

items_html = []
schema_items = []
for i, (nombre, tag, blurb) in enumerate(RANKING, 1):
    r = datos(nombre)
    app = r['appid']
    s = slug(r['nombre'])
    horas = r['horas']
    video = f'''<a class="mini-btn vid" href="https://www.youtube.com/watch?v={VIDEO_MOVE_OR_DIE}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#play"/></svg> Verlo en el canal</a>''' if norm(nombre)=='move or die' else ''
    items_html.append(f'''    <article class="rank-card reveal fx-spot" id="{s}">
      <div class="rank-num">{i:02d}</div>
      <div class="rank-img">
        <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{app}/header.jpg" width="460" height="215" alt="Carátula de {hm.escape(r['nombre'])}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="rank-body">
        <span class="rank-tag">{hm.escape(tag)}</span>
        <h3>{hm.escape(r['nombre'])}</h3>
        <p class="rank-meta"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#thumbs-up"/></svg> Recomendado · {horas} hrs jugadas en pareja</p>
        <p class="rank-blurb">{blurb}</p>
        <div class="rank-links">
          <a class="mini-btn fx-btn" href="../resenas/{s}.html">Leer la reseña completa ▸</a>
          {video}
        </div>
      </div>
    </article>''')
    schema_items.append({"@type":"ListItem","position":i,"name":r['nombre'],"url":f"{BASE}/resenas/{s}.html"})

menciones_html = []
for nombre in MENCIONES:
    r = datos(nombre)
    if not r: continue
    s = slug(r['nombre'])
    menciones_html.append(f'<a class="chip-game" href="../resenas/{s}.html">{hm.escape(r["nombre"])}</a>')

FAQ = [
 ("¿Cuál es el mejor juego cooperativo para parejas?",
  "It Takes Two. Está diseñado específicamente para dos jugadores, las mecánicas cambian en cada nivel y con el Friend's Pass solo se necesita una copia. Es nuestra recomendación número uno para cualquier pareja, jueguen o no videojuegos normalmente."),
 ("¿Y si mi pareja nunca ha jugado videojuegos?",
  "Empiecen con Biped, Overcooked o It Takes Two: controles simples y la curva perfecta para alguien nuevo. En nuestro caso, Anahí (Player 2) empezó casi desde cero y hoy no le huye a ningún combate. La clave es elegir juegos donde cooperar importe más que el skill individual."),
 ("¿Cuáles son para reírse y cuáles para sufrir?",
  "Para reír: Biped, Move or Die, Pummel Party y Overcooked (al principio). Para sufrir bonito: Cuphead y los niveles finales de Overcooked. Para pensar juntos: Portal 2, We Were Here Too y Keep Talking and Nobody Explodes."),
 ("¿Necesitamos dos copias del juego?",
  "No siempre. It Takes Two y Split Fiction incluyen Friend's Pass (una copia basta para jugar en línea). Overcooked, Move or Die, Pummel Party, Biped y Cuphead se juegan en el mismo sillón con una sola copia. We Were Here Too y Keep Talking sí piden configuración aparte."),
]
faq_html = '\n'.join(f'''    <details class="faq reveal"><summary>{hm.escape(q)}</summary><p>{hm.escape(a)}</p></details>''' for q,a in FAQ)
faq_schema = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
    {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]}

list_schema = {"@context":"https://schema.org","@type":"ItemList",
  "name":"Los mejores juegos cooperativos para parejas",
  "description":"Ranking de juegos co-op para jugar en pareja, probados por una pareja real con horas verificables en Steam.",
  "itemListElement":schema_items}
breadcrumb = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":f"{BASE}/"},
  {"@type":"ListItem","position":2,"name":"Los mejores juegos cooperativos para parejas"}]}

PAGE = f'''<!DOCTYPE html>
<html lang="es">
<head>
{GTAG}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Los mejores juegos cooperativos para parejas (2026), probados en pareja | Dos para Duo</title>
<meta name="description" content="10 juegos co-op para jugar en pareja, probados por una pareja real: It Takes Two, Split Fiction, Overcooked, Portal 2 y más. Con horas jugadas reales, para quién es cada uno y qué esperar.">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="../assets/icon-512.png">
<link rel="apple-touch-icon" href="../assets/icon-512.png">
<link rel="manifest" href="../site.webmanifest">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://onlyjackdaniel.github.io/dosparaduo/assets/icon-512.png">
<link rel="preconnect" href="https://i.ytimg.com" crossorigin>
<meta property="og:title" content="Los mejores juegos cooperativos para parejas, probados en pareja">
<meta property="og:description" content="Ranking honesto de una pareja gamer real: del imprescindible It Takes Two al sufrimiento compartido de Cuphead.">
<meta property="og:type" content="article">
<meta property="og:image" content="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{idx[norm('It Takes Two')]['appid']}/header.jpg">
<link rel="canonical" href="{BASE}/listas/mejores-juegos-cooperativos-para-parejas.html">
<script type="application/ld+json">{json.dumps(list_schema, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(faq_schema, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(breadcrumb, ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Outfit:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/menu.css?v=5">
<link rel="stylesheet" href="../assets/fx.css?v=3">
<script src="../assets/menu.js?v=5" defer></script>
<script src="../assets/fx.js?v=3" defer data-fx-base="../"></script>
<style>
@media (prefers-reduced-motion: reduce){{*,*::before,*::after{{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}}}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;overflow-x:hidden}}
::selection{{background:var(--p1);color:#fff}}
.atmos{{position:fixed;inset:0;pointer-events:none;z-index:0}}
.atmos::before{{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(var(--p1-rgb),.04) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--p1-rgb),.04) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 90% 70% at 50% 0%,#000 30%,transparent 75%)}}
nav{{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:rgba(11,14,26,.78);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}}
.logo{{display:flex;align-items:center;gap:12px;text-decoration:none}}
.logo img{{width:36px;height:36px;border-radius:50%;border:2px solid var(--p2)}}
.logo span{{font-family:var(--display);font-size:.95rem;color:var(--text)}}
.nav-links{{display:flex;align-items:center;gap:26px}}
.nav-links a{{color:var(--muted);text-decoration:none;font-family:var(--mono);font-size:.78rem;text-transform:uppercase;letter-spacing:1.5px;transition:color .2s}}
.nav-links a:hover{{color:var(--p2)}}
.btn-yt{{display:inline-flex;align-items:center;gap:8px;background:var(--p2);color:#fff !important;padding:9px 18px;border-radius:8px;font-weight:700;letter-spacing:1px;box-shadow:0 0 18px rgba(var(--p2-rgb),.45)}}
main{{position:relative;z-index:1;max-width:880px;margin:0 auto;padding:120px 24px 80px}}
.crumb{{font-family:var(--mono);font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}}
.crumb a{{color:var(--p1);text-decoration:none}}
h1{{font-family:var(--display);font-size:clamp(1.7rem,5vw,2.8rem);text-transform:uppercase;line-height:1.15;margin:12px 0 8px}}
h1 span{{color:var(--gold)}}
.intro{{color:#c9d2ea;font-weight:300;max-width:760px;margin-bottom:14px}}
.intro b{{color:var(--text);font-weight:600}}
.cred{{font-family:var(--mono);font-size:.68rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:8px;padding:12px 16px;display:inline-block;margin:14px 0 50px}}
.cred b{{color:var(--gold)}}
.rank-card{{display:grid;grid-template-columns:auto 230px 1fr;gap:22px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;margin-bottom:22px;align-items:start;transition:border-color .25s}}
.rank-card:hover{{border-color:var(--p1)}}
.rank-num{{font-family:var(--display);font-size:1.9rem;color:var(--gold);line-height:1}}
.rank-img img{{width:100%;border-radius:10px;border:1px solid var(--line);display:block}}
.rank-tag{{font-family:var(--mono);font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:var(--p2)}}
.rank-body h3{{font-family:var(--display);font-size:1.25rem;text-transform:uppercase;margin:6px 0 4px}}
.rank-meta{{font-family:var(--mono);font-size:.66rem;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-bottom:10px}}
.rank-blurb{{color:#c9d2ea;font-weight:300;font-size:.95rem}}
.rank-links{{margin-top:14px;display:flex;gap:12px;flex-wrap:wrap}}
.mini-btn{{font-family:var(--mono);font-size:.66rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--p1);text-decoration:none;border:1px solid var(--line);border-radius:6px;padding:8px 14px;transition:border-color .2s}}
.mini-btn:hover{{border-color:var(--p1)}}
.mini-btn.vid{{color:var(--p2)}}
.mini-btn.vid:hover{{border-color:var(--p2)}}
h2.sec{{font-family:var(--display);font-size:clamp(1.2rem,3.5vw,1.7rem);text-transform:uppercase;margin:60px 0 10px}}
h2.sec span{{color:var(--p2)}}
.sec-sub{{color:var(--muted);font-weight:300;margin-bottom:24px}}
.chips{{display:flex;gap:10px;flex-wrap:wrap}}
.chip-game{{font-family:var(--mono);font-size:.66rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:8px 16px;transition:all .2s}}
.chip-game:hover{{border-color:var(--p2);color:var(--p2)}}
.faq{{background:var(--panel);border:1px solid var(--line);border-radius:12px;margin-bottom:12px;overflow:hidden}}
.faq summary{{cursor:pointer;padding:18px 20px;font-weight:600;list-style:none;position:relative}}
.faq summary::after{{content:"+";position:absolute;right:20px;color:var(--gold);font-family:var(--display)}}
.faq[open] summary::after{{content:"−"}}
.faq p{{padding:0 20px 18px;color:#c9d2ea;font-weight:300;font-size:.95rem}}
.outro{{background:linear-gradient(120deg,rgba(var(--p1-rgb),.08),rgba(var(--p2-rgb),.08));border:1px solid var(--line);border-radius:16px;padding:36px 30px;text-align:center;margin-top:60px}}
.outro h2{{font-family:var(--display);font-size:1.4rem;text-transform:uppercase;margin-bottom:10px}}
.outro p{{color:var(--muted);font-weight:300;max-width:560px;margin:0 auto 22px}}
footer{{position:relative;z-index:1;border-top:1px solid var(--line);padding:40px 24px;text-align:center;background:var(--bg-2);margin-top:80px}}
footer .f-logo{{font-family:var(--display);font-size:1rem;text-transform:uppercase}}
footer p{{color:var(--muted);font-size:.78rem;margin-top:8px;font-family:var(--mono)}}
footer a{{color:var(--p1);text-decoration:none}}
.reveal{{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}}
.reveal.in{{opacity:1;transform:none}}
@media(max-width:760px){{.nav-links a:not(.btn-yt){{display:none}}.rank-card{{grid-template-columns:1fr;gap:14px}}.rank-img img{{max-width:300px}}}}
@media (prefers-reduced-motion:reduce){{*,*::before,*::after{{animation-duration:.01ms !important;transition-duration:.01ms !important}}}}
</style>
</head>
<body>
<div class="atmos"></div>
<nav>
  <a class="logo" href="../index.html">
    <img src="../assets/icon-512.png" width="36" height="36" alt="Logo Dos para Duo">
    <span>Dos <em style="color:var(--gold);font-style:normal">para</em> <b style="color:var(--p2)">Duo</b></span>
  </a>
  <button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button>
  <div class="nav-links">
    <a href="../index.html#inicio">Inicio</a>
    <a href="../index.html#videos">Videos</a>
    <a href="../resenas/">Reseñas</a>
    <a href="../merch.html">Merch</a>
    <a href="../apoyo.html">Apóyanos</a>
    <a href="../nosotros.html">Nosotros</a>
    <a class="btn-yt fx-btn" href="https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw?sub_confirmation=1" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#youtube-logo"/></svg> Suscríbete</a>
  </div>
</nav>
<main>
  <p class="crumb"><a href="../index.html">← Inicio</a> / Guías / Co-op para parejas</p>
  <h1>Los mejores juegos <span>cooperativos para parejas</span></h1>
  <p class="intro">Somos <b>Jack y Anahí</b>, una pareja que juega junta (casi) todas las noches: uno gamer de toda la vida, la otra empezando casi de cero. Esta lista no salió de notas de prensa: <b>cada juego lo jugamos en pareja de verdad</b>, con las horas para probarlo. Aquí está lo que funcionó, para quién es cada uno, y en cuál casi nos peleamos.</p>
  <p class="cred">★ PROBADO EN PAREJA · <b>+250 HRS</b> ACUMULADAS SOLO EN ESTA LISTA · ACTUALIZADA JUN 2026</p>

{chr(10).join(items_html)}

  <h2 class="sec">Menciones <span>honoríficas</span></h2>
  <p class="sec-sub">También los jugamos juntos y también valen la pena. Clic para leer la reseña de cada uno.</p>
  <div class="chips">
    {''.join(menciones_html)}
  </div>

  <h2 class="sec">Preguntas <span>frecuentes</span></h2>
{faq_html}

  <div class="outro reveal">
    <h2>¿Quieren vernos sufrir en vivo?</h2>
    <p>Jugamos estos (y los que vienen) en el canal, con la reacción real de quién grita primero.</p>
    <a class="btn-yt fx-btn" href="https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw?sub_confirmation=1" target="_blank" rel="noopener" style="text-decoration:none"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#youtube-logo"/></svg> Súmate al party</a>
  </div>
</main>
<footer>
  <div class="f-logo">Dos <em style="font-style:normal;color:var(--p1)">para</em> <b style="color:var(--p2)">Duo</b></div>
  <p>© 2026 Dos para Duo · <a href="https://www.youtube.com/channel/UCgb9fFANiLW5zgiPVXBRBdw" target="_blank" rel="noopener">YouTube</a> · <a href="../resenas/">Reseñas</a> · <a href="../merch.html">Merch</a> · <a href="../apoyo.html">Apóyanos</a> · <a href="../contacto.html">Contacto</a></p>
  <div class="f-social">
    <a href="https://www.youtube.com/@DosparaDuo" target="_blank" rel="noopener" aria-label="YouTube de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#youtube-logo"/></svg></a>
    <a href="https://www.tiktok.com/@dosparaduo" target="_blank" rel="noopener" aria-label="TikTok de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#tiktok-logo"/></svg></a>
    <a href="https://www.reddit.com/user/Dosparaduo/" target="_blank" rel="noopener" aria-label="Reddit de Dos para Duo"><svg class="ico" aria-hidden="true"><use href="../assets/icons.svg#reddit-logo"/></svg></a>
  </div>
</footer>
</body>
</html>'''

(OUT/'mejores-juegos-cooperativos-para-parejas.html').write_text(PAGE, encoding='utf-8')
print('OK: listas/mejores-juegos-cooperativos-para-parejas.html generada con', len(RANKING), 'juegos +', len(menciones_html), 'menciones')

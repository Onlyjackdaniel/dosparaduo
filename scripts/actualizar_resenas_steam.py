"""
Actualiza reviews_jack_raw.json desde el perfil publico de Steam de Jack.

Por que existe: build_resenas.py genera todo el sitio desde reviews_jack_raw.json,
pero ese archivo se regeneraba a mano. Resultado: una resena nueva en Steam no
llegaba al sitio hasta que alguien se acordaba. Este script cierra esa cadena y
corre solo en el workflow diario.

Uso: python scripts/actualizar_resenas_steam.py

Guardas de seguridad (importantes, no quitar):
  - Si Steam responde raro y salen MENOS resenas que las que ya hay guardadas,
    NO se sobreescribe el archivo. Un cambio de HTML en Steam no puede vaciar el sitio.
  - Si no se pudo leer ni una sola resena, el script falla con codigo 1 y no toca nada.
"""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

# la consola de Windows es cp1252 y truena con los nombres de juego con acentos
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

PERFIL = "https://steamcommunity.com/id/Onlyjackdaniel/recommended/"
ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "reviews_jack_raw.json"
MAX_PAGINAS = 40
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

RE_APP = re.compile(r'steamcommunity\.com/app/(\d+)')
RE_VOTO = re.compile(r'icon_thumbs(Up|Down)\.png')
RE_HORAS = re.compile(r'<div class="hours">\s*([\d.,]+) hrs on record', re.S)
RE_FECHA = re.compile(r'<div class="posted">\s*Posted:?\s*(.*?)\s*</div>', re.S)
RE_CONTENIDO = re.compile(r'<div class="content\s*">(.*)', re.S)
CORTES = ('<div class="reviewer_hardware', '<div class="posted">', '<div class="hr">')


def trocear(html):
    """Corta el HTML en una caja por resena. Steam no cierra los divs de forma
    parseable, asi que se parte por el marcador de inicio de cada caja."""
    partes = html.split('class="review_box"')
    return partes[1:]


def limpiar_contenido(bloque):
    m = RE_CONTENIDO.search(bloque)
    if not m:
        return None
    texto = m.group(1)
    corte = len(texto)
    for marca in CORTES:
        i = texto.find(marca)
        if i != -1:
            corte = min(corte, i)
    texto = texto[:corte].rstrip()
    # sobra el </div> con el que cerraba el bloque de contenido
    if texto.endswith('</div>'):
        texto = texto[:-6].rstrip()
    return texto.strip()


def bajar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def parsear(html):
    salida = []
    for caja in trocear(html):
        app = RE_APP.search(caja)
        voto = RE_VOTO.search(caja)
        horas = RE_HORAS.search(caja)
        fecha = RE_FECHA.search(caja)
        contenido = limpiar_contenido(caja)
        if not (app and contenido):
            continue
        salida.append({
            "appid": app.group(1),
            "voto": "up" if (voto and voto.group(1) == "Up") else "down",
            "horas": (horas.group(1).replace(",", "") if horas else "0"),
            "fecha": (re.sub(r"\s+", " ", fecha.group(1)).strip() if fecha else ""),
            "html": contenido,
        })
    return salida


def nombre_desde_api(appid):
    """Ultimo recurso: la tienda de Steam da el nombre oficial del juego."""
    url = f"https://store.steampowered.com/api/appdetails?appids={appid}&l=spanish"
    try:
        d = json.loads(bajar(url))
        if d.get(str(appid), {}).get("success"):
            return d[str(appid)]["data"]["name"]
    except Exception as e:
        print(f"  no se pudo resolver el nombre de {appid}: {e}")
    return None


def main():
    resenas = []
    vistos = set()
    for pagina in range(1, MAX_PAGINAS + 1):
        try:
            html = bajar(f"{PERFIL}?p={pagina}")
        except Exception as e:
            print(f"Pagina {pagina}: no se pudo bajar ({e}). Se corta aqui.")
            break
        lote = parsear(html)
        if not lote:
            break
        nuevos = 0
        for r in lote:
            if r["appid"] in vistos:
                continue
            vistos.add(r["appid"])
            resenas.append(r)
            nuevos += 1
        print(f"Pagina {pagina}: {nuevos} resenas")
        if nuevos == 0:
            break
        time.sleep(1.5)

    if not resenas:
        print("ERROR: no se leyo ni una resena. Steam pudo haber cambiado el HTML. No se toca el archivo.")
        return 1

    previas = []
    if DESTINO.exists():
        try:
            previas = json.loads(DESTINO.read_text(encoding="utf-8"))
        except Exception:
            previas = []

    # El nombre del juego lo necesita build_resenas.py. Se conserva el que ya estaba
    # (asi no se pierden los ajustes hechos a mano) y solo se consulta la API para los nuevos.
    nombres = {r["appid"]: r.get("nombre") for r in previas if r.get("nombre")}
    sin_nombre = []
    for r in resenas:
        n = nombres.get(r["appid"])
        if not n:
            n = nombre_desde_api(r["appid"])
            time.sleep(1.0)
            if not n:
                sin_nombre.append(r["appid"])
                continue
            print(f"  nombre resuelto: {r['appid']} -> {n}")
        r["nombre"] = n
    if sin_nombre:
        print(f"AVISO: {len(sin_nombre)} resenas sin nombre, se descartan: {sin_nombre}")
        resenas = [r for r in resenas if r.get("nombre")]

    if previas and len(resenas) < len(previas):
        print(f"AVISO: se leyeron {len(resenas)} resenas y ya habia {len(previas)}. "
              "No se sobreescribe: sospecha de lectura incompleta.")
        return 1

    if previas and len(resenas) == len(previas):
        print(f"Sin cambios: {len(resenas)} resenas.")
        DESTINO.write_text(json.dumps(resenas, ensure_ascii=False, indent=1), encoding="utf-8")
        return 0

    DESTINO.write_text(json.dumps(resenas, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: {len(resenas)} resenas guardadas ({len(resenas) - len(previas)} nuevas).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

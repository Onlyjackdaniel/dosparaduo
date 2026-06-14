// Banner de consentimiento + Google Consent Mode v2.
// El gtag inline ya arranca con consentimiento DENEGADO por defecto (en el <head>).
// Aquí solo: (1) si el usuario ya eligió antes, aplicamos su decisión; (2) si no,
// mostramos el banner y actualizamos el consentimiento según lo que elija.
(function () {
  var KEY = 'dpd_consent';            // 'granted' | 'denied'
  var PRIVACY = '/dosparaduo/privacidad.html'; // en dominio propio sería '/privacidad.html'

  function gt() { window.dataLayer = window.dataLayer || []; return window.gtag || function () { window.dataLayer.push(arguments); }; }

  function update(state) {
    var granted = state === 'granted';
    gt()('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function decide(state) {
    try { localStorage.setItem(KEY, state); } catch (e) {}
    update(state);
    var b = document.getElementById('dpd-consent');
    if (b) b.parentNode.removeChild(b);
  }

  var prev = null;
  try { prev = localStorage.getItem(KEY); } catch (e) {}
  if (prev === 'granted' || prev === 'denied') { update(prev); return; }

  function build() {
    var css = '#dpd-consent{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;'
      + 'width:min(680px,calc(100% - 28px));background:#142440;border:1px solid #273b5e;border-radius:14px;'
      + 'box-shadow:0 12px 40px rgba(0,0,0,.45);padding:18px 20px;color:#f0f4ff;'
      + "font-family:'Outfit',system-ui,sans-serif;font-size:.92rem;line-height:1.5;"
      + 'display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;justify-content:space-between}'
      + '#dpd-consent p{margin:0;flex:1 1 320px}'
      + '#dpd-consent a{color:#3cb8ec;text-decoration:underline}'
      + '#dpd-consent .dpd-btns{display:flex;gap:10px;flex:0 0 auto}'
      + '#dpd-consent button{cursor:pointer;border:0;border-radius:8px;padding:10px 16px;'
      + "font-family:'Space Mono',monospace;font-size:.74rem;letter-spacing:1px;text-transform:uppercase;font-weight:700}"
      + '#dpd-consent .dpd-ok{background:#3cb8ec;color:#062536}'
      + '#dpd-consent .dpd-no{background:transparent;color:#8da0bf;border:1px solid #273b5e}'
      + '@media(prefers-reduced-motion:no-preference){#dpd-consent{animation:dpdup .35s ease}}'
      + '@keyframes dpdup{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'dpd-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.innerHTML = '<p>Usamos cookies de <b>Google Analytics</b> para entender qué contenido te gusta. '
      + 'Puedes aceptarlas o rechazarlas. <a href="' + PRIVACY + '">Aviso de privacidad</a>.</p>'
      + '<div class="dpd-btns">'
      + '<button class="dpd-no" type="button">Rechazar</button>'
      + '<button class="dpd-ok" type="button">Aceptar</button>'
      + '</div>';
    document.body.appendChild(bar);
    bar.querySelector('.dpd-ok').addEventListener('click', function () { decide('granted'); });
    bar.querySelector('.dpd-no').addEventListener('click', function () { decide('denied'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

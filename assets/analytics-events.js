// Eventos GA4 de interacción · lo que de verdad importa para un creador:
// clics a "Suscríbete", a redes, a merch y cualquier enlace saliente.
// Los eventos pasan por gtag → con Consent Mode, si el usuario no aceptó cookies,
// Google los maneja en modo sin-cookies (no se pierde la medición agregada).
(function () {
  function gt() { window.dataLayer = window.dataLayer || []; return window.gtag || function () { window.dataLayer.push(arguments); }; }

  function classify(url, text) {
    var h = (url.hostname || '').replace(/^www\./, '');
    var href = url.href;
    if (/youtube\.com|youtu\.be/.test(h)) {
      if (/sub_confirmation=1/.test(href)) return { event: 'subscribe_click', network: 'youtube' };
      return { event: 'youtube_click', network: 'youtube' };
    }
    if (/instagram\.com/.test(h)) return { event: 'social_click', network: 'instagram' };
    if (/tiktok\.com/.test(h)) return { event: 'social_click', network: 'tiktok' };
    if (/twitter\.com|x\.com/.test(h)) return { event: 'social_click', network: 'x' };
    if (/twitch\.tv/.test(h)) return { event: 'social_click', network: 'twitch' };
    if (/discord\.(gg|com)/.test(h)) return { event: 'social_click', network: 'discord' };
    if (/steamcommunity\.com|store\.steampowered\.com/.test(h)) return { event: 'steam_click', network: 'steam' };
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (!/^https?:$/.test(url.protocol)) return;

    var text = (a.textContent || '').trim().slice(0, 80);
    var outbound = url.hostname !== location.hostname;
    var info = classify(url, text);

    if (info) {
      gt()('event', info.event, { network: info.network, link_url: url.href, link_text: text });
    } else if (outbound) {
      gt()('event', 'outbound_click', { link_domain: url.hostname, link_url: url.href, link_text: text });
    }
  }, true);
})();

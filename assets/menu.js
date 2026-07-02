/* ============================================================
   DOS PARA DUO · Menu radial "weapon wheel" (compartido por
   todas las paginas). Adaptado del pack Animmaster
   (Navigation Menus/21) a vanilla puro: sin GSAP, con joystick
   arrastrable, sonidos arcade y flicker retro.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
'use strict';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* base relativa (las paginas de /resenas/ y /listas/ cargan ../assets/menu.js) */
var src = document.querySelector('script[src*="menu.js"]');
var BASE = src ? src.getAttribute('src').split('?')[0].replace('assets/menu.js', '') : '';

var burger = document.querySelector('.burger');
var links = Array.prototype.slice.call(document.querySelectorAll('nav .nav-links a'))
  /* fuera "Videos": es solo un ancla del home y ahi ya estan los videos (decision Jack) */
  .filter(function (a) { return (a.getAttribute('href') || '').indexOf('#videos') === -1; });
if (!burger || !links.length) return;

/* icono por destino */
function icono(a) {
  var t = a.textContent.toLowerCase();
  if (t.indexOf('inicio') > -1) return 'joystick';
  if (t.indexOf('video') > -1) return 'play';
  if (t.indexOf('rese') > -1) return 'sword';
  if (t.indexOf('merch') > -1) return 't-shirt';
  if (t.indexOf('ap') === 0 || t.indexOf('apóyanos') > -1) return 'gift';
  if (t.indexOf('nosotros') > -1) return 'users-three';
  if (t.indexOf('suscr') > -1) return 'youtube-logo';
  return 'star';
}
function suena(nombre) {
  try {
    var a = new Audio(BASE + 'assets/snd/' + nombre + '.mp3');
    a.volume = 0.35;
    a.play().catch(function () {});
  } catch (e) {}
}
function svg(id, cls) {
  return '<svg class="' + (cls || 'ico') + '" aria-hidden="true"><use href="' + BASE + 'assets/icons.svg#' + id + '"/></svg>';
}

/* ── construir overlay ── */
var ov = document.createElement('div');
ov.className = 'rm-overlay';
ov.setAttribute('role', 'dialog');
ov.setAttribute('aria-label', 'Menú del sitio');
ov.innerHTML =
  '<div class="rm-top"><span class="rm-title">SELECT SCREEN</span>' +
  '<button class="rm-close" type="button" aria-label="Cerrar menú">✕</button></div>' +
  '<div class="rm-wheel"><div class="rm-joystick" aria-hidden="true">' + svg('game-controller', 'rm-jico') + '</div></div>' +
  '<div class="rm-foot">DOS PARA DUO · ARRASTRA EL JOYSTICK O TOCA UNA PANTALLA</div>';
document.body.appendChild(ov);
var wheel = ov.querySelector('.rm-wheel');
var joy = ov.querySelector('.rm-joystick');

var TAM = 0, CENTRO = 0, R_IN = 0, R_OUT = 0, R_TXT = 0;
function medidas() {
  TAM = Math.min(innerWidth * 0.96, innerHeight * 0.9, 832);
  CENTRO = TAM / 2; R_IN = TAM * 0.09; R_OUT = TAM * 0.46; R_TXT = TAM * 0.3;
  wheel.style.width = TAM + 'px'; wheel.style.height = TAM + 'px';
}

var segs = [];
function armar() {
  medidas();
  segs.forEach(function (s) { s.remove(); }); segs = [];
  var n = links.length, paso = 360 / n;
  links.forEach(function (a, i) {
    var g = document.createElement('a');
    g.className = 'rm-seg';
    g.href = a.getAttribute('href');
    if (a.target) { g.target = a.target; g.rel = a.rel || ''; }
    var a0 = paso * i + 0.25, a1 = paso * (i + 1) - 0.25, am = paso * i + paso / 2;
    function pt(r, ang) {
      var rad = (ang - 90) * Math.PI / 180;
      return (CENTRO + r * Math.cos(rad)) + ' ' + (CENTRO + r * Math.sin(rad));
    }
    var arco = (a1 - a0) > 180 ? 1 : 0;
    g.style.clipPath = "path('M " + pt(R_IN, a0) + ' L ' + pt(R_OUT, a0) +
      ' A ' + R_OUT + ' ' + R_OUT + ' 0 ' + arco + ' 1 ' + pt(R_OUT, a1) +
      ' L ' + pt(R_IN, a1) +
      ' A ' + R_IN + ' ' + R_IN + ' 0 ' + arco + ' 0 ' + pt(R_IN, a0) + "')";
    g.style.width = TAM + 'px'; g.style.height = TAM + 'px';
    var rad = (am - 90) * Math.PI / 180;
    var cx = CENTRO + R_TXT * Math.cos(rad), cy = CENTRO + R_TXT * Math.sin(rad);
    g.innerHTML = '<span class="rm-seg-c" style="left:' + cx + 'px;top:' + cy + 'px">' +
      svg(icono(a), 'rm-sico') + '<b>' + a.textContent.trim() + '</b></span>';
    g.addEventListener('mouseenter', function () { if (abierto) suena('menu-select'); });
    g.addEventListener('click', cerrarSuave);
    wheel.insertBefore(g, joy);
    segs.push(g);
  });
}
armar();
addEventListener('resize', function () { if (!abierto) armar(); });

/* ── abrir / cerrar con flicker ── */
var abierto = false, animando = false;
function flicker(el, entra, delay) {
  el.style.animation = 'none'; void el.offsetWidth;
  el.style.animation = (entra ? 'rmIn' : 'rmOut') + ' .3s steps(1) ' + delay + 'ms both';
  /* al terminar, soltar el estilo inline para que el flicker de hover (CSS) recupere el control */
  el.addEventListener('animationend', function limpia() {
    el.removeEventListener('animationend', limpia);
    if (entra) { el.style.animation = ''; el.style.opacity = 1; }
  });
}
function abrir() {
  if (animando || abierto) return;
  animando = true; abierto = true;
  suena('menu-open');
  ov.classList.add('on');
  document.body.classList.add('rm-lock');
  burger.setAttribute('aria-expanded', 'true');
  var orden = segs.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
  if (RM) { segs.forEach(function (s) { s.style.animation = 'none'; s.style.opacity = 1; }); animando = false; }
  else {
    orden.forEach(function (idx, pos) { flicker(segs[idx], true, 120 + pos * 70); });
    setTimeout(function () {
      animando = false;
      segs.forEach(function (s) { s.style.animation = ''; s.style.opacity = 1; });
    }, 120 + orden.length * 70 + 350);
  }
  ov.querySelector('.rm-close').focus();
}
function cerrar() {
  if (animando || !abierto) return;
  animando = true; abierto = false;
  suena('menu-close');
  var orden = segs.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
  if (!RM) orden.forEach(function (idx, pos) { flicker(segs[idx], false, pos * 45); });
  setTimeout(function () {
    ov.classList.remove('on');
    document.body.classList.remove('rm-lock');
    burger.setAttribute('aria-expanded', 'false');
    animando = false;
    burger.focus();
  }, RM ? 0 : orden.length * 45 + 320);
}
function cerrarSuave() { /* al navegar: cierre inmediato sin animacion larga */
  abierto = false;
  ov.classList.remove('on');
  document.body.classList.remove('rm-lock');
}

burger.innerHTML = '<span class="b-bar"></span><span class="b-bar"></span><span class="b-bar"></span>';
burger.classList.add('rm-trigger');
burger.setAttribute('aria-label', 'Abrir menú');
burger.addEventListener('click', function () { abierto ? cerrar() : abrir(); });
ov.querySelector('.rm-close').addEventListener('click', cerrar);
ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) cerrar(); });

/* ── joystick: arrastrar para apuntar, soltar para entrar ── */
var arrastrando = false, jx = 0, jy = 0, tx = 0, ty = 0, activo = -1, rafJ = 0;
function loopJoy() {
  rafJ = requestAnimationFrame(loopJoy);
  jx += (tx - jx) * .2; jy += (ty - jy) * .2;
  joy.style.transform = 'translate(calc(-50% + ' + jx + 'px), calc(-50% + ' + jy + 'px))';
  var d = Math.hypot(jx, jy);
  var idx = -1;
  if (arrastrando && d > 18) {
    var ang = Math.atan2(jy, jx) * 180 / Math.PI;
    idx = Math.floor(((ang + 90 + 360) % 360) / (360 / segs.length)) % segs.length;
  }
  if (idx !== activo) {
    if (activo > -1) segs[activo].classList.remove('rm-on');
    activo = idx;
    if (activo > -1) { segs[activo].classList.add('rm-on'); suena('menu-select'); }
  }
}
joy.addEventListener('pointerdown', function (e) {
  if (!abierto) return;
  arrastrando = true;
  joy.setPointerCapture(e.pointerId);
  var r0 = joy.parentElement.getBoundingClientRect();
  var cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  function mueve(ev) {
    if (!arrastrando) return;
    var dx = ev.clientX - cx, dy = ev.clientY - cy;
    var d = Math.hypot(dx, dy), max = 34;
    if (d > max) { dx *= max / d; dy *= max / d; }
    tx = dx; ty = dy;
  }
  function suelta() {
    arrastrando = false; tx = 0; ty = 0;
    joy.removeEventListener('pointermove', mueve);
    joy.removeEventListener('pointerup', suelta);
    if (activo > -1) { var destino = segs[activo]; setTimeout(function () { destino.click(); }, 120); }
  }
  joy.addEventListener('pointermove', mueve);
  joy.addEventListener('pointerup', suelta);
  if (!rafJ) loopJoy();
  e.preventDefault();
});
});

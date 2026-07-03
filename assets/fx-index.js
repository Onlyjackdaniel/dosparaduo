/* ============================================================
   DOS PARA DUO · FX de la portada
   1) Dot grid interactivo del hero (adaptado del pack Animmaster
      Background Animations/10, vanilla canvas, colores de marca).
   2) Carrusel de shorts con drag-to-scroll.
   Solo se carga en index.html.
   ============================================================ */
(function(){
'use strict';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var HOVER = matchMedia('(hover: hover)').matches;

/* ── 0. entrada del sitio: anillos de texto circular + PRESS START ──
   Adaptado del pack Animmaster (Hero Animations/16) a vanilla.
   Solo la primera visita de la sesion; se salta con hash, con
   reduced-motion o si ya se entro antes. */
(function(){
  /* decision de Jack (3 jul): la entrada solo aparece la PRIMERA visita real
     (localStorage; reaparece si el visitante borra datos del navegador).
     Tambien se salta con deep link a una seccion o con reduced-motion. */
  var YA = 'dpd-entrada-v1';
  try { if (localStorage.getItem(YA)) return; } catch(e) {}
  if (location.hash || RM) return;
  document.body.classList.add('gate');
  var ent = document.createElement('div');
  ent.id = 'entrada';
  ent.innerHTML =
    '<svg viewBox="0 0 1400 1400" aria-hidden="true">' +
    '<defs>' +
    '<path id="ac1" d="M250,700.5A450.5,450.5 0 1 11151,700.5A450.5,450.5 0 1 1250,700.5"/>' +
    '<path id="ac2" d="M382,700.5A318.5,318.5 0 1 11019,700.5A318.5,318.5 0 1 1382,700.5"/>' +
    '<path id="ac3" d="M487,700.5A213.5,213.5 0 1 1914,700.5A213.5,213.5 0 1 1487,700.5"/>' +
    '<path id="ac4" d="M567.5,700.5A133,133 0 1 1833.5,700.5A133,133 0 1 1567.5,700.5"/>' +
    '</defs>' +
    '<text class="t1" style="--vel:70s"><textPath href="#ac1" textLength="2830">Dos para Duo ★ una pareja ★ dos controles ★ cero mercy ★ co-op ★</textPath></text>' +
    '<text class="t2" style="--vel:55s"><textPath href="#ac2" textLength="2001">gaming cooperativo en español ★ retos ★ reseñas ★</textPath></text>' +
    '<text class="t3" style="--vel:45s"><textPath href="#ac3" textLength="1341">Player 1 &amp; Player 2 ★ ¿quién es el peor?</textPath></text>' +
    '<text class="t4" style="--vel:35s"><textPath href="#ac4" textLength="836">insert coin ★ insert coin ★</textPath></text>' +
    '</svg>' +
    '<button id="press-start" type="button">▸ Press Start</button>' +
    '<div class="pista">O PRESIONA ENTER · EL CANAL DE A DOS</div>';
  document.body.appendChild(ent);
  var btn = ent.querySelector('#press-start');
  /* giro por rAF con aceleracion/desaceleracion GRADUAL (lerp de velocidad) */
  var anillos = Array.prototype.map.call(ent.querySelectorAll('text'), function(el, i){
    el.style.animation = 'none';
    var dur = parseFloat(el.style.getPropertyValue('--vel')) || 60;
    var base = 360 / dur * (i % 2 ? -1 : 1);   /* grados por segundo, alternando sentido */
    return {el: el, ang: 0, vel: base, base: base};
  });
  var turbo = false;
  btn.addEventListener('mouseenter', function(){ turbo = true; });
  btn.addEventListener('mouseleave', function(){ turbo = false; });
  var tPrev = performance.now();
  (function gira(tNow){
    if (!ent.isConnected) return;
    requestAnimationFrame(gira);
    var dt = Math.min(50, tNow - tPrev) / 1000; tPrev = tNow;
    for (var i = 0; i < anillos.length; i++){
      var an = anillos[i];
      var objetivo = an.base * (turbo ? 5 : 1);
      an.vel += (objetivo - an.vel) * Math.min(1, dt * 2.2);  /* rampa suave */
      an.ang = (an.ang + an.vel * dt) % 360;
      an.el.style.transform = 'rotate(' + an.ang + 'deg)';
    }
  })(tPrev);
  function entrar(){
    if (ent.classList.contains('fuera')) return;
    try { localStorage.setItem(YA, '1'); } catch(e) {}
    try { var a = new Audio('assets/snd/menu-open.mp3'); a.volume = .35; a.play().catch(function(){}); } catch(e) {}
    ent.classList.add('fuera');
    document.body.classList.remove('gate');
    setTimeout(function(){ ent.remove(); }, 1700);
  }
  btn.addEventListener('click', entrar);
  addEventListener('keydown', function(e){ if (e.key === 'Enter') entrar(); });
})();

/* ── 1. dot grid del hero ── */
var hero = document.querySelector('header#inicio');
if(hero && HOVER && !RM){
  /* cubre TODO el home (decision Jack): canvas fijo al viewport, detras del contenido */
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none';
  cv.setAttribute('aria-hidden','true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');

  var DOT = 2.5, GAP = 34, PROX = 130, SHOCK = 240;
  var BASE = {r:39, g:59, b:94};      /* --line */
  var ACTIVE = {r:255, g:122, b:41};  /* --p2 naranja */
  var dots = [], w = 1, h = 1, dpr = 1;
  var mx = -9999, my = -9999;

  function build(){
    dpr = Math.max(1, devicePixelRatio || 1);
    w = innerWidth; h = innerHeight;
    cv.width = (w * dpr) | 0; cv.height = (h * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots.length = 0;
    var cell = DOT + GAP;
    var cols = Math.floor(w / cell), rows = Math.floor(h / cell);
    var sx = (w - cell * cols + GAP) / 2, sy = (h - cell * rows + GAP) / 2;
    for(var y = 0; y < rows; y++) for(var x = 0; x < cols; x++)
      dots.push({cx: sx + x * cell, cy: sy + y * cell, ox: 0, oy: 0, vx: 0, vy: 0});
  }
  build();
  addEventListener('resize', build);

  addEventListener('pointermove', function(e){
    mx = e.clientX; my = e.clientY;
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave', function(){ mx = -9999; my = -9999; });
  addEventListener('click', function(e){
    var cx = e.clientX, cy = e.clientY;
    for(var i = 0; i < dots.length; i++){
      var d = dots[i], dist = Math.hypot(d.cx - cx, d.cy - cy);
      if(dist < SHOCK){
        var f = 1 - dist / SHOCK;
        d.vx += (d.cx - cx) * f * 6; d.vy += (d.cy - cy) * f * 6;
      }
    }
  });

  var last = performance.now();
  (function tick(now){
    requestAnimationFrame(tick);
    var dt = Math.min(32, now - last) / 1000; last = now;
    ctx.clearRect(0, 0, w, h);
    for(var i = 0; i < dots.length; i++){
      var d = dots[i];
      /* resorte de regreso */
      d.vx += (-30 * d.ox - 8 * d.vx) * dt;
      d.vy += (-30 * d.oy - 8 * d.vy) * dt;
      d.ox += d.vx * dt; d.oy += d.vy * dt;
      /* repulsion suave cerca del cursor */
      var dx = d.cx - mx, dy = d.cy - my, dsq = dx * dx + dy * dy;
      var t = 0;
      if(dsq < PROX * PROX){
        var dist = Math.sqrt(dsq) || 1;
        t = 1 - dist / PROX;
        d.vx += (dx / dist) * t * 60 * dt * 30;
        d.vy += (dy / dist) * t * 60 * dt * 30;
      }
      var r = (BASE.r + (ACTIVE.r - BASE.r) * t) | 0;
      var g = (BASE.g + (ACTIVE.g - BASE.g) * t) | 0;
      var b = (BASE.b + (ACTIVE.b - BASE.b) * t) | 0;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.beginPath();
      ctx.arc(d.cx + d.ox, d.cy + d.oy, DOT / 2 + t * 1.5, 0, 6.2832);
      ctx.fill();
    }
  })(last);
}

/* ── 2. carrusel de shorts: drag para arrastrar (el scroll nativo ya funciona) ── */
var row = document.querySelector('.shorts-row');
if(row && HOVER){
  var abajo = false, sx0 = 0, sl0 = 0, arrastro = false;
  row.addEventListener('pointerdown', function(e){
    abajo = true; arrastro = false; sx0 = e.clientX; sl0 = row.scrollLeft;
  });
  addEventListener('pointermove', function(e){
    if(!abajo) return;
    var dx = e.clientX - sx0;
    if(Math.abs(dx) > 6){ arrastro = true; row.classList.add('dragging'); }
    if(arrastro) row.scrollLeft = sl0 - dx;
  }, {passive:true});
  addEventListener('pointerup', function(){
    abajo = false;
    setTimeout(function(){ row.classList.remove('dragging'); }, 0);
  });
  /* si hubo arrastre, cancela el click del enlace */
  row.addEventListener('click', function(e){
    if(arrastro){ e.preventDefault(); e.stopPropagation(); arrastro = false; }
  }, true);
}
})();

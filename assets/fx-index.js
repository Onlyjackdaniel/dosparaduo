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

/* ── 1. dot grid del hero ── */
var hero = document.querySelector('header#inicio');
if(hero && HOVER && !RM){
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none';
  cv.setAttribute('aria-hidden','true');
  hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext('2d');

  var DOT = 2.5, GAP = 34, PROX = 130, SHOCK = 240;
  var BASE = {r:39, g:59, b:94};      /* --line */
  var ACTIVE = {r:255, g:122, b:41};  /* --p2 naranja */
  var dots = [], w = 1, h = 1, dpr = 1;
  var mx = -9999, my = -9999;

  function build(){
    var r = hero.getBoundingClientRect();
    dpr = Math.max(1, devicePixelRatio || 1);
    w = r.width; h = r.height;
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
  new ResizeObserver(build).observe(hero);

  hero.addEventListener('pointermove', function(e){
    var r = cv.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  }, {passive:true});
  hero.addEventListener('pointerleave', function(){ mx = -9999; my = -9999; });
  hero.addEventListener('click', function(e){
    var r = cv.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
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

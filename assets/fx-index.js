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
  /* decision de Jack: la entrada aparece SIEMPRE (es parte del juego);
     solo se salta con deep link a una seccion o con reduced-motion */
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
  btn.addEventListener('mouseenter', function(){ ent.classList.add('turbo'); });
  btn.addEventListener('mouseleave', function(){ ent.classList.remove('turbo'); });
  function entrar(){
    if (ent.classList.contains('fuera')) return;
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

/* ── 1.5 ola de triangulos al pasar del hero a los videos (Scroll/43 a vanilla) ── */
var triCv = document.getElementById('tri-canvas');
if(triCv && !RM){
  var triZone = triCv.closest('.tri-zone');
  var tctx = triCv.getContext('2d');
  var TDPR = 1, TW = 0, TH = 0, TSIZE = 130, tris = [];
  function triBuild(){
    TDPR = Math.min(2, devicePixelRatio || 1);
    TW = innerWidth; TH = innerHeight;
    triCv.width = TW * TDPR; triCv.height = TH * TDPR;
    tctx.setTransform(TDPR, 0, 0, TDPR, 0, 0);
    tris = [];
    var half = TSIZE / 2;
    var cols = Math.ceil(TW / half) + 2, rows = Math.ceil(TH / TSIZE) + 1;
    for(var r = 0; r < rows; r++) for(var c = 0; c < cols; c++)
      tris.push({x: c * half, y: r * TSIZE + half, flip: (c + r) % 2 === 1,
                 nx: c / cols, rnd: Math.random(),
                 col: Math.random() < .82 ? '#ff7a29' : (Math.random() < .5 ? '#3cb8ec' : '#ffd166')});
  }
  triBuild(); addEventListener('resize', triBuild);
  function triDraw(p){
    tctx.clearRect(0, 0, TW, TH);
    /* ola que barre de izquierda a derecha; banda de ancho .3 */
    var wave = p * 1.9 - .45;
    for(var i = 0; i < tris.length; i++){
      var tr = tris[i];
      var d = Math.abs(tr.nx + tr.rnd * .18 - wave);
      var f = Math.max(0, 1 - d / .3);
      var half = TSIZE / 2;
      tctx.beginPath();
      if(!tr.flip){ tctx.moveTo(tr.x, tr.y - half); tctx.lineTo(tr.x + half, tr.y + half); tctx.lineTo(tr.x - half, tr.y + half); }
      else { tctx.moveTo(tr.x, tr.y + half); tctx.lineTo(tr.x + half, tr.y - half); tctx.lineTo(tr.x - half, tr.y - half); }
      tctx.closePath();
      if(f < .02){
        if(p > .02 && p < .98){ tctx.strokeStyle = 'rgba(240,244,255,.05)'; tctx.lineWidth = 1; tctx.stroke(); }
        continue;
      }
      tctx.save();
      tctx.translate(tr.x, tr.y); tctx.scale(f, f); tctx.translate(-tr.x, -tr.y);
      tctx.fillStyle = tr.col; tctx.fill();
      tctx.restore();
    }
  }
  var triTick = false;
  function triScroll(){
    if(triTick) return; triTick = true;
    requestAnimationFrame(function(){
      triTick = false;
      var r = triZone.getBoundingClientRect();
      var total = r.height - innerHeight;
      var pr = Math.min(1, Math.max(0, -r.top / total));
      triDraw(pr);
    });
  }
  addEventListener('scroll', triScroll, {passive:true}); triScroll();
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

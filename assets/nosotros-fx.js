/* ============================================================
   DOS PARA DUO · FX de Nosotros
   1) Inventario "make way" (Animmaster Grid/9 a vanilla):
      clic en un item del inventario -> se expande y los demas
      le abren paso; otro clic lo regresa.
   2) Fondo de particulas con pozo de gravedad (Physics/6 a
      vanilla): el cursor atrae particulas (gravedad real 1/d2),
      estelas con desvanecido y shockwave al hacer clic.
   ============================================================ */
(function(){
'use strict';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var HOVER = matchMedia('(hover: hover)').matches;

/* ── 1. inventario make-way ── */
var items = Array.prototype.slice.call(document.querySelectorAll('.inventory .item'));
if (items.length && !RM){
  var SPREAD = 70, MAXD = 480, ESCALA = 1.9;
  var abierto = -1;
  items.forEach(function(it){ it.style.transition = 'transform .7s cubic-bezier(.2,.9,.25,1)'; it.style.cursor = 'pointer'; });
  function centro(el){ return {x: el.offsetLeft + el.offsetWidth/2, y: el.offsetTop + el.offsetHeight/2}; }
  function aplicar(idx){
    items.forEach(function(otro, j){
      if (idx === -1){ otro.style.transform = ''; otro.style.zIndex = ''; return; }
      if (j === idx){ otro.style.transform = 'scale(' + ESCALA + ')'; otro.style.zIndex = 99; return; }
      var a = centro(otro), b = centro(items[idx]);
      var dist = Math.hypot(a.x - b.x, a.y - b.y);
      var sp = Math.max(SPREAD * (1 - dist / MAXD), 0);
      var ang = Math.atan2(Math.abs(b.y - a.y), Math.abs(b.x - a.x));
      var x = Math.abs(Math.cos(ang) * sp) * (a.x < b.x ? -1 : 1);
      var y = Math.abs(Math.sin(ang) * sp) * (a.y < b.y ? -1 : 1);
      otro.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      otro.style.zIndex = '';
    });
  }
  items.forEach(function(it, i){
    it.addEventListener('click', function(){
      abierto = (abierto === i) ? -1 : i;
      aplicar(abierto);
    });
  });
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && abierto !== -1){ abierto = -1; aplicar(-1); } });
}

/* ── 2. fondo: pozo de gravedad ── */
if (HOVER && !RM){
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none';
  cv.setAttribute('aria-hidden','true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  var W, H;
  function tam(){ W = cv.width = innerWidth; H = cv.height = innerHeight; }
  tam(); addEventListener('resize', tam);

  var COLORES = ['rgba(60,184,236,', 'rgba(255,122,41,', 'rgba(255,209,102,'];
  var N = Math.min(170, (innerWidth / 9) | 0);
  var parts = [];
  for (var i = 0; i < N; i++) parts.push({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    px: 0, py: 0,
    vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
    c: COLORES[i % 3], s: Math.random() * 1.4 + .4
  });
  parts.forEach(function(p){ p.px = p.x; p.py = p.y; });

  var mx = -9e3, my = -9e3;
  addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; }, {passive:true});
  addEventListener('click', function(e){
    for (var i = 0; i < parts.length; i++){
      var p = parts[i];
      var dx = p.x - e.clientX, dy = p.y - e.clientY;
      var d = Math.hypot(dx, dy) || 1;
      var f = Math.min(2200 / (d * d), 8);
      p.vx += (dx / d) * f * 14; p.vy += (dy / d) * f * 14;
    }
  });

  (function frame(){
    requestAnimationFrame(frame);
    /* desvanecido para estelas */
    ctx.fillStyle = 'rgba(10,17,31,.16)';
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++){
      var p = parts[i];
      p.px = p.x; p.py = p.y;
      var dx = mx - p.x, dy = my - p.y;
      var d2 = dx * dx + dy * dy;
      if (d2 > 400 && d2 < 260000){
        var d = Math.sqrt(d2);
        var g = 2600 / d2;
        p.vx += (dx / d) * g; p.vy += (dy / d) * g;
      }
      p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      /* si dio la vuelta por el borde, no dibujar la estela cruzada */
      if (Math.abs(p.x - p.px) < 60 && Math.abs(p.y - p.py) < 60){
        ctx.strokeStyle = p.c + '.5)';
        ctx.lineWidth = p.s;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
    }
  })();
}
})();

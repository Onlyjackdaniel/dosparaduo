/* ============================================================
   DOS PARA DUO · Titulo ASCII interactivo
   Adaptado del pack Animmaster (Hover Effects/13) a vanilla:
   la palabra se muestrea a celdas ASCII sobre canvas y el cursor
   las empuja con fisica de resorte. Uso:
   <canvas class="ascii-title" data-texto="RESEÑAS"></canvas>
   ============================================================ */
(function(){
'use strict';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var CHARS = '.:+*#%@0369';

function montar(cv){
  var TXT = cv.dataset.texto || 'DOS PARA DUO';
  var ctx = cv.getContext('2d', {alpha:true});
  var dpr = Math.max(1, devicePixelRatio || 1);
  var PASO = 10, CELDA = 8, celdas = [], cols = 0, filas = 0, W = 0, H = 0;
  var raton = {c:-999, f:-999, activo:false}, idleT = null;

  function init(){
    var r = cv.parentElement.getBoundingClientRect();
    W = r.width; H = cv.dataset.alto ? +cv.dataset.alto : Math.max(120, Math.min(190, W * .16));
    CELDA = W < 560 ? 5 : 8;
    PASO = CELDA + 2;
    cv.width = (W * dpr) | 0; cv.height = (H * dpr) | 0;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(W / PASO); filas = Math.floor(H / PASO);

    /* muestrear el texto desde un canvas oculto */
    var oc = document.createElement('canvas');
    oc.width = cols; oc.height = filas;
    var o = oc.getContext('2d');
    o.fillStyle = '#000'; o.fillRect(0, 0, cols, filas);
    o.fillStyle = '#fff';
    o.textAlign = 'center'; o.textBaseline = 'middle';
    var fs = filas * .92;
    o.font = '400 ' + fs + 'px Bungee, sans-serif';
    /* encoger hasta que quepa */
    while (o.measureText(TXT).width > cols * .96 && fs > 4){ fs -= 1; o.font = '400 ' + fs + 'px Bungee, sans-serif'; }
    o.fillText(TXT, cols / 2, filas / 2 + fs * .06);
    var data = o.getImageData(0, 0, cols, filas).data;

    celdas = [];
    for (var f = 0; f < filas; f++) for (var c = 0; c < cols; c++){
      var i = (f * cols + c) * 4;
      var br = (data[i] * .299 + data[i+1] * .587 + data[i+2] * .114) / 255;
      var on = br > .5;
      celdas.push({c:c, f:f, on:on,
        ch: on ? CHARS[Math.min(CHARS.length-1, (br * CHARS.length) | 0)] : ' ',
        ox:0, oy:0, vx:0, vy:0});
    }
  }

  function pintar(){
    ctx.clearRect(0, 0, W, H);
    ctx.font = (CELDA + 2) + 'px "Space Mono", monospace';
    ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    /* rejilla tenue */
    ctx.fillStyle = 'rgba(39,59,94,.28)';
    for (var i = 0; i < celdas.length; i++){
      var d = celdas[i];
      if (!d.on) continue;
      ctx.fillRect(d.c * PASO, d.f * PASO, 1.5, 1.5);
    }
    for (var j = 0; j < celdas.length; j++){
      var e = celdas[j];
      if (!e.on) continue;
      var t = e.c / cols; /* degradado cerúleo -> naranja por columna */
      var r = (60 + (255 - 60) * t) | 0, g = (184 + (122 - 184) * t) | 0, b = (236 + (41 - 236) * t) | 0;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillText(e.ch, (e.c + Math.round(e.ox)) * PASO + CELDA / 2, (e.f + Math.round(e.oy)) * PASO);
    }
  }

  function fisica(){
    for (var i = 0; i < celdas.length; i++){
      var d = celdas[i];
      if (!d.on) continue;
      if (raton.activo){
        var dx = d.c + d.ox - raton.c, dy = d.f + d.oy - raton.f;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5 && dist > 0){
          var fu = Math.pow(1 - dist / 5, 2) * 30;
          d.vx += (dx / dist) * fu; d.vy += (dy / dist) * fu;
        }
      }
      d.vx += -d.ox * .025; d.vy += -d.oy * .025;
      d.vx *= .5; d.vy *= .5;
      d.ox += d.vx; d.oy += d.vy;
    }
  }

  init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ init(); pintar(); });
  addEventListener('resize', function(){ init(); pintar(); });

  if (RM){ pintar(); return; }

  /* shuffle de caracteres */
  setInterval(function(){
    for (var i = 0; i < celdas.length; i++)
      if (celdas[i].on) celdas[i].ch = CHARS[(Math.random() * CHARS.length) | 0];
  }, 90);

  cv.addEventListener('pointermove', function(e){
    var r = cv.getBoundingClientRect();
    raton.c = (e.clientX - r.left) / PASO;
    raton.f = (e.clientY - r.top) / PASO;
    raton.activo = true;
    clearTimeout(idleT);
    idleT = setTimeout(function(){ raton.activo = false; }, 60);
  }, {passive:true});
  cv.addEventListener('pointerleave', function(){ raton.c = raton.f = -999; raton.activo = false; });

  (function loop(){ fisica(); pintar(); requestAnimationFrame(loop); })();
}

document.querySelectorAll('canvas.ascii-title').forEach(montar);
})();

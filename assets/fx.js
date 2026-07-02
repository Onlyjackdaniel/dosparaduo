/* ============================================================
   DOS PARA DUO · FX: interacciones compartidas (vanilla, 0 deps)
   Reveals con stagger, spotlight, tilt, contadores, barra de XP,
   logros, moneda del footer y codigo Konami. Respeta
   prefers-reduced-motion y solo activa hover-FX donde hay hover.
   ============================================================ */
(function(){
'use strict';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var HOVER = matchMedia('(hover: hover)').matches;

/* ── reveals al hacer scroll, con stagger automatico entre hermanos ── */
var revealSel = '[data-reveal], .reveal';
var seen = new WeakMap();
if(!RM && 'IntersectionObserver' in window){
  document.documentElement.classList.add('fx');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target, parent = el.parentElement, idx = 0;
      if(parent){
        var n = (seen.get(parent) || 0); idx = n; seen.set(parent, n + 1);
        setTimeout(function(){ seen.set(parent, Math.max(0,(seen.get(parent)||1)-1)); }, 700);
      }
      el.style.setProperty('--rd', Math.min(idx * 70, 350) + 'ms');
      el.classList.add('in');
      el.querySelectorAll('.fill').forEach(function(f){ f.style.width = f.dataset.w; });
      countUp(el);
      scrambleIn(el);
      io.unobserve(el);
    });
  }, {threshold:.15});
  document.querySelectorAll(revealSel).forEach(function(el){ io.observe(el); });
}else{
  document.querySelectorAll(revealSel).forEach(function(el){
    el.classList.add('in');
    el.querySelectorAll('.fill').forEach(function(f){ f.style.width = f.dataset.w; });
    countUp(el);
  });
}

/* ── contadores animados: <span data-count="146">0</span> ── */
function countUp(scope){
  (scope.matches && scope.matches('[data-count]') ? [scope] : []).concat(
    Array.prototype.slice.call(scope.querySelectorAll ? scope.querySelectorAll('[data-count]') : [])
  ).forEach(function(el){
    if(el._fxDone) return; el._fxDone = true;
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
    if(RM){ el.textContent = end.toLocaleString('es-MX') + suf; return; }
    var t0 = null, dur = 1100;
    requestAnimationFrame(function step(t){
      if(!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('es-MX') + suf;
      if(p < 1) requestAnimationFrame(step);
    });
  });
}

/* ── texto scramble estilo terminal: [data-scramble] se decodifica al aparecer ──
   Adaptado del concepto del pack Animmaster (Text Animations) sin plugins. */
var GLYPHS = '!<>-_/[]{}=+*^?#01';
function scrambleOne(el){
  if(el._fxScrambled) return; el._fxScrambled = true;
  var texto = el.textContent;
  if(RM || !texto.trim()){ return; }
  var frame = 0, total = Math.max(18, texto.length * 2);
  (function paso(){
    var out = '', progreso = frame / total;
    for(var i = 0; i < texto.length; i++){
      var limite = progreso * texto.length * 1.4;
      if(i < limite || texto[i] === ' ') out += texto[i];
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    frame++;
    if(frame <= total) requestAnimationFrame(paso);
    else el.textContent = texto;
  })();
}
function scrambleIn(scope){
  if(scope.matches && scope.matches('[data-scramble]')) scrambleOne(scope);
  if(scope.querySelectorAll) scope.querySelectorAll('[data-scramble]').forEach(scrambleOne);
}
/* los data-scramble visibles de inmediato (hero) arrancan solos */
document.querySelectorAll('[data-scramble]').forEach(function(el){
  if(!el.closest('[data-reveal], .reveal')) scrambleOne(el);
});

/* ── spotlight + tilt: delegacion global de pointermove ── */
if(HOVER && !RM){
  document.addEventListener('pointermove', function(ev){
    var card = ev.target.closest && ev.target.closest('.fx-spot, .fx-tilt');
    if(!card) return;
    var r = card.getBoundingClientRect();
    var x = ev.clientX - r.left, y = ev.clientY - r.top;
    if(card.classList.contains('fx-spot')){
      card.style.setProperty('--mx', (x / r.width * 100) + '%');
      card.style.setProperty('--my', (y / r.height * 100) + '%');
    }
    if(card.classList.contains('fx-tilt')){
      card.style.setProperty('--ry', ((x / r.width) - .5) * 7 + 'deg');
      card.style.setProperty('--rx', (.5 - (y / r.height)) * 7 + 'deg');
      card.style.setProperty('--ty', '-4px');
    }
  }, {passive:true});
  document.addEventListener('pointerout', function(ev){
    var card = ev.target.closest && ev.target.closest('.fx-tilt');
    if(!card || card.contains(ev.relatedTarget)) return;
    card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
    card.style.setProperty('--ty','0px');
  }, {passive:true});
}

/* ── barra de XP + nivel por scroll ── */
var xp = document.createElement('div'); xp.className = 'fx-xp'; xp.setAttribute('aria-hidden','true');
xp.innerHTML = '<div class="fx-xp-fill"></div>';
var lvl = document.createElement('div'); lvl.className = 'fx-lvl'; lvl.setAttribute('aria-hidden','true');
document.body.appendChild(xp); document.body.appendChild(lvl);
var fill = xp.firstChild, lastLvl = -1, ticking = false;
function onScroll(){
  if(ticking) return; ticking = true;
  requestAnimationFrame(function(){
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    fill.style.width = (p * 100).toFixed(1) + '%';
    var l = Math.min(Math.floor(p * 4) + 1, 4);
    if(l !== lastLvl){
      lastLvl = l;
      lvl.textContent = 'LVL ' + l + ' / 4';
      lvl.classList.add('on');
      clearTimeout(lvl._t); lvl._t = setTimeout(function(){ lvl.classList.remove('on'); }, 1600);
    }
  });
}
addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* ── logros (toast) ── */
var toastEl = null, toastT = null;
window.fxToast = function(titulo, msg, icono){
  if(!toastEl){
    toastEl = document.createElement('div');
    toastEl.className = 'fx-toast'; toastEl.setAttribute('role','status'); toastEl.setAttribute('aria-live','polite');
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = '<svg class="ico" aria-hidden="true"><use href="' + FX_BASE + 'assets/icons.svg#' + (icono || 'trophy') + '"/></svg>' +
    '<div><b>' + titulo + '</b><span>' + msg + '</span></div>';
  requestAnimationFrame(function(){ toastEl.classList.add('on'); });
  clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('on'); }, 3800);
};
/* base relativa: las paginas de /resenas/ y /listas/ marcan data-fx-base="../" en el <script> */
var FX_BASE = (document.currentScript && document.currentScript.dataset.fxBase) || '';

/* ── confetti pixel ── */
window.fxConfetti = function(){
  if(RM) return;
  var cv = document.createElement('canvas'); cv.className = 'fx-confetti';
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  var colors = ['#3cb8ec','#ff7a29','#ffd166','#f0f4ff'];
  var parts = [];
  for(var i = 0; i < 120; i++) parts.push({
    x: cv.width / 2, y: cv.height * .6,
    vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4,
    s: Math.random() * 6 + 3, c: colors[i % 4], r: 0, vr: (Math.random() - .5) * .3
  });
  var t0 = performance.now();
  (function frame(t){
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(function(p){
      p.x += p.vx; p.y += p.vy; p.vy += .45; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore();
    });
    if(t - t0 < 2400) requestAnimationFrame(frame); else cv.remove();
  })(t0);
};

/* ── moneda del footer: INSERT COIN ── */
var slot = document.getElementById('coin-slot');
if(slot){
  var coins = 0;
  slot.addEventListener('click', function(){
    coins++;
    var c = slot.querySelector('[data-coins]'); if(c) c.textContent = coins;
    slot.classList.remove('coin-pop'); void slot.offsetWidth; slot.classList.add('coin-pop');
    if(coins === 1) fxToast('CREDITO ACEPTADO', 'Gracias por la moneda. El duo sigue jugando.', 'coin');
    if(coins === 10){ fxToast('LOGRO DESBLOQUEADO', 'HIGH ROLLER: 10 monedas en la maquina.', 'coins'); window.fxConfetti(); }
  });
}

/* ── codigo Konami: arriba arriba abajo abajo izq der izq der B A ── */
var K = [38,38,40,40,37,39,37,39,66,65], ki = 0;
addEventListener('keydown', function(e){
  ki = (e.keyCode === K[ki]) ? ki + 1 : (e.keyCode === K[0] ? 1 : 0);
  if(ki === K.length){
    ki = 0;
    if(!RM){ document.body.classList.remove('fx-crt'); void document.body.offsetWidth; document.body.classList.add('fx-crt'); }
    window.fxConfetti();
    fxToast('LOGRO DESBLOQUEADO', 'CODIGO KONAMI: 30 vidas para el duo.', 'game-controller');
  }
});
})();

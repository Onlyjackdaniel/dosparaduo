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

/* ── moneda del footer: INSERT COIN (con niveles, engancha a los logros) ── */
var slot = document.getElementById('coin-slot');
if(slot){
  var coins = 0;
  slot.addEventListener('click', function(){
    coins++;
    var c = slot.querySelector('[data-coins]'); if(c) c.textContent = coins;
    slot.classList.remove('coin-pop'); void slot.offsetWidth; slot.classList.add('coin-pop');
    if(coins === 1) unlock('coin1');
    else if(coins === 10) unlock('coin10');
    else if(coins === 100) unlock('coin100');
  });
}

/* ── cortina de transicion al navegar (PT/9-10 adaptado a multipagina):
   al hacer clic en un link interno sube una cortina con el logo kinetic
   y despues navega. Sin cortina de llegada (el contenido entra con sus
   propios reveals), asi no hay parpadeos. ── */
if(!RM){
  var cort = document.createElement('div');
  cort.className = 'fx-cortina'; cort.setAttribute('aria-hidden','true');
  cort.innerHTML = '<b>Dos <em>para</em> <i>Duo</i></b>';
  document.body.appendChild(cort);
  document.addEventListener('click', function(ev){
    if(ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest && ev.target.closest('a[href]');
    if(!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if(!href || href.charAt(0) === '#' || /^[a-z]+:/i.test(href) && a.origin !== location.origin) return;
    /* anclas dentro de la misma pagina: sin cortina */
    if(a.pathname === location.pathname && a.hash) return;
    ev.preventDefault();
    cort.classList.add('in');
    setTimeout(function(){ location.href = a.href; }, 400);
  });
  /* al volver con el boton atras (bfcache) la cortina no debe quedarse pegada */
  addEventListener('pageshow', function(e){ if(e.persisted) cort.classList.remove('in'); });
}

/* ── codigo Konami: revela la SALA DE ARCADE oculta ── */
var K = [38,38,40,40,37,39,37,39,66,65], ki = 0;
addEventListener('keydown', function(e){
  ki = (e.keyCode === K[ki]) ? ki + 1 : (e.keyCode === K[0] ? 1 : 0);
  if(ki === K.length){ ki = 0; revelarSala(); }
});

/* ============================================================
   SISTEMA DE LOGROS + SALA DE ARCADE (la desbloquea el Konami)
   Progreso persistente en localStorage. La sala se inyecta arriba
   del <footer> y queda oculta hasta que se ingresa el codigo.
   ============================================================ */
var LS = {
  get:function(k,d){ try{ var v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set:function(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

var ACH = [
  {id:'konami',      ico:'game-controller', nom:'SALA SECRETA',             txt:'Hallaste la sala oculta con el codigo sagrado.',   pista:'Un codigo clasico de 30 vidas…',            cel:true},
  {id:'coin1',       ico:'coin',            nom:'CREDITO ACEPTADO',         txt:'Insertaste tu primera moneda.',                     pista:'Hay una ranura de monedas en el inicio.'},
  {id:'coin10',      ico:'coins',           nom:'HIGH ROLLER',              txt:'10 monedas en la maquina.',                         pista:'Sigue metiendo monedas…',                    cel:true},
  {id:'coin100',     ico:'coins',           nom:'BALLENA DORADA',           txt:'100 monedas. ¿Todo bien en casa?',                  pista:'Solo para valientes (o aburridos).',         cel:true},
  {id:'noctambulo',  ico:'joystick',        nom:'TURNO NOCTURNO',           txt:'Nos visitaste de madrugada. GG.',                   pista:'Se juega mejor de madrugada.'},
  {id:'biblioteca',  ico:'scroll',          nom:'RATA DE BIBLIOTECA',       txt:'Leiste TODAS las resenas. Respeto absoluto.',       pista:'Leete TODAS las resenas hasta el final.',    cel:true},
  {id:'gameover',    ico:'crosshair',       nom:'TE PERDISTE, PERO GANASTE',txt:'Sobreviviste a la pantalla de Game Over.',          pista:'Pierdete en una pagina que no existe.'},
  {id:'cazatesoros', ico:'trophy',          nom:'CAZATESOROS',              txt:'Encontraste las monedas escondidas por el sitio.',  pista:'Hay monedas escondidas en varias paginas.',  cel:true}
];

var got = LS.get('dpd-logros', {});
function tiene(id){ return !!got[id]; }
function unlock(id){
  if(got[id]) return;
  var a = null, i;
  for(i = 0; i < ACH.length; i++) if(ACH[i].id === id){ a = ACH[i]; break; }
  if(!a) return;
  got[id] = 1; LS.set('dpd-logros', got);
  if(window.fxToast) window.fxToast('LOGRO DESBLOQUEADO', a.nom + ' · ' + a.txt, a.ico);
  if(a.cel && window.fxConfetti) window.fxConfetti();
  pintarSala();
}
window.dpdUnlock = unlock;

/* ── monedas escondidas por el sitio (una por pagina clave) ── */
var COINS = [
  {id:'m1', pos:'top:38%;left:8px',  match:function(){ return !!document.querySelector('header#inicio'); }},
  {id:'m2', pos:'top:52%;right:8px', match:function(){ return /nosotros\.html$/.test(location.pathname); }},
  {id:'m3', pos:'top:30%;right:8px', match:function(){ return /resenas\/(index\.html)?$/.test(location.pathname); }},
  {id:'m4', pos:'top:60%;left:8px',  match:function(){ return /apoyo\.html$/.test(location.pathname); }},
  {id:'m5', pos:'top:44%;right:8px', match:function(){ return /resenas\/it-takes-two\.html$/.test(location.pathname); }}
];
var COINS_TOTAL = COINS.length;

/* ── la Sala: se inyecta arriba del footer, oculta hasta el Konami ── */
var sala = null;
function construirSala(){
  var footer = document.querySelector('footer');
  if(!footer || document.getElementById('dpd-sala')) return;
  sala = document.createElement('section');
  sala.id = 'dpd-sala'; sala.className = 'sala';
  if(!LS.get('dpd-sala-found', false)) sala.classList.add('oculta');
  footer.parentNode.insertBefore(sala, footer);
  pintarSala();
}
function pintarSala(){
  if(!sala) return;
  var i, n = 0;
  for(i = 0; i < ACH.length; i++) if(got[ACH[i].id]) n++;
  var mon = LS.get('dpd-monedas', []);
  var rr = window._dpdResenas;
  var extra = ' · ' + mon.length + ' / ' + COINS_TOTAL + ' monedas';
  if(rr) extra += ' · ' + rr.leidas + ' / ' + rr.total + ' resenas';
  var cards = '';
  for(i = 0; i < ACH.length; i++){
    var a = ACH[i], on = !!got[a.id];
    cards += '<li class="logro ' + (on ? 'on' : 'off') + '">' +
      '<svg class="ico" aria-hidden="true"><use href="' + FX_BASE + 'assets/icons.svg#' + (on ? a.ico : 'star') + '"/></svg>' +
      '<div><b>' + (on ? a.nom : 'BLOQUEADO') + '</b><span>' + (on ? a.txt : a.pista) + '</span></div></li>';
  }
  sala.innerHTML =
    '<div class="sala-in">' +
      '<div class="sala-head">' +
        '<h2><svg class="ico" aria-hidden="true"><use href="' + FX_BASE + 'assets/icons.svg#trophy"/></svg> Sala de Arcade</h2>' +
        '<p class="sala-sub">Zona secreta · tu progreso se guarda en este navegador</p>' +
        '<div class="sala-bar"><span style="width:' + Math.round(n / ACH.length * 100) + '%"></span></div>' +
        '<p class="sala-count">' + n + ' / ' + ACH.length + ' logros' + extra + '</p>' +
      '</div>' +
      '<ul class="sala-grid">' + cards + '</ul>' +
      '<div class="sala-cta">' +
        '<button type="button" class="sala-card-btn" id="dpd-card-btn">▸ Generar mi tarjeta de jugador</button>' +
        (n === ACH.length ? '<p class="sala-100">★ ¡100%! Eres leyenda del duo. Comparte tu tarjeta y etiquetanos.</p>' : '') +
      '</div>' +
    '</div>';
  var b = document.getElementById('dpd-card-btn');
  if(b) b.addEventListener('click', abrirTarjeta);
}
function revelarSala(){
  var primera = !tiene('konami');
  LS.set('dpd-sala-found', true);
  if(sala) sala.classList.remove('oculta');
  if(!RM){ document.body.classList.remove('fx-crt'); void document.body.offsetWidth; document.body.classList.add('fx-crt'); }
  unlock('konami');
  if(sala) setTimeout(function(){ sala.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'center'}); }, primera ? 550 : 120);
}

/* ── tarjeta de jugador (canvas descargable / compartible) ── */
function rango(n){
  return n >= 8 ? '100% · PLATINO' : n >= 6 ? 'TRUE GAMER' : n >= 4 ? 'SPEEDRUNNER' : n >= 2 ? 'CO-OP PRO' : n >= 1 ? 'PARTY MEMBER' : 'NOOB';
}
function abrirTarjeta(){
  var i, n = 0, badges = [];
  for(i = 0; i < ACH.length; i++) if(got[ACH[i].id]){ n++; badges.push(ACH[i].nom); }
  var wrap = document.createElement('div'); wrap.className = 'gcard-wrap';
  wrap.innerHTML =
    '<div class="gcard-box">' +
      '<canvas class="gcard-cv" width="720" height="405"></canvas>' +
      '<div class="gcard-btns">' +
        '<a class="gcard-dl" download="tarjeta-dos-para-duo.png">▸ Descargar PNG</a>' +
        '<button type="button" class="gcard-share" hidden>Compartir</button>' +
        '<button type="button" class="gcard-x">Cerrar</button>' +
      '</div></div>';
  document.body.appendChild(wrap);
  var cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d');
  function draw(){
    var g = ctx.createLinearGradient(0, 0, 720, 405);
    g.addColorStop(0, '#0f1929'); g.addColorStop(1, '#142440');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 405);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.strokeRect(12, 12, 696, 381);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd166'; ctx.font = '700 19px "Space Mono", monospace';
    ctx.fillText('TARJETA DE JUGADOR', 34, 32);
    ctx.fillStyle = '#f0f4ff'; ctx.font = '44px Bungee, sans-serif';
    ctx.fillText('DOS PARA DUO', 32, 58);
    ctx.fillStyle = '#3cb8ec'; ctx.font = '700 24px "Space Mono", monospace';
    ctx.fillText('RANGO: ' + rango(n), 34, 132);
    ctx.fillStyle = '#ff7a29'; ctx.font = '64px Bungee, sans-serif';
    ctx.fillText(n + ' / ' + ACH.length, 34, 168);
    ctx.fillStyle = '#8da0bf'; ctx.font = '400 14px "Space Mono", monospace';
    ctx.fillText('LOGROS DESBLOQUEADOS', 250, 205);
    ctx.font = '400 16px "Outfit", sans-serif';
    var y = 258;
    if(!badges.length){ ctx.fillStyle = '#8da0bf'; ctx.fillText('Aun sin logros… ¡a explorar!', 34, y); }
    badges.slice(0, 6).forEach(function(bn){
      ctx.fillStyle = '#ffd166'; ctx.fillText('★', 34, y);
      ctx.fillStyle = '#f0f4ff'; ctx.fillText(bn, 58, y); y += 23;
    });
    ctx.fillStyle = '#8da0bf'; ctx.font = '400 13px "Space Mono", monospace';
    ctx.fillText('onlyjackdaniel.github.io/dosparaduo', 34, 372);
    var a = wrap.querySelector('.gcard-dl'); try{ a.href = cv.toDataURL('image/png'); }catch(e){}
  }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
  var sh = wrap.querySelector('.gcard-share');
  if(navigator.share && navigator.canShare){
    sh.hidden = false;
    sh.addEventListener('click', function(){
      cv.toBlob(function(blob){
        if(!blob) return;
        var file = new File([blob], 'tarjeta-dos-para-duo.png', {type:'image/png'});
        try{ if(navigator.canShare({files:[file]})) navigator.share({files:[file], title:'Dos para Duo', text:'Mi tarjeta de jugador en Dos para Duo'}); }catch(e){}
      });
    });
  }
  wrap.querySelector('.gcard-x').addEventListener('click', function(){ wrap.remove(); });
  wrap.addEventListener('click', function(e){ if(e.target === wrap) wrap.remove(); });
}

/* ── logro nocturno ── */
function checkNoctambulo(){ var h = new Date().getHours(); if(h >= 0 && h < 5) unlock('noctambulo'); }

/* ── monedas escondidas ── */
function initMonedas(){
  var mon = LS.get('dpd-monedas', []);
  COINS.forEach(function(m){
    if(mon.indexOf(m.id) !== -1) return;
    if(!m.match()) return;
    var el = document.createElement('button');
    el.type = 'button'; el.className = 'dpd-coin'; el.setAttribute('aria-label', 'Moneda escondida');
    el.style.cssText = 'position:fixed;' + m.pos;
    el.innerHTML = '<svg class="ico" aria-hidden="true"><use href="' + FX_BASE + 'assets/icons.svg#coin"/></svg>';
    el.addEventListener('click', function(){
      var cur = LS.get('dpd-monedas', []);
      if(cur.indexOf(m.id) === -1){ cur.push(m.id); LS.set('dpd-monedas', cur); }
      el.classList.add('got'); setTimeout(function(){ el.remove(); }, 340);
      if(window.fxToast) window.fxToast('MONEDA ENCONTRADA', cur.length + ' / ' + COINS_TOTAL + ' monedas escondidas.', 'coin');
      if(cur.length >= COINS_TOTAL) unlock('cazatesoros');
      pintarSala();
    });
    document.body.appendChild(el);
  });
}

/* ── logro de completista: leer TODAS las resenas ── */
function initBiblioteca(){
  var m = location.pathname.match(/\/resenas\/([a-z0-9-]+)\.html$/);
  function checkTotal(){
    fetch(FX_BASE + 'assets/resenas.json').then(function(r){ return r.json(); }).then(function(list){
      var total = list.length, cur = LS.get('dpd-leidas', []);
      var validas = cur.filter(function(s){ return list.indexOf(s) !== -1; });
      window._dpdResenas = {leidas: validas.length, total: total};
      if(total > 0 && validas.length >= total) unlock('biblioteca');
      pintarSala();
    }).catch(function(){});
  }
  if(m){
    var slug = m[1], marcada = false;
    var registrar = function(){
      if(marcada) return; marcada = true;
      removeEventListener('scroll', alScroll);
      var cur = LS.get('dpd-leidas', []);
      if(cur.indexOf(slug) === -1){ cur.push(slug); LS.set('dpd-leidas', cur); }
      checkTotal();
    };
    var alScroll = function(){
      var doc = document.documentElement, max = doc.scrollHeight - doc.clientHeight;
      /* cuenta si la resena cabe en pantalla o si llegaste cerca del final */
      if(max <= 60 || (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 140)) registrar();
    };
    addEventListener('scroll', alScroll, {passive:true}); alScroll();
    setTimeout(function(){ registrar(); }, 15000);   /* o quedarte a leerla tambien cuenta */
  }
  if(m || LS.get('dpd-sala-found', false)) checkTotal();
}

/* ── arranque del sistema de logros ── */
construirSala();
checkNoctambulo();
initMonedas();
initBiblioteca();
})();

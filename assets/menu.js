// Menú hamburguesa móvil — compartido por todas las páginas
document.addEventListener('DOMContentLoaded', function () {
  var b = document.querySelector('.burger');
  var n = document.querySelector('.nav-links');
  if (!b || !n) return;
  b.addEventListener('click', function () {
    var abierto = n.classList.toggle('open');
    b.textContent = abierto ? '✕' : '☰';
    b.setAttribute('aria-expanded', abierto);
  });
  n.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      n.classList.remove('open');
      b.textContent = '☰';
      b.setAttribute('aria-expanded', 'false');
    });
  });
});

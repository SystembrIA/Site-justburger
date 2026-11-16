// Aviso de cookies + Pixel da Meta (pedido do marketing, Maikon 16/11).
// LGPD: o Pixel só carrega depois que a pessoa toca em "Aceitar". A escolha fica guardada neste aparelho.
// Eventos para os anúncios: PageView; Lead ao tocar em iFood, Keeta ou WhatsApp; Contact e SubmitApplication nos formulários.
(function () {
  var s = document.currentScript, ID = s && s.getAttribute('data-pixel'), PRIV = s && s.getAttribute('data-privacidade');
  if (!ID) return;
  var CHAVE = 'jb_cookies';
  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }
  function carrega() {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, x) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; x = b.getElementsByTagName(e)[0]; x.parentNode.insertBefore(t, x); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', ID);
    window.fbq('track', 'PageView');
  }
  function evento(nome, dados) { if (window.fbq) window.fbq('track', nome, dados || {}); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.href;
    if (/ifood\.com\.br/.test(h)) evento('Lead', { content_name: 'iFood' });
    else if (/mykeeta/.test(h)) evento('Lead', { content_name: 'Keeta' });
    else if (/wa\.me|whatsapp/.test(h)) evento('Contact', { content_name: 'WhatsApp' });
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.checkValidity || !f.checkValidity()) return;
    if (f.id === 'form-contato') evento('Contact', { content_name: 'Fale com a gente' });
    if (f.id === 'form-curriculo') evento('SubmitApplication');
  }, true);
  var escolha = ler();
  if (escolha === 'sim') return carrega();
  if (escolha === 'nao') return;
  var barra = document.createElement('div');
  barra.className = 'aviso-cookies'; barra.setAttribute('role', 'dialog'); barra.setAttribute('aria-label', 'Aviso de cookies');
  barra.innerHTML = '<p>Usamos cookies para medir as visitas e mostrar ofertas da Just nas redes sociais.' + (PRIV ? ' <a href="' + PRIV + '">Saiba mais</a>' : '') + '</p><div><button type="button" data-c="nao">Recusar</button><button type="button" data-c="sim">Aceitar</button></div>';
  barra.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    gravar(b.getAttribute('data-c')); barra.remove(); if (b.getAttribute('data-c') === 'sim') carrega();
  });
  document.body.appendChild(barra);
})();

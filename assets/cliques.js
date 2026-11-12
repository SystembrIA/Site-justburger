// Cliques do site (ST-2, Maikon 12/11): cada toque num link do iFood ou da Keeta soma 1 no contador
// daquela loja e daquele aplicativo (Dashboard → Cliques do site). Sem cookie, sem guardar nada no aparelho
// e sem dado de quem tocou: só manda { loja, app, pag } para a função cliqueSite do Hub.
// O build põe antes deste arquivo window.JUST_CLIQUES = { url: '<função>', links: { '<link sem ?>': '<loja>' } }.
(function () {
  var D = window.JUST_CLIQUES; if (!D || !D.url) return;
  // Só link de pedido: loja no iFood (/delivery/…) ou link da Keeta. Matéria do blog do iFood não conta.
  function app(u) {
    if (/^(www\.)?ifood\.com\.br$/i.test(u.hostname) && /^\/delivery\//i.test(u.pathname)) return 'ifood';
    return /(^|\.)mykeeta\.com$/i.test(u.hostname) ? 'keeta' : '';
  }
  // Tipo da página (de onde veio o toque). Funciona no domínio e na prévia (/site-justburger/…).
  function pag() {
    var p = location.pathname.replace(/^\/site-justburger/i, '').replace(/index\.html$/, '');
    if (p === '/' || p === '') return 'home';
    var m = /^\/([^/]+)\//.exec(p), s = m ? m[1] : '';
    return ({ unidades: 'unidade', cardapio: 'cardapio', entrega: 'bairro', links: 'links', pedir: 'pedir', culinarias: 'culinaria', 'para-voce': 'perfil' })[s] || 'outra';
  }
  function manda(dados) {
    var corpo = JSON.stringify(dados);
    try {
      // Texto puro: o navegador não faz pré-checagem e o envio continua mesmo com a página indo para o iFood.
      if (navigator.sendBeacon && navigator.sendBeacon(D.url, new Blob([corpo], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(D.url, { method: 'POST', body: corpo, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }
  var ultimo = 0;
  function toque(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    var qual = app(u); if (!qual) return;
    var agora = Date.now(); if (agora - ultimo < 800) return; // toque duplo conta uma vez
    ultimo = agora;
    manda({ loja: D.links[u.origin + u.pathname] || 'outra', app: qual, pag: pag() });
  }
  document.addEventListener('click', toque, true);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) toque(e); }, true);
})();

// Página de links: CEP → para cada marca, a unidade mais perto dentro do raio, com iFood e Keeta.
// Endereço do CEP: ViaCEP. Coordenada da rua: OpenStreetMap (Nominatim). Sem coordenada, mostra todas as unidades.
(function () {
  var D = window.JUST_LINKS; if (!D) return;
  var form = document.getElementById('lk-form'), campo = document.getElementById('lk-cep'), res = document.getElementById('lk-res');
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function km(a, b, c, d) { var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2); return 12742 * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y)); }
  function pega(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function botoes(u) {
    // Keeta clicável quando a loja tem link (Maikon 03/11); sem link, só o ícone.
    return (u.ifood ? '<a class="lk-plat" href="' + esc(u.ifood) + '" rel="noopener" aria-label="Pedir no iFood"><img src="../assets/img/plataformas/ifood-icone.svg" alt="iFood"></a>' : '') +
      (u.keeta ? '<a class="lk-plat lk-plat-keeta" href="' + esc(u.keeta) + '" rel="noopener" aria-label="Pedir na Keeta"><img src="../assets/img/plataformas/keeta.webp" alt="Keeta"></a>'
        : '<span class="lk-plat lk-plat-off lk-plat-keeta" title="Keeta em breve" aria-label="Keeta em breve"><img src="../assets/img/plataformas/keeta.webp" alt="Keeta"></span>');
  }

  function cartao(m, u, dist) {
    return '<div class="lk-marca">' + (m.logo ? '<img src="../' + esc(m.logo) + '" alt="">' : '<span></span>') +
      '<span><strong>' + esc(m.nome) + '</strong></span>' +
      '<div class="lk-plats">' + botoes(u) + '</div></div>';
  }
  function mostra(c, onde) {
    var html = '';
    D.marcas.forEach(function (m) {
      var perto = m.unidades.filter(function (u) { return u.lat != null; })
        .map(function (u) { return { u: u, d: km(c.lat, c.lng, u.lat, u.lng) }; })
        .sort(function (a, b) { return a.d - b.d; })[0];
      if (perto && perto.d <= D.raio) html += cartao(m, perto.u, perto.d);
    });
    res.innerHTML = html
      ? '<p class="lk-msg">Entregam em ' + esc(onde) + ':</p>' + html + '<p class="lk-msg">A área final de entrega é a do app: confirme seu endereço por lá.</p>'
      : '<p class="lk-msg">' + esc(onde) + ' fica fora do nosso raio de entrega de ' + D.raio + ' km. Fale com a gente pelo WhatsApp.</p>';
  }
  function todas() {
    res.innerHTML = '<p class="lk-msg">Não achei a rua desse CEP. Escolha a loja mais perto:</p>' + D.marcas.map(function (m) {
      return m.unidades.map(function (u) { return cartao(m, u, null); }).join('');
    }).join('');
  }
  // Clicou em outra coisa da página (culinárias, site, cardápio...): fecha a lista do CEP.
  document.addEventListener('click', function (e) {
    if (!res.innerHTML || e.target.closest('#pedido')) return;
    if (e.target.closest('.lk-todas > summary, .lk-bt, .lk-insta > summary, a')) res.innerHTML = '';
  });
  campo.addEventListener('input', function () { var v = campo.value.replace(/\D/g, '').slice(0, 8); campo.value = v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var cep = campo.value.replace(/\D/g, '');
    if (cep.length !== 8) { res.innerHTML = '<p class="lk-msg">Digite os 8 números do CEP.</p>'; return; }
    res.innerHTML = '<p class="lk-msg">Procurando as lojas mais perto…</p>';
    try { localStorage.setItem('just-cep', cep); } catch (e) {}
    pega('https://viacep.com.br/ws/' + cep + '/json/').then(function (e) {
      if (e.erro) { res.innerHTML = '<p class="lk-msg">CEP não encontrado. Confira os números.</p>'; return; }
      var onde = [e.bairro, e.localidade].filter(Boolean).join(', ');
      if (!e.logradouro) { todas(); return; }
      return pega('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&street=' +
        encodeURIComponent(e.logradouro.replace(/\s*-\s*(de|até|lado).*$/i, '')) + '&city=' + encodeURIComponent(e.localidade) + '&state=' + encodeURIComponent(e.uf))
        .then(function (r) { if (!r.length) throw new Error('rua'); mostra({ lat: +r[0].lat, lng: +r[0].lon }, onde); })
        .catch(todas);
    }).catch(todas);
  });
  try { var antes = localStorage.getItem('just-cep'); if (antes && !campo.value) campo.value = antes.slice(0, 5) + '-' + antes.slice(5); } catch (e) {}
})();

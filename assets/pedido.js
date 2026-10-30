// "Faça seu pedido": a pessoa digita o CEP e o site mostra a loja Just Burger mais perto, com o link
// dela no iFood. Endereço do CEP: ViaCEP. Coordenada da rua: OpenStreetMap (Nominatim). Sem ela, cai no
// nome do bairro (bairros.json: só bairros dentro do raio de entrega, cada um com a loja mais perto).
// Lojas, bairros, raio e WhatsApp vêm do build em window.JUST_PEDIDO.
(function () {
  var D = window.JUST_PEDIDO; if (!D) return;
  var GUARDA = 'just-cep';

  function norm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function km(a, b, c, d) {
    var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2);
    return 12742 * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y));
  }
  function pega(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function guarda(cep) { try { localStorage.setItem(GUARDA, cep); } catch (e) {} }
  function lembra() { try { return localStorage.getItem(GUARDA) || ''; } catch (e) { return ''; } }

  // Coordenada da rua do CEP. (A BrasilAPI devolve, para muitos CEPs, o centro da cidade: não serve.)
  function coordenadas(e) {
    if (!e.logradouro) return Promise.reject(new Error('CEP sem rua'));
    return pega('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&street=' +
      encodeURIComponent(e.logradouro.replace(/\s*-\s*(de|até|lado).*$/i, '')) + '&city=' + encodeURIComponent(e.localidade) + '&state=' + encodeURIComponent(e.uf))
      .then(function (r) { if (!r.length) throw new Error('rua não achada'); return { lat: +r[0].lat, lng: +r[0].lon }; });
  }

  function lojaPeloBairro(e) {
    var i = D.bairros[norm(e.bairro) + '|' + norm(e.localidade)];
    if (i == null) i = D.bairros[norm(e.bairro)];
    return i == null ? null : D.lojas[i];
  }

  function botaoLoja(l) { return '<a class="botao" href="' + esc(l.ifood) + '" rel="noopener">Pedir na ' + esc(l.nome) + '</a>'; }
  var whats = D.whatsapp ? '<a class="link" href="' + esc(D.whatsapp) + '" rel="noopener">Falar no WhatsApp</a>' : '';
  var aviso = '<p class="busca-cep-nota">A área de entrega final é a do iFood: confirme seu endereço por lá.</p>';

  function mostra(caixa, r) {
    var onde = [r.e.bairro, r.e.localidade].filter(Boolean).join(', ');
    if (r.loja && (r.km == null || r.km <= D.raio)) {
      caixa.innerHTML = '<div class="busca-cep-loja"><p class="sobretitulo">Sua loja</p><h3>' + esc(r.loja.nome) + '</h3>' +
        '<p>' + esc(r.loja.endereco) + ' · ' + esc(r.loja.bairro) + ', ' + esc(r.loja.cidade) + '</p>' +
        (r.km != null ? '<p class="suave">Cerca de ' + String(Math.max(0.5, Math.round(r.km * 10) / 10)).replace('.', ',') + ' km de ' + esc(onde) + '</p>' : '<p class="suave">Loja que atende ' + esc(onde) + '</p>') +
        '<p class="busca-cep-acoes">' + botaoLoja(r.loja) + '</p>' + aviso + '</div>';
    } else if (r.loja) {
      caixa.innerHTML = '<div class="busca-cep-loja"><p>' + esc(onde) + ' fica a cerca de ' + Math.round(r.km) + ' km da loja mais perto (' + esc(r.loja.nome) +
        '), fora do nosso raio de entrega de ' + D.raio + ' km.</p>' + (whats ? '<p class="busca-cep-acoes">' + whats + '</p>' : '') + '</div>';
    } else {
      caixa.innerHTML = '<div class="busca-cep-loja"><p>Não consegui achar a loja para ' + esc(onde || 'esse CEP') + '. Escolha a mais perto:</p>' +
        '<p class="busca-cep-acoes">' + D.lojas.map(botaoLoja).join('') + '</p>' + whats + '</div>';
    }
  }

  function busca(form) {
    var campo = form.querySelector('input'), caixa = form.querySelector('.busca-cep-resultado');
    var cep = campo.value.replace(/\D/g, '');
    if (cep.length !== 8) { caixa.innerHTML = '<p>Digite os 8 números do CEP.</p>'; campo.focus(); return; }
    caixa.innerHTML = '<p class="suave">Procurando a loja mais perto…</p>';
    pega('https://viacep.com.br/ws/' + cep + '/json/').then(function (e) {
      if (e.erro) { caixa.innerHTML = '<p>CEP não encontrado. Confira os números.</p>'; return; }
      guarda(cep);
      return coordenadas(e).then(function (c) {
        var perto = D.lojas.map(function (l) { return { loja: l, km: km(c.lat, c.lng, l.lat, l.lng) }; })
          .sort(function (a, b) { return a.km - b.km; })[0];
        return { loja: perto.loja, km: perto.km, e: e };
      }).catch(function () { return { loja: lojaPeloBairro(e), km: null, e: e }; })
        .then(function (r) { mostra(caixa, r); });
    }).catch(function () {
      caixa.innerHTML = '<p>Não consegui buscar agora. Escolha a loja:</p><p class="busca-cep-acoes">' + D.lojas.map(botaoLoja).join('') + '</p>';
    });
  }

  function prepara(form) {
    var campo = form.querySelector('input');
    campo.addEventListener('input', function () {
      var v = campo.value.replace(/\D/g, '').slice(0, 8);
      campo.value = v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
    });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); busca(form); });
    var antes = lembra();
    if (antes && !campo.value) { campo.value = antes.slice(0, 5) + '-' + antes.slice(5); busca(form); }
  }
  document.querySelectorAll('[data-busca-cep]').forEach(prepara);

  // Todo botão "Faça seu pedido" abre a janela; sem JavaScript, o link leva à página /pedir/.
  var janela = document.getElementById('janela-pedido');
  if (!janela || !janela.showModal) return;
  janela.querySelector('.janela-fechar').addEventListener('click', function () { janela.close(); });
  janela.addEventListener('click', function (e) { if (e.target === janela) janela.close(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-pedido]'); if (!a) return;
    e.preventDefault();
    var foto = document.getElementById('janela'); if (foto && foto.open) foto.close();
    var menu = a.closest('details'); if (menu) menu.open = false;
    janela.showModal();
    var campo = janela.querySelector('input'); if (!campo.value) campo.focus();
  });
})();

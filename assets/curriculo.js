// Formulário "Envie seu currículo" (página Trabalhe conosco).
// Com data-envio (função do banco): manda os dados e o PDF. Sem ele: abre o WhatsApp com os dados preenchidos.
(function () {
  var form = document.getElementById('form-curriculo'); if (!form) return;
  var U = window.JUST_UNIDADES || {}, status = form.querySelector('.form-status');
  var marca = form.elements.marca, unidade = form.elements.unidade;
  function opcoes(lista) { return '<option value="">Escolha</option>' + lista.map(function (x) { return '<option>' + x + '</option>'; }).join(''); }
  marca.addEventListener('change', function () {
    var todas = marca.value === 'Todas as empresas do grupo';
    var lista = todas ? ['Qualquer unidade'] : (U[marca.value] || []);
    unidade.innerHTML = opcoes(lista.concat(!todas && lista.length > 1 ? ['Qualquer unidade'] : []));
    // vaga pretendida: campo livre (Maikon 05/11) — o RH analisa no Recrutamento do Hub
  });
  // Vindo de uma página de vaga (/vagas/...): já deixa empresa, unidade e vaga escolhidas.
  try {
    var q = new URLSearchParams(location.search), escolhe = function (sel, v) {
      if (!v || !sel) return;
      if (sel.tagName !== 'SELECT') { sel.value = v; return; } // vaga pretendida: campo livre
      if (![].some.call(sel.options, function (o) { return o.value === v; })) sel.insertAdjacentHTML('beforeend', '<option>' + v.replace(/</g, '') + '</option>');
      sel.value = v;
    };
    if (q.get('marca')) { escolhe(marca, q.get('marca')); marca.dispatchEvent(new Event('change')); escolhe(unidade, q.get('unidade')); }
    escolhe(form.elements.funcao, q.get('vaga'));
  } catch (e) {}
  function ler(arq) {
    return new Promise(function (ok, erro) {
      if (!arq) return ok(null);
      if (arq.type !== 'application/pdf') return erro(new Error('O currículo precisa ser em PDF.'));
      if (arq.size > 2 * 1024 * 1024) return erro(new Error('O PDF passa de 2 MB.'));
      var r = new FileReader(); r.onload = function () { ok({ nome: arq.name, base64: String(r.result).split(',')[1] }); }; r.onerror = erro; r.readAsDataURL(arq);
    });
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    if (!form.checkValidity()) { status.textContent = 'Preencha nome, WhatsApp, empresa, unidade, vaga pretendida e a autorização.'; return; }
    if (f.site.value) return; // robô
    var dados = { nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim(), marca: f.marca.value, unidade: f.unidade.value, funcao: f.funcao.value.trim(), mensagem: f.mensagem.value.trim(), consentimento: true };
    var envio = form.getAttribute('data-envio');
    if (!envio) {
      var txt = 'Olá! Quero trabalhar no grupo Just Burger.\nNome: ' + dados.nome + '\nWhatsApp: ' + dados.telefone + (dados.email ? '\nE-mail: ' + dados.email : '') + '\nEmpresa: ' + dados.marca + '\nUnidade: ' + dados.unidade + '\nVaga: ' + dados.funcao + (dados.mensagem ? '\nSobre mim: ' + dados.mensagem : '');
      location.href = 'https://wa.me/' + (form.getAttribute('data-whats') || '551126228800') + '?text=' + encodeURIComponent(txt);
      return;
    }
    status.textContent = 'Enviando…'; form.querySelector('button').disabled = true;
    ler(f.arquivo.files[0]).then(function (arquivo) {
      dados.arquivo = arquivo;
      return fetch(envio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
    }).then(function (r) {
      if (!r.ok) throw new Error('falha');
      form.reset(); status.textContent = 'Currículo enviado! Obrigado. Se o seu perfil combinar com uma vaga, a gente chama você no WhatsApp.';
    }).catch(function (e) {
      status.textContent = e && e.message && e.message !== 'falha' ? e.message : 'Não consegui enviar agora. Tente de novo em alguns minutos.';
    }).then(function () { form.querySelector('button').disabled = false; });
  });
})();

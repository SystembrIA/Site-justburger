// Formulário "Fale com a gente" (/contato/).
// Manda para a função do banco (data-envio), que grava e avisa controle@ por e-mail.
// Se a função não responder, abre o e-mail do cliente já preenchido para controle@.
(function () {
  var form = document.getElementById('form-contato'); if (!form) return;
  var status = form.querySelector('.form-status'), botao = form.querySelector('button');
  function porEmail(d) {
    var corpo = d.assunto + ' pelo site\n\nNome: ' + d.nome + '\nWhatsApp: ' + d.telefone + (d.email ? '\nE-mail: ' + d.email : '') + (d.loja ? '\nLoja: ' + d.loja : '') + (d.pedido ? '\nPedido: ' + d.pedido : '') + '\n\n' + d.mensagem;
    location.href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent(d.assunto + ' pelo site: ' + d.nome) + '&body=' + encodeURIComponent(corpo);
    status.textContent = 'Abrimos o seu e-mail com a mensagem pronta: é só enviar.';
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    if (!form.checkValidity()) { status.textContent = 'Preencha nome, WhatsApp, assunto, mensagem e a autorização.'; return; }
    if (f.site.value) return; // robô
    var d = { nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim(), assunto: f.assunto.value, loja: f.loja.value, pedido: f.pedido.value.trim(), mensagem: f.mensagem.value.trim(), consentimento: true };
    var envio = form.getAttribute('data-envio');
    if (!envio) return porEmail(d);
    status.textContent = 'Enviando…'; botao.disabled = true;
    fetch(envio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { r: r, j: j }; }); })
      .then(function (x) {
        botao.disabled = false;
        if (x.r.ok && x.j.ok) { form.reset(); status.textContent = 'Mensagem enviada! Obrigado: a nossa equipe vai ler e responder.'; return; }
        if (x.r.status === 400 || x.r.status === 429) { status.textContent = x.j.erro || 'Confira os campos.'; return; }
        porEmail(d);
      })
      .catch(function () { botao.disabled = false; porEmail(d); });
  });
})();

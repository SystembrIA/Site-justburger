// Formulário "Fale com a gente" (/contato/).
// Manda para a função do banco (data-envio), que grava e avisa controle@ por e-mail.
// Se a função não responder, abre o e-mail do cliente já preenchido para controle@.
(function () {
  var form = document.getElementById('form-contato'); if (!form) return;
  var status = form.querySelector('.form-status'), botao = form.querySelector('button');
  function porEmail(d) {
    var corpo = d.assunto + ' pelo site\n\nNome: ' + d.nome + '\nWhatsApp: ' + d.telefone + (d.email ? '\nE-mail: ' + d.email : '') + (d.loja ? '\nLoja: ' + d.loja : '') + '\n\n' + d.mensagem;
    location.href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent(d.assunto + ' pelo site: ' + d.nome) + '&body=' + encodeURIComponent(corpo);
    status.textContent = 'Abrimos o seu e-mail com a mensagem pronta: é só enviar.';
  }
  // Caixinha de confirmação quando a mensagem chega (Maikon 16/11).
  function avisoEnviado() {
    var d = document.createElement('dialog');
    d.className = 'janela janela-enviado';
    d.innerHTML = '<div class="janela-texto"><p class="enviado-icone" aria-hidden="true">✓</p><h2>Mensagem enviada com sucesso!</h2><p>Obrigado por falar com a gente. A nossa equipe vai ler e responder pelo WhatsApp ou e-mail que você deixou.</p><button type="button" class="botao">Fechar</button></div>';
    document.body.appendChild(d);
    var fecha = function () { d.close(); d.remove(); };
    d.querySelector('button').addEventListener('click', fecha);
    d.addEventListener('click', function (e) { if (e.target === d) fecha(); });
    if (d.showModal) d.showModal(); else alert('Mensagem enviada com sucesso!');
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    if (!form.checkValidity()) { status.textContent = 'Preencha nome, WhatsApp, assunto, mensagem e a autorização.'; return; }
    if (f.site.value) return; // robô
    var d = { nome: f.nome.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim(), assunto: f.assunto.value, loja: f.loja.value, mensagem: f.mensagem.value.trim(), consentimento: true };
    var envio = form.getAttribute('data-envio');
    if (!envio) return porEmail(d);
    status.textContent = 'Enviando…'; botao.disabled = true;
    fetch(envio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { r: r, j: j }; }); })
      .then(function (x) {
        botao.disabled = false;
        if (x.r.ok && x.j.ok) { form.reset(); status.textContent = 'Mensagem enviada! Obrigado: a nossa equipe vai ler e responder.'; avisoEnviado(); return; }
        if (x.r.status === 400 || x.r.status === 429) { status.textContent = x.j.erro || 'Confira os campos.'; return; }
        porEmail(d);
      })
      .catch(function () { botao.disabled = false; porEmail(d); });
  });
})();

/* =========================================================================
   linkiir.com — Web3Forms submission

   Any <form data-web3form> is submitted over fetch so the visitor stays on
   the page and gets an inline result. The form still carries a real
   action="https://api.web3forms.com/submit", so with JavaScript disabled the
   browser posts it normally and Web3Forms shows its own confirmation.

   To change where submissions land, replace the access_key hidden input in
   the form markup. The key is public by design: it identifies the destination
   inbox and cannot be used to read anything.
   ========================================================================= */
(function () {
  'use strict';

  var forms = [].slice.call(document.querySelectorAll('form[data-web3form]'));
  if (!forms.length || typeof fetch !== 'function') return;

  forms.forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');
    var label  = button ? button.innerHTML : '';

    function say(kind, msg) {
      if (!status) return;
      status.hidden = false;
      status.className = 'form-status is-' + kind;
      status.innerHTML = msg;
    }

    form.addEventListener('submit', function (e) {
      // let the browser do a normal POST if the fields aren't valid yet
      if (!form.checkValidity()) return;
      e.preventDefault();

      if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }
      if (status) { status.hidden = true; }

      var data = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.success !== false) {
            form.reset();
            say('ok', '<strong>Thank you, that reached us.</strong> You will get a reply from a person, usually within one business day.');
            if (typeof window.gtag === 'function') {
              window.gtag('event', 'conversion', {
                send_to: 'AW-18360438570/2asFCJit--McEKqe-LJE',
                value: 1.0,
                currency: 'CAD'
              });
            }
          } else {
            say('err', 'That did not send. Please email <a href="mailto:sales@linkiir.com">sales@linkiir.com</a> and we will pick it up from there.');
          }
        })
        .catch(function () {
          say('err', 'That did not send, which is probably the network rather than you. Please email <a href="mailto:sales@linkiir.com">sales@linkiir.com</a>.');
        })
        .then(function () {
          if (button) { button.disabled = false; button.innerHTML = label; }
        });
    });
  });
})();

/* =========================================================================
   linkiir.com — download gate + package matrix
   Renders the release table from assets/downloads-data.js.

   NOTE ON THE GATE: this is a static site, so the gate is client-side. It
   records intent and unlocks the table; it is not a security control. Set
   LK_RELEASE.gateEndpoint to POST the lead somewhere real, and put the
   artifacts behind signed URLs if you need actual enforcement.
   ========================================================================= */
(function () {
  'use strict';

  var R    = window.LK_RELEASE  || {};
  var KAFKA = window.LK_KAFKA   || {};
  var PKGS = window.LK_PACKAGES || [];

  var gate      = document.getElementById('dl-gate');
  var vault     = document.getElementById('dl-vault');
  var form      = document.getElementById('dl-form');
  var tbody     = document.getElementById('dl-body');
  var kafkaSeg  = document.getElementById('kafka-seg');
  var kafkaDesc = document.getElementById('kafka-desc');
  var whoEl     = document.getElementById('dl-who');
  var relockEl  = document.getElementById('dl-relock');
  var isLatestPage = !gate && !!tbody;   // /latest.html renders ungated

  var kafka = 'bundled';
  var STORE = 'lk-dl-access';

  /* ---------- version stamps ---------- */
  [].slice.call(document.querySelectorAll('[data-version]')).forEach(function (el) {
    el.textContent = R.version || '—';
  });
  [].slice.call(document.querySelectorAll('[data-released]')).forEach(function (el) {
    if (!R.released) return;
    var d = new Date(R.released + 'T00:00:00Z');
    el.textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  });
  var notesEl = document.getElementById('dl-notes');
  if (notesEl && R.notes) {
    notesEl.innerHTML = R.notes.map(function (n) {
      return '<li><span class="check c-blue"><svg width="11" height="11" viewBox="0 0 12 12" fill="none">' +
             '<path d="M2.5 6.2l2.4 2.4L9.5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
             '</svg></span><span>' + n + '</span></li>';
    }).join('');
  }
  var sumsEl = document.getElementById('dl-checksums');
  if (sumsEl && R.checksums) sumsEl.setAttribute('href', R.checksums);

  /* ---------- table ---------- */
  function fill(tpl, k) {
    return String(tpl).replace(/\{v\}/g, R.version).replace(/\{k\}/g, k);
  }

  function render() {
    if (!tbody) return;
    var k = KAFKA[kafka] || KAFKA.bundled;
    if (kafkaDesc) kafkaDesc.textContent = k.desc;

    tbody.innerHTML = PKGS.map(function (p) {
      var thisKafka = p.kafka === 'bundled' ? KAFKA.bundled : k;
      var dir  = fill(p.dir, thisKafka.slug);
      var file = fill(p.file, thisKafka.slug);
      var href = dir ? ((R.baseUrl || '') + dir + '/' + file) : ((R.baseUrl || '') + file);

      var kafkaCell = p.kafka === 'bundled'
        ? '<span class="badge b-gray">Bundled Kafka</span><br><span class="tiny dim">broker is in the installer</span>'
        : '<span class="badge ' + (kafka === 'bundled' ? 'b-green' : '') + '">' + thisKafka.label + '</span>';

      return '<tr>' +
        '<td><div class="ad-name"><span class="ad-logo" style="background:' + osColour(p.os) + '">' + osIcon(p.os) + '</span>' +
          '<span><span class="ad-t">' + p.os + (p.recommended ? ' <span class="badge b-green" style="margin-left:.3rem">Most common</span>' : '') + '</span>' +
          '<span class="ad-id">' + p.variant + '</span></span></div></td>' +
        '<td><code class="dl-path"><span class="dl-dir">' + dir + '/</span>' + file + '</code>' +
          '<span class="dl-note">' + p.note + '</span></td>' +
        '<td class="c">' + kafkaCell + '</td>' +
        '<td class="c mono tiny dim">' + p.size + '</td>' +
        '<td class="c"><a class="btn btn-primary btn-sm" href="' + href + '" download>' +
          '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1.6v7.6M7 9.2L4.2 6.4M7 9.2l2.8-2.8M2 11.6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          ' Download</a></td>' +
      '</tr>';
    }).join('');
  }

  function osColour(os) {
    if (os === 'Windows') return '#4f46e5';
    return '#059669';
  }
  function osIcon(os) {
    if (os === 'Windows') return 'WIN';
    return 'LNX';
  }

  if (kafkaSeg) {
    kafkaSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-kafka]');
      if (!b) return;
      [].slice.call(kafkaSeg.querySelectorAll('button')).forEach(function (x) { x.classList.toggle('on', x === b); });
      kafka = b.getAttribute('data-kafka');
      render();
    });
  }

  /* ---------- gate ---------- */
  function unlock(who, animate) {
    if (!gate || !vault) return;
    gate.style.display = 'none';
    vault.hidden = false;
    if (whoEl && who) whoEl.textContent = who;
    render();
    if (animate) vault.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (gate) {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (saved && saved.email) unlock(saved.email, false);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = {
        name:  form.elements['name'].value.trim(),
        email: form.elements['email'].value.trim(),
        org:   form.elements['organisation'].value.trim(),
        use:   form.elements['use'].value,
        version: R.version,
        at: new Date().toISOString()
      };

      try { sessionStorage.setItem(STORE, JSON.stringify(data)); } catch (e2) {}

      if (R.gateEndpoint) {
        var payload = {
          access_key: R.accessKey,
          subject: 'Grid download: ' + data.org + ' (' + data.use + ')',
          from_name: 'linkiir.com downloads',
          name: data.name,
          email: data.email,
          organisation: data.org,
          purpose: data.use,
          version: data.version,
          message: data.name + ' at ' + data.org + ' downloaded Grid ' +
                   data.version + '. Reason given: ' + data.use + '.'
        };
        fetch(R.gateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function () { /* never block the download on a failed lead post */ });
      }

      unlock(data.email, true);
    });
  } else if (isLatestPage) {
    render();
  }

  if (relockEl) {
    relockEl.addEventListener('click', function (e) {
      e.preventDefault();
      try { sessionStorage.removeItem(STORE); } catch (er) {}
      location.reload();
    });
  }
})();

/* =========================================================================
   linkiir.com — Integration Network browser
   Search, filter and export the adapter registry. No dependencies.
   ========================================================================= */
(function () {
  'use strict';

  var ADAPTERS = window.LK_ADAPTERS || [];
  var CATS     = window.LK_CATEGORIES || {};

  var FORMATS = [
    { k: 'h', label: 'HL7 v2' },
    { k: 'f', label: 'FHIR' },
    { k: 'x', label: 'X12 / EDI' },
    { k: 'd', label: 'Bulk & file' },
    { k: 'a', label: 'Real-time API' },
    { k: 'k', label: 'Streaming' }
  ];

  var el = {
    search:  document.getElementById('net-search'),
    cat:     document.getElementById('net-cat'),
    dir:     document.getElementById('net-dir'),
    status:  document.getElementById('net-status'),
    chips:   document.getElementById('net-chips'),
    body:    document.getElementById('net-body'),
    counts:  document.getElementById('net-counts'),
    shown:   document.getElementById('net-shown'),
    reset:   document.getElementById('net-reset'),
    csv:     document.getElementById('net-csv'),
    empty:   document.getElementById('net-empty')
  };
  if (!el.body) return;

  var state = { q: '', cat: '', dir: '', status: '', formats: [] };

  /* ---------- build controls ---------- */
  Object.keys(CATS).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = CATS[k].label;
    el.cat.appendChild(o);
  });

  FORMATS.forEach(function (f) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = f.label;
    b.setAttribute('data-fmt', f.k);
    b.setAttribute('aria-pressed', 'false');
    el.chips.appendChild(b);
  });

  /* ---------- helpers ---------- */
  var STOP = { on: 1, of: 1, the: 1, and: 1, or: 1, over: 1, in: 1, to: 1, for: 1, a: 1, an: 1, via: 1 };

  function initials(name) {
    var words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/)
      .filter(function (w) { return w && !STOP[w.toLowerCase()]; });
    if (!words.length) return '??';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function tick(on) {
    return on
      ? '<span class="tick yes" title="Supported"><svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.3l2.6 2.6L10 3.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr">Yes</span></span>'
      : '<span class="tick no" aria-hidden="true">—</span>';
  }

  function statusBadge(s) {
    if (s === 'GA')   return '<span class="badge b-green">Available</span>';
    if (s === 'Beta') return '<span class="badge b-amber">Beta</span>';
    return '<span class="badge b-gray">' + s + '</span>';
  }

  function matches(a) {
    if (state.cat && a.c !== state.cat) return false;
    if (state.status && a.s !== state.status) return false;
    if (state.dir === 'in'  && !a.i) return false;
    if (state.dir === 'out' && !a.o) return false;
    for (var i = 0; i < state.formats.length; i++) {
      if (!a[state.formats[i]]) return false;
    }
    if (state.q) {
      var hay = (a.n + ' ' + a.v + ' ' + (CATS[a.c] ? CATS[a.c].label : '')).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  /* ---------- render ---------- */
  function render() {
    var rows = ADAPTERS.filter(matches);

    var html = rows.map(function (a) {
      var cat = CATS[a.c] || { label: a.c, colour: '#a1a1aa' };
      return '<tr>' +
        '<td><div class="ad-name">' +
          '<span class="ad-logo" style="background:' + cat.colour + '">' + initials(a.n) + '</span>' +
          '<span><span class="ad-t">' + a.n + '</span><span class="ad-id">' + a.v + '</span></span>' +
        '</div></td>' +
        '<td><span class="cat-pill" style="--cc:' + cat.colour + '">' + cat.label + '</span></td>' +
        '<td class="c">' + tick(a.i) + '</td>' +
        '<td class="c">' + tick(a.o) + '</td>' +
        '<td class="c">' + tick(a.h) + '</td>' +
        '<td class="c">' + tick(a.f) + '</td>' +
        '<td class="c">' + tick(a.x) + '</td>' +
        '<td class="c">' + tick(a.d) + '</td>' +
        '<td class="c">' + tick(a.a) + '</td>' +
        '<td class="c">' + tick(a.k) + '</td>' +
        '<td class="c">' + statusBadge(a.s) + '</td>' +
      '</tr>';
    }).join('');

    el.body.innerHTML = html;
    el.empty.style.display = rows.length ? 'none' : 'block';
    el.shown.textContent = rows.length === ADAPTERS.length
      ? ADAPTERS.length + ' adapters'
      : rows.length + ' of ' + ADAPTERS.length + ' adapters';

    // headline counts always reflect the current filter
    var c = function (f) { return rows.filter(function (a) { return a[f]; }).length; };
    el.counts.innerHTML =
      card(rows.length, 'Adapters') +
      card(c('h'), 'HL7 v2') +
      card(c('f'), 'FHIR') +
      card(c('x'), 'X12 / EDI') +
      card(c('a'), 'Real-time API') +
      card(c('k'), 'Streaming') +
      card(rows.filter(function (a) { return a.s === 'GA'; }).length, 'Available today');
  }

  function card(n, label) {
    return '<div class="count-card"><div class="cn">' + n + '</div><div class="cl">' + label + '</div></div>';
  }

  /* ---------- CSV ---------- */
  function toCsv() {
    var head = ['Adapter', 'Adapter ID', 'Category', 'Inbound', 'Outbound',
                'HL7 v2', 'FHIR', 'X12/EDI', 'Bulk & file', 'Real-time API', 'Streaming', 'Status'];
    var yn = function (v) { return v ? 'Yes' : 'No'; };
    var q  = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    var lines = [head.map(q).join(',')];
    ADAPTERS.filter(matches).forEach(function (a) {
      lines.push([a.n, a.v, (CATS[a.c] || {}).label || a.c,
                  yn(a.i), yn(a.o), yn(a.h), yn(a.f), yn(a.x), yn(a.d), yn(a.a), yn(a.k), a.s]
                 .map(q).join(','));
    });
    return lines.join('\r\n');
  }

  /* ---------- events ---------- */
  var debounce;
  el.search.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      state.q = el.search.value.trim().toLowerCase();
      render();
    }, 110);
  });

  el.cat.addEventListener('change', function ()    { state.cat = el.cat.value; render(); });
  el.dir.addEventListener('change', function ()    { state.dir = el.dir.value; render(); });
  el.status.addEventListener('change', function () { state.status = el.status.value; render(); });

  el.chips.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-fmt]');
    if (!b) return;
    var k = b.getAttribute('data-fmt');
    var i = state.formats.indexOf(k);
    if (i === -1) { state.formats.push(k); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
    else { state.formats.splice(i, 1); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
    render();
  });

  el.reset.addEventListener('click', function () {
    state = { q: '', cat: '', dir: '', status: '', formats: [] };
    el.search.value = ''; el.cat.value = ''; el.dir.value = ''; el.status.value = '';
    [].slice.call(el.chips.querySelectorAll('.chip')).forEach(function (b) {
      b.classList.remove('on'); b.setAttribute('aria-pressed', 'false');
    });
    render();
  });

  el.csv.addEventListener('click', function (e) {
    e.preventDefault();
    var blob = new Blob([toCsv()], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'linkiir-integration-network.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  });

  render();
})();

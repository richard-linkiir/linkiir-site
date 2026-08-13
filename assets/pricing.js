/* =========================================================================
   linkiir.com — pricing calculator
   Two inputs: customer type (vendor = per site, hospital = per system),
   and how many. Minimum five. The per-unit rate falls at every band.
   ========================================================================= */
(function () {
  'use strict';

  // annual list price for the Nth site / system
  var BANDS = [
    { upTo: 5,        each: 4000, label: '1–5'   },
    { upTo: 10,       each: 3400, label: '6–10'  },
    { upTo: 25,       each: 2800, label: '11–25' },
    { upTo: 50,       each: 2200, label: '26–50' },
    { upTo: 100,      each: 1700, label: '51–100'},
    { upTo: Infinity, each: 1300, label: '101+'  }
  ];
  var MINIMUM = 5;

  var COPY = {
    vendor: {
      unit: 'site', units: 'sites',
      who:  'Vendors deploy Grid once per customer site. Hospitals and health systems deploy it once per connected system.',
      cntT: 'How many sites?',
      cntD: 'Five is the minimum. Past that the per-site rate drops at every band, automatically — you don’t have to negotiate for it.'
    },
    hospital: {
      unit: 'system', units: 'systems',
      who:  'Hospitals and health systems pay per connected system — your EHR is one, your LIS is one, your PACS is one. Vendors pay per customer site instead.',
      cntT: 'How many systems?',
      cntD: 'Five is the minimum. Past that the per-system rate drops at every band, automatically — you don’t have to negotiate for it.'
    }
  };

  var typeSeg  = document.getElementById('type-seg');
  var countSeg = document.getElementById('count-seg');
  var whoDesc  = document.getElementById('who-desc');
  var countT   = document.getElementById('count-t');
  var countD   = document.getElementById('count-d');
  var numEl    = document.getElementById('price-num');
  var subEl    = document.getElementById('price-sub');
  var linesEl  = document.getElementById('price-lines');
  if (!typeSeg || !countSeg || !numEl) return;

  var type  = 'vendor';
  var count = MINIMUM;

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  function quote(n) {
    n = Math.max(MINIMUM, n);
    var total = 0, breakdown = [];
    for (var i = 1; i <= n; i++) {
      var band = BANDS.find(function (b) { return i <= b.upTo; });
      total += band.each;
      var last = breakdown[breakdown.length - 1];
      if (last && last.label === band.label) { last.count++; last.sum += band.each; }
      else breakdown.push({ label: band.label, each: band.each, count: 1, sum: band.each });
    }
    return { total: total, breakdown: breakdown, effective: total / n };
  }

  function animateTo(el, to) {
    var from = parseFloat((el.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
    if (window.LK && window.LK.reduce) { el.textContent = Math.round(to).toLocaleString('en-US'); return; }
    var t0 = null, dur = 420;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function render() {
    var c = COPY[type];
    var q = quote(count);

    whoDesc.textContent = c.who;
    countT.textContent  = c.cntT;
    countD.textContent  = c.cntD;

    animateTo(numEl, q.total);

    subEl.innerHTML = count + (count >= 250 ? '+ ' : ' ') + c.units +
                      ' · ' + money(q.effective) + ' each on average · 24×7 support included';

    var rows = '';
    q.breakdown.forEach(function (b) {
      rows += '<div class="pl"><span>' + c.units.charAt(0).toUpperCase() + c.units.slice(1) +
              ' ' + b.label + ' <span class="dim">(' + b.count + ' × ' + money(b.each) + ')</span></span>' +
              '<span class="pl-v">' + money(b.sum) + '</span></div>';
    });
    rows += '<div class="pl pl-off"><span>Linkiir engineers · 24×7 support · unlimited messages</span><span class="pl-v">Included</span></div>';
    rows += '<div class="pl pl-off"><span>All 197 adapters · non-production environments · console users</span><span class="pl-v">Included</span></div>';
    rows += '<div class="pl pl-total"><span>Total, billed annually</span><span class="pl-v">' + money(q.total) + '</span></div>';

    if (count >= 250) {
      rows += '<p class="tiny dim mt-2 mb-0">Above 250 ' + c.units + ' the shape usually changes — most estates this size move to a wholesale agreement. ' +
              '<a href="contact.html">Let’s talk</a> rather than trust this number.</p>';
    }

    linesEl.innerHTML = rows;
  }

  typeSeg.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-type]');
    if (!btn) return;
    [].slice.call(typeSeg.querySelectorAll('button')).forEach(function (b) { b.classList.toggle('on', b === btn); });
    type = btn.getAttribute('data-type');
    render();
  });

  countSeg.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-count]');
    if (!btn) return;
    [].slice.call(countSeg.querySelectorAll('button')).forEach(function (b) { b.classList.toggle('on', b === btn); });
    count = parseInt(btn.getAttribute('data-count'), 10);
    render();
  });

  render();
})();

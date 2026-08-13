/* =========================================================================
   linkiir.com — shared behaviour
   Vanilla JS, no dependencies, no build step.
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------- local file:// fix */
  /* Pages are published as directories (/pricing/) so the address bar stays
     clean on a web host. Opening the folder straight off disk has no server
     to resolve /pricing/ to /pricing/index.html, so do it here. Only ever
     runs under file:// — hosted URLs are untouched. */
  function initLocalLinks() {
    if (location.protocol !== 'file:') return;
    [].slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || /^(https?:|mailto:|tel:|#|\/\/|data:)/.test(h)) return;
      if (/\/$/.test(h))        a.setAttribute('href', h + 'index.html');
      else if (/\/#/.test(h))   a.setAttribute('href', h.replace('/#', '/index.html#'));
    });
  }

  /* ---------------------------------------------------------------- nav */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // burger
    var burger = nav.querySelector('.nav-burger');
    if (burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // dropdowns
    var items = [].slice.call(nav.querySelectorAll('.nav-item.has-dd'));
    var isDesktop = function () { return window.innerWidth > 980; };

    items.forEach(function (item) {
      var trigger = item.querySelector('.nav-link');
      var closeTimer;

      var open = function () {
        clearTimeout(closeTimer);
        items.forEach(function (o) { if (o !== item) o.classList.remove('open'); });
        item.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      };
      var close = function () {
        item.classList.remove('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      };

      item.addEventListener('mouseenter', function () { if (isDesktop()) open(); });
      item.addEventListener('mouseleave', function () {
        if (isDesktop()) { closeTimer = setTimeout(close, 120); }
      });
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          if (item.classList.contains('open')) { close(); } else { open(); }
        });
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) items.forEach(function (i) { i.classList.remove('open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        items.forEach(function (i) { i.classList.remove('open'); });
        nav.classList.remove('menu-open');
      }
    });
  }

  /* ------------------------------------------------------------- reveal */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.rv'));
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------- counters */
  function fmt(n, dp, suffix, prefix) {
    var s = dp ? n.toFixed(dp) : Math.round(n).toLocaleString('en-US');
    return (prefix || '') + s + (suffix || '');
  }

  function runCount(el) {
    var target  = parseFloat(el.getAttribute('data-count'));
    var dp      = parseInt(el.getAttribute('data-dp') || '0', 10);
    var suffix  = el.getAttribute('data-suffix') || '';
    var prefix  = el.getAttribute('data-prefix') || '';
    var dur     = parseInt(el.getAttribute('data-dur') || '1500', 10);
    if (isNaN(target)) return;
    if (reduce) { el.textContent = fmt(target, dp, suffix, prefix); return; }

    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, dp, suffix, prefix);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(target, dp, suffix, prefix);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(runCount); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- code tabs */
  function initTabs() {
    [].slice.call(document.querySelectorAll('[data-tabs]')).forEach(function (root) {
      var btns  = [].slice.call(root.querySelectorAll('.code-tab'));
      var panes = [].slice.call(root.querySelectorAll('.code-pane'));
      var nameEl = root.querySelector('.code-name');
      var timer = null;
      var idx = 0;

      function show(i, userDriven) {
        idx = i;
        btns.forEach(function (b, k) {
          b.classList.toggle('on', k === i);
          b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        });
        panes.forEach(function (p, k) { p.classList.toggle('on', k === i); });
        if (nameEl && btns[i]) nameEl.textContent = btns[i].getAttribute('data-name') || '';
        if (userDriven && timer) { clearInterval(timer); timer = null; }
      }

      btns.forEach(function (b, k) {
        b.addEventListener('click', function () { show(k, true); });
      });
      show(0);

      // gentle auto-advance until the visitor interacts
      if (!reduce && btns.length > 1 && root.hasAttribute('data-auto')) {
        var started = false;
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (en.isIntersecting && !started) {
              started = true;
              timer = setInterval(function () { show((idx + 1) % btns.length); }, 4200);
            }
          });
        }, { threshold: 0.4 });
        io.observe(root);
      }
    });
  }

  /* ---------------------------------------------------------- typewriter */
  function initType() {
    [].slice.call(document.querySelectorAll('[data-type]')).forEach(function (el) {
      var words;
      try { words = JSON.parse(el.getAttribute('data-type')); }
      catch (e) { words = [el.getAttribute('data-type')]; }
      if (!words || !words.length) return;

      var caret = document.createElement('span');
      caret.className = 'type-caret';
      caret.textContent = '█';
      caret.style.cssText = 'opacity:.55;font-weight:400;margin-left:2px;animation:gu-blink 1.05s step-end infinite';

      if (reduce) { el.textContent = words[0]; return; }

      el.textContent = '';
      el.appendChild(document.createTextNode(''));
      el.appendChild(caret);
      var textNode = el.firstChild;

      var w = 0, c = 0, deleting = false;
      function tick() {
        var word = words[w];
        if (!deleting) {
          c++;
          textNode.nodeValue = word.slice(0, c);
          if (c === word.length) {
            deleting = true;
            return setTimeout(tick, words.length > 1 ? 1900 : 100000);
          }
          return setTimeout(tick, 58 + Math.random() * 45);
        }
        c--;
        textNode.nodeValue = word.slice(0, c);
        if (c === 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(tick, 320); }
        return setTimeout(tick, 26);
      }
      var io = new IntersectionObserver(function (es, obs) {
        es.forEach(function (en) { if (en.isIntersecting) { setTimeout(tick, 450); obs.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(el);
    });
  }

  /* ------------------------------------------------- live metric jitter */
  function initJitter() {
    if (reduce) return;
    var els = [].slice.call(document.querySelectorAll('[data-jitter]'));
    if (!els.length) return;
    var visible = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.target === els[0]) visible = en.isIntersecting; });
    }, { threshold: 0.1 });
    io.observe(els[0]);

    setInterval(function () {
      if (!visible) return;
      els.forEach(function (el) {
        var base = parseFloat(el.getAttribute('data-jitter'));
        var spread = parseFloat(el.getAttribute('data-spread') || '0.12');
        var dp = parseInt(el.getAttribute('data-dp') || '0', 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var v = base * (1 + (Math.random() - 0.5) * 2 * spread);
        el.textContent = (dp ? v.toFixed(dp) : Math.round(v).toLocaleString('en-US')) + suffix;
      });
    }, 1900);
  }

  /* ----------------------------------------------------- log stream feed */
  function initStream() {
    var host = document.querySelector('[data-stream]');
    if (!host) return;

    var kinds = ['i', 'o', 'i', 'o', 'i', 'w', 'o', 'i', 'o', 'i'];
    var labels = { i: 'IN ', o: 'OUT', w: 'WARN', e: 'ERR' };
    var lines = [
      ['i', 'ADT^A08 <b>MRN 40118823</b> · epic-adt-in · 1.9&nbsp;kB'],
      ['o', 'ADT^A08 → <b>snowflake-clinical</b> · ack 6&nbsp;ms'],
      ['i', 'ORU^R01 <b>ACC 77-40912</b> · labcorp-results · 4.2&nbsp;kB'],
      ['o', 'FHIR <b>Observation</b> ×14 → azure-fhir · 201'],
      ['i', 'SIU^S12 <b>appt 8841002</b> · cadence-sched · 1.1&nbsp;kB'],
      ['w', 'PID-3 assigning authority blank → <b>default applied</b>'],
      ['o', 'ORM^O01 → <b>meditech-orders</b> · MLLP ack AA'],
      ['i', '837P <b>batch 2214</b> · availity-sftp · 812&nbsp;claims'],
      ['o', '835 ERA <b>batch 1180</b> → rcm-inbox · 27.4&nbsp;kB'],
      ['i', 'VXU^V04 <b>imm 5512</b> · registry-in · 0.8&nbsp;kB'],
      ['o', 'ADT^A03 → <b>palantir-foundry</b> · 200 · 11&nbsp;ms'],
      ['i', 'MDM^T02 <b>doc 90114</b> · nuance-dictation · 22&nbsp;kB']
    ];

    function stamp() {
      var d = new Date();
      return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    }
    function row(spec) {
      var el = document.createElement('div');
      el.className = 'gu-lrow ' + spec[0];
      el.innerHTML = '<span class="lt">' + stamp() + '</span><span class="ll">' + labels[spec[0]] + '</span><span class="lm">' + spec[1] + '</span>';
      return el;
    }

    var max = parseInt(host.getAttribute('data-stream') || '8', 10);
    for (var i = 0; i < max; i++) host.appendChild(row(lines[i % lines.length]));
    if (reduce) return;

    var n = max;
    var visible = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { visible = en.isIntersecting; });
    }, { threshold: 0.1 });
    io.observe(host);

    setInterval(function () {
      if (!visible) return;
      var el = row(lines[n++ % lines.length]);
      el.style.opacity = '0';
      host.appendChild(el);
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .35s ease';
        el.style.opacity = '1';
      });
      while (host.children.length > max) host.removeChild(host.firstChild);
    }, 1650);
  }

  /* --------------------------------------------------------- marquee dup */
  function initMarquee() {
    [].slice.call(document.querySelectorAll('.marquee-track')).forEach(function (track) {
      if (track.getAttribute('data-dup') === 'done') return;
      track.innerHTML += track.innerHTML;
      track.setAttribute('data-dup', 'done');
    });
  }

  /* ------------------------------------------------------- flow diagrams */
  /* The travelling dots are SMIL animateMotion, which a CSS media query
     cannot switch off. Freeze them at their first frame when the visitor has
     asked for reduced motion. Wires and labels still render, so the diagram
     keeps its meaning. */
  function initFlow() {
    if (!reduce) return;
    [].slice.call(document.querySelectorAll('.flow-svg, .wirebg svg')).forEach(function (svg) {
      if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
    });
  }

  /* ---------------------------------------------------------------- init */
  function boot() {
    initLocalLinks();
    initNav();
    initMarquee();
    initReveal();
    initCounters();
    initTabs();
    initType();
    initJitter();
    initStream();
    initFlow();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // expose for page-level scripts
  window.LK = { reduce: reduce, count: runCount };
})();

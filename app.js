/* Linkiir site v2 — interactions */

(function(){
  /* ── Orbit chips (hero) ── */
  const ring = document.getElementById('ring');
  if (ring){
    const chips = [
      'HL7 v2', 'FHIR R4', 'FHIR R5', 'X12 837', 'X12 270', 'NCPDP',
      'XML / HTTPS', 'TCP/MLLP', 'SFTP', 'Rhapsody', 'Mirth Connect', 'Cloverleaf',
      'Iguana', 'Corepoint', 'BizTalk', 'AWS HealthLake', 'Azure FHIR', 'GCP HCAPI'
    ];
    const N = chips.length;
    chips.forEach((label, i) => {
      const angle = (360 / N) * i;
      const el = document.createElement('span');
      el.className = 'orbit__chip';
      el.textContent = label;
      el.style.setProperty('--a', angle + 'deg');
      ring.appendChild(el);
    });

    // Animate global spin so the whole ring rotates while chips stay upright.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce){
      const start = performance.now();
      const period = 80000; // 80s full rotation
      function tick(now){
        const t = ((now - start) % period) / period;
        ring.style.setProperty('--spin', (t * 360).toFixed(2) + 'deg');
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ── Nav burger / mobile menu ── */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const menuClose = document.getElementById('menuClose');
  if (burger && menu){
    burger.addEventListener('click', () => menu.classList.add('is-open'));
  }
  if (menuClose && menu){
    menuClose.addEventListener('click', () => menu.classList.remove('is-open'));
    menu.addEventListener('click', (e) => {
      if (e.target === menu) menu.classList.remove('is-open');
    });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq__item').forEach(item => {
    const btn = item.querySelector('.faq__q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      // close others
      document.querySelectorAll('.faq__item.is-open').forEach(o => o.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  /* ── Scroll reveal ── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ── Contact form (Web3Forms) ── */
  const form = document.getElementById('contactForm');
  if (form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Sending…';
      const data = new FormData(form);
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: data,
        });
        if (res.ok){
          btn.innerHTML = 'Thank you — we\u2019ll be in touch.';
          form.reset();
        } else {
          btn.disabled = false;
          btn.innerHTML = original;
          alert('Something went wrong. Please email sales@linkiir.com.');
        }
      } catch(err){
        btn.disabled = false;
        btn.innerHTML = original;
        alert('Network error. Please email sales@linkiir.com.');
      }
    });
  }
})();

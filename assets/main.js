(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- intro (once per visit) ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem('tm-intro') === '1'; sessionStorage.setItem('tm-intro', '1'); } catch {}
  const intro = $('.intro');
  const introMs = reduce || seen ? 0 : 1700;
  if (introMs === 0) intro?.remove();
  else setTimeout(() => intro?.remove(), 2600);

  /* ---------- split the hero title into letters ---------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
    });
  });

  /* ---------- scroll-lit statement: one span per word ---------- */
  const lit = $('[data-lit]');
  let words = [];
  if (lit) {
    const t = lit.textContent.trim();
    lit.textContent = '';
    t.split(/\s+/).forEach((w, i, a) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      lit.appendChild(s);
      if (i < a.length - 1) lit.appendChild(document.createTextNode(' '));
    });
    words = $$('.w', lit);
  }

  setTimeout(() => {
    document.body.classList.add('ready');
    $$('.hero .r, .hero [data-split]').forEach((el, i) => { el.style.setProperty('--d', (i * .12) + 's'); el.classList.add('in'); });
  }, introMs);

  /* ---------- reveal on scroll, staggered within each batch ---------- */
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.setProperty('--d', (i * .08) + 's');
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.r').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- scroll-linked: progress bar, Minus stage, lit words, nav ---------- */
  const nav = $('.nav'), bar = $('.progress'), frame = $('[data-stage] .frame');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const h = innerHeight, max = document.documentElement.scrollHeight - h;
    bar.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    nav.classList.toggle('shrunk', scrollY > 30);

    if (frame && !reduce) {
      const r = frame.parentElement.getBoundingClientRect();
      frame.style.setProperty('--s', clamp((h - r.top) / (h * .75)).toFixed(3));
    }
    if (words.length) {
      const r = lit.getBoundingClientRect();
      const p = reduce ? 1 : clamp((h * .85 - r.top) / (r.height + h * .35));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (reduce || !fine) return;

  /* ---------- cursor spotlight ---------- */
  const bg = $('.bg');
  addEventListener('pointermove', e => {
    bg.style.setProperty('--mx', e.clientX + 'px');
    bg.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  /* ---------- glowing borders ---------- */
  $$('[data-glow]').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  }));

  /* ---------- gentle 3D tilt ---------- */
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (!el.classList.contains('in') && el.classList.contains('r')) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- magnetic buttons ---------- */
  $$('.btn, .nav .pill').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
})();

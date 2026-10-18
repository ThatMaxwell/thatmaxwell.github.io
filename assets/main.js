(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = (() => { try { return sessionStorage.getItem('tm-intro'); } catch { return null; } })();
  const PAPER = ['#ffffff', '#f6e7c8', '#f2b8c6', '#d9e7cf', '#cfe2ee', '#fbe3a6', '#e9dcf5', '#f4d3c2'];

  /* ---------- paper-cut words ---------- */
  function paperize(el, word) {
    el.textContent = '';
    [...word].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'pl';
      s.textContent = ch;
      s.style.setProperty('--c', PAPER[(i * 5 + word.length) % PAPER.length]);
      el.appendChild(s);
    });
    return $$('.pl', el);
  }
  const twitching = [];
  function jitter() {
    for (const s of twitching) {
      s.style.setProperty('--r', (Math.random() * 8 - 4).toFixed(1) + 'deg');
      s.style.setProperty('--x', (Math.random() * 3 - 1.5).toFixed(1) + 'px');
      s.style.setProperty('--y', (Math.random() * 3 - 1.5).toFixed(1) + 'px');
    }
    const n = $('#boil-noise');
    if (n) n.setAttribute('seed', String(1 + Math.floor(Math.random() * 4)));
    const sun = $('.sun');
    if (sun?.classList.contains('on')) sun.style.setProperty('--sr', (Math.random() * 6 - 3).toFixed(1) + 'deg');
  }
  if (!reduce) setInterval(jitter, 333); // 3 fps, like stop motion

  $$('.paper-word').forEach(el => twitching.push(...paperize(el, el.dataset.word)));

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.proj, .note, section h2, .hero > *').forEach(el => { el.classList.add('reveal'); io.observe(el); });
  addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 20), { passive: true });

  /* ---------- petals ---------- */
  let petalTimer = null;
  function petals(on) {
    const box = $('.petals');
    clearInterval(petalTimer);
    if (!on) return;
    petalTimer = setInterval(() => {
      const p = document.createElement('img');
      p.src = `assets/scene/petal-${1 + Math.floor(Math.random() * 3)}.webp`;
      p.alt = '';
      p.className = 'petal';
      const tree = $('.tree').getBoundingClientRect();
      p.style.left = (tree.left + tree.width * (0.15 + Math.random() * 0.7)) + 'px';
      p.style.top = (tree.top + tree.height * (0.05 + Math.random() * 0.35)) + 'px';
      p.style.width = (12 + Math.random() * 12) + 'px';
      p.style.setProperty('--d', (6 + Math.random() * 5).toFixed(1) + 's');
      p.style.setProperty('--sx', (80 + Math.random() * 260).toFixed(0) + 'px');
      box.appendChild(p);
      setTimeout(() => p.remove(), 12000);
    }, 260);
  }

  /* ---------- the scene ---------- */
  const scene = $('#scene');
  const sun = $('.sun');
  const showPage = () => { sun.classList.add('on'); document.body.classList.remove('playing'); };

  if (seen || reduce) {
    scene.remove();
    showPage();
    return;
  }

  document.body.classList.add('playing');
  const nameLetters = paperize($('.paper-name'), 'ThatMaxwell');
  twitching.push(...nameLetters);
  let skipped = false;

  async function finish() {
    try { sessionStorage.setItem('tm-intro', '1'); } catch {}
    scene.classList.add('leave');
    petals(false);
    await sleep(1100);
    scene.classList.add('gone');
    await sleep(300);
    showPage();
    setTimeout(() => scene.remove(), 900);
  }
  $('.skip').addEventListener('click', () => { skipped = true; finish(); });

  (async () => {
    // wait for the photos so nothing pops in half-loaded
    await Promise.all($$('#scene img').map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    const step = async (cls, ms) => { if (skipped) return true; scene.classList.add(cls); await sleep(ms); return skipped; };
    await sleep(500);
    if (await step('s-tree', 1500)) return;
    if (await step('s-grass', 700)) return;
    petals(true);
    if (await step('s-river', 700)) return;
    if (await step('s-bench', 1900)) return;
    for (const l of nameLetters) { if (skipped) return; l.classList.add('up'); await sleep(110); }
    await sleep(2600);
    if (!skipped) finish();
  })();
})();

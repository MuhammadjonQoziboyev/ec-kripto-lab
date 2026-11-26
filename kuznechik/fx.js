/* Effektlar: fon canvas'i (tushuvchi hex), hero jadvali, scroll bilan paydo bo'lish, XOR laboratoriyasi. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const h2 = (b) => b.toString(16).padStart(2, '0');
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const xpow = (k) => (k === 0 ? '1' : k === 1 ? 'x' : 'x' + String(k).split('').map((d) => SUP[+d]).join(''));
  const poly = (b) => { if (!b) return '0'; const o = []; for (let k = 7; k >= 0; k--) if ((b >> k) & 1) o.push(xpow(k)); return o.join(' + '); };

  /* ---------- fon: sekin tushuvchi hex belgilari ---------- */
  function initCanvas() {
    const cv = $('#bg'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, cols = [], size = 15, last = 0;
    const chars = '0123456789abcdef';
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(W / 26);
      cols = Array.from({ length: n }, (_, i) => ({ x: i * 26 + 6, y: Math.random() * H, v: 0.25 + Math.random() * 0.55, c: Math.random() }));
      ctx.clearRect(0, 0, W, H);
      if (reduce.matches) drawStatic();
    }
    function drawStatic() {
      ctx.font = size + 'px ui-monospace, Consolas, monospace';
      cols.forEach((c) => { for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(120,200,255,' + (0.05 + Math.random() * 0.08) + ')'; ctx.fillText(chars[(Math.random() * 16) | 0], c.x, Math.random() * H); } });
    }
    function frame(ts) {
      requestAnimationFrame(frame);
      if (document.hidden || ts - last < 40) return;
      last = ts;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.09)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = size + 'px ui-monospace, Consolas, monospace';
      cols.forEach((c) => {
        c.y += c.v * 2.2;
        if (c.y > H + 20) { c.y = -10; c.v = 0.25 + Math.random() * 0.55; }
        ctx.fillStyle = c.c > 0.7 ? 'rgba(169,139,255,0.34)' : c.c > 0.35 ? 'rgba(56,225,255,0.30)' : 'rgba(62,224,160,0.26)';
        ctx.fillText(chars[(Math.random() * 16) | 0], c.x, c.y);
      });
    }
    window.addEventListener('resize', resize);
    resize();
    if (!reduce.matches) requestAnimationFrame(frame);
  }

  /* ---------- hero jadvali ---------- */
  function initHero() {
    const g = $('#heroGrid'); if (!g) return;
    const cells = [];
    const colors = ['x', 's', 'l', 'k'];
    for (let i = 0; i < 16; i++) {
      const c = document.createElement('div');
      c.className = 'hcell c-' + colors[(i * 7 + (i >> 2)) % 4];
      const v = Kuz.PI[(i * 37 + 11) % 256];
      c.innerHTML = '<span>' + h2(v) + '</span>';
      g.appendChild(c); cells.push(c);
    }
    if (reduce.matches) return;
    setInterval(() => {
      if (document.hidden) return;
      const c = cells[(Math.random() * 16) | 0];
      const s = c.firstChild;
      const old = parseInt(s.textContent, 16);
      s.textContent = h2(Kuz.PI[old]);
      c.className = 'hcell c-' + colors[(Math.random() * 4) | 0];
      c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
    }, 520);
  }

  /* ---------- scroll bilan paydo bo'lish ---------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (reduce.matches || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- XOR laboratoriyasi ---------- */
  const lab = { a: 0x5a, k: 0xc3 };
  function renderLab() {
    const box = $('#labBox'); if (!box) return;
    const r = lab.a ^ lab.k;
    const row = (name, val, edit) => {
      let s = '<div class="lab-row"><span class="lab-name">' + name + '</span><div class="lab-bits">';
      for (let b = 7; b >= 0; b--) {
        const v = (val >> b) & 1;
        s += edit ? '<button type="button" class="lb b' + v + '" data-w="' + (name === 'a' ? 'a' : 'k') + '" data-b="' + b + '" aria-label="' + name + ' ' + xpow(b) + '">' + v + '</button>' : '<span class="lb b' + v + ' res">' + v + '</span>';
      }
      return s + '</div><span class="lab-hex">0x' + h2(val) + ' <small>' + val + '</small></span></div>';
    };
    let head = '<div class="lab-row lab-head"><span class="lab-name"></span><div class="lab-bits">';
    for (let b = 7; b >= 0; b--) head += '<span class="lb hd">' + xpow(b) + '</span>';
    head += '</div><span class="lab-hex"></span></div>';
    box.innerHTML = head + row('a', lab.a, true) + '<div class="lab-op">⊕</div>' + row('k', lab.k, true) + '<div class="lab-line"></div>' + row('r', r, false) +
      '<div class="lab-poly"><div>a(x) = ' + poly(lab.a) + '</div><div>k(x) = ' + poly(lab.k) + '</div><div class="sum">a(x) + k(x) = ' + poly(r) + '</div></div>' +
      '<div class="lab-rev">' + t('lab_rev', { r: h2(r), k: h2(lab.k), a: h2(r ^ lab.k) }) + ' <b class="okc">' + ((r ^ lab.k) === lab.a ? '✓' : '✗') + '</b></div>';
    box.querySelectorAll('button.lb').forEach((b) => b.addEventListener('click', () => { lab[b.dataset.w] ^= 1 << +b.dataset.b; renderLab(); }));
  }
  function initLab() {
    renderLab();
    document.addEventListener('langchange', renderLab);
    const rnd = $('#labRand'), clr = $('#labClear');
    if (rnd) rnd.addEventListener('click', () => { lab.a = (Math.random() * 256) | 0; lab.k = (Math.random() * 256) | 0; renderLab(); });
    if (clr) clr.addEventListener('click', () => { lab.a = 0; lab.k = 0; renderLab(); });
  }

  function init() {
    document.documentElement.classList.add('js');
    initCanvas(); initHero(); initReveal();
    // t() app.js dan oldin tilni o'rnatadi; lab shu yerda keyin chiziladi
    const wait = () => { if (window.__ready) initLab(); else setTimeout(wait, 20); };
    wait();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

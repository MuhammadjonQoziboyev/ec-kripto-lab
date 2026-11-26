// Bezaklar va kichik interaktivlar: fon, hero jadval, scroll animatsiyasi, XOR laboratoriyasi.
import { t } from './i18n.js';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEX = '0123456789ABCDEF';
const rnd = (n) => Math.floor(Math.random() * n);
const hx = (b) => b.toString(16).padStart(2, '0').toUpperCase();

/* ---- Fon: sekin tushayotgan hex belgilari ---- */
(function bg() {
  const cv = document.getElementById('bg');
  if (!cv || reduce) return;
  const ctx = cv.getContext('2d');
  let w, h, cols, drops;
  const size = 16;
  const resize = () => {
    w = cv.width = innerWidth; h = cv.height = innerHeight;
    cols = Math.ceil(w / (size * 2.2));
    drops = Array.from({ length: cols }, () => rnd(h / size));
  };
  addEventListener('resize', resize); resize();
  let last = 0;
  const tick = (t) => {
    if (t - last > 90) {
      last = t;
      ctx.fillStyle = 'rgba(7,9,20,.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${size}px JetBrains Mono, monospace`;
      drops.forEach((y, i) => {
        const x = i * size * 2.2;
        ctx.fillStyle = Math.random() > 0.97 ? 'rgba(34,211,238,.55)' : 'rgba(129,140,248,.16)';
        ctx.fillText(HEX[rnd(16)] + HEX[rnd(16)], x, y * size);
        drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 1;
      });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---- Hero: 4x4 jadval harflari aralashib, tartibga tushadi ---- */
(function heroGrid() {
  const el = document.getElementById('heroGrid');
  if (!el) return;
  const colors = ['sub', 'shift', 'mix', 'key'];
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('div');
    c.className = 'hcell';
    c.textContent = hx(rnd(256));
    el.appendChild(c); cells.push(c);
  }
  let phase = 0;
  const scramble = (c, final, delay) => {
    let n = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        c.textContent = hx(rnd(256));
        if (++n > 8) { clearInterval(iv); c.textContent = final; }
      }, 55);
    }, delay);
  };
  const wave = () => {
    const col = colors[phase++ % 4];
    el.dataset.op = col;
    cells.forEach((c, i) => {
      const r = i % 4, cc = Math.floor(i / 4);
      const d = (r + cc) * 90;
      scramble(c, hx(rnd(256)), d);
      c.classList.remove('pulse'); void c.offsetWidth;
      c.style.animationDelay = d + 'ms';
      c.classList.add('pulse');
    });
  };
  wave();
  if (!reduce) setInterval(wave, 3600);
})();

/* ---- Matn "shifrlanishi" effekti ---- */
(function scramblers() {
  const a = document.getElementById('scr1'), b = document.getElementById('scr2');
  if (!a || !b || reduce) return;
  let k = 0;
  const run = () => {
    const msgs = t('fx.msgs').split('|');
    const m = msgs[k++ % msgs.length];
    a.textContent = m;
    let n = 0;
    const iv = setInterval(() => {
      b.textContent = Array.from({ length: Math.min(8, m.length) }, () => hx(rnd(256))).join(' ') + ' …';
      if (++n > 18) clearInterval(iv);
    }, 70);
  };
  run(); setInterval(run, 4200);
})();

/* ---- Scroll bilan paydo bo'lish ---- */
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
})();

/* ---- XOR laboratoriyasi ---- */
(function xorLab() {
  const root = document.getElementById('xorlab');
  if (!root) return;
  let a = 0b10100011, k = 0b01101100;
  const row = (label, val, who) => `
    <div class="xrow"><span class="xl">${label}</span>
    <div class="xbits">${[7, 6, 5, 4, 3, 2, 1, 0].map((i) => `<button class="xb ${val >> i & 1 ? 'one' : ''}" data-w="${who}" data-i="${i}" ${who ? '' : 'disabled'}>${val >> i & 1}</button>`).join('')}</div>
    <span class="xh">${hx(val)}</span></div>`;
  const draw = () => {
    root.innerHTML =
      row(t('fx.xa'), a, 'a') + row(t('fx.xk'), k, 'k') + '<div class="xline"><span>⊕</span></div>' + row('A ⊕ K', a ^ k, '') +
      `<p class="xnote">${t('fx.xnote')}
      <code>${hx(a ^ k)} ⊕ ${hx(k)} = ${hx(a)}</code></p>`;
    root.querySelectorAll('.xb:not([disabled])').forEach((b) => b.addEventListener('click', () => {
      const bit = 1 << +b.dataset.i;
      if (b.dataset.w === 'a') a ^= bit; else k ^= bit;
      draw();
    }));
    const res = root.querySelectorAll('.xrow')[2].querySelectorAll('.xb');
    res.forEach((b, n) => b.style.setProperty('--n', n));
  };
  draw();
  window.addEventListener('langchange', draw);
})();

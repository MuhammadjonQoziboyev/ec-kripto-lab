const { mod, invHtml, isPrime, fmtP, Curve, findG, hashHtml } = EC;
const $ = s => document.querySelector(s);
const app = $('#app');

const MODULES = {
  ecdsa: {
    title: 'ECDSA', full: 'Elliptic Curve Digital Signature Algorithm', tag: 'ANSI X9.62 · FIPS 186',
    desc: 'Elliptik egri chiziqdagi raqamli imzo: kalit yaratish, imzolash va tekshirish.',
    icon: '<svg viewBox="0 0 48 48"><path d="M6 34c8-2 10-20 18-20s10 18 18 20" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="14" r="4" fill="currentColor"/><path d="M30 38l4 4 8-10" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    defaults: { p: 97, a: 3, b: 2, d: 17, k: 29, msg: 'SALOM' }
  },
  gost: {
    title: 'ГОСТ 34.10/34.11-2018', full: 'Davlat standarti: EC imzo + xesh', tag: 'GOST R 34.10-2018 · 34.11-2018',
    desc: 'Xesh (34.11) asosida e hisoblanadi, imzo (34.10) sxemasi bo‘yicha r, s topiladi va tekshiriladi.',
    icon: '<svg viewBox="0 0 48 48"><path d="M24 4l16 6v12c0 11-7 18-16 22C15 40 8 33 8 22V10z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M17 24l5 5 9-11" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    defaults: { p: 89, a: 2, b: 5, d: 23, k: 41, msg: 'XABAR' }
  },
  elgamal: {
    title: 'EC ElGamal', full: 'Elliptik egri chiziqli ElGamal shifrlash', tag: 'Ochiq kalitli shifrlash',
    desc: 'Belgilarni nuqtalarga akslantirish jadvali, shifrlash (C₁, C₂) va deshifrlash.',
    icon: '<svg viewBox="0 0 48 48"><rect x="10" y="20" width="28" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 20v-6a8 8 0 0116 0v6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="31" r="3" fill="currentColor"/></svg>',
    defaults: { p: 71, a: 1, b: 1, nb: 13, k: 7, msg: 'KRIPTO' }
  },
  ecc: {
    title: 'Elliptik egri chiziqlar', full: 'E(F_p) ustida arifmetika: tekshiruvlar, qo‘shish, ikkilantirish, tartiblar', tag: 'y² ≡ x³ + ax + b (mod p)',
    desc: 'p tubligi, singulyarlik, nuqta egri chiziqdami, P+Q, 2P, k·P, #E va ord(P) — har bir hisob alohida.',
    icon: '<svg viewBox="0 0 48 48"><path d="M8 40C14 30 14 18 24 18s10 12 16 22M24 18c-6 0-8-6-8-10" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="14" cy="31" r="3.5" fill="currentColor"/><circle cx="34" cy="31" r="3.5" fill="currentColor"/><path d="M14 31h20" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/></svg>',
    defaults: { p: 17, a: 2, b: 2, P: '5, 1', Q: '6, 3', k: 9 }
  },
  dh: {
    title: 'DH va ECDH', full: 'Diffie–Hellman va elliptik egri chiziqli Diffie–Hellman kalit almashish protokollari', tag: 'Kalit kelishuvi · RFC 7748 · SP 800-56A',
    desc: 'Parametrlar tahlili, ochiq kalitlar almashinuvi, umumiy sir, tinglovchi va «o‘rtadagi odam» hujumlari, DH va ECDH taqqoslash.',
    icon: '<svg viewBox="0 0 48 48"><circle cx="10" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 19h16M28 15l4 4-4 4M32 29H16M20 25l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="40" r="3.5" fill="currentColor"/><path d="M24 36v-4" stroke="currentColor" stroke-width="2.4"/></svg>',
    defaults: { p: 23, g: 5, xa: 6, xb: 15, m: 9, ep: 17, ea: 2, eb: 2, G: '5, 1', da: 3, db: 7 },
    presets: [
      ['Klassik misol', { p: 23, g: 5, xa: 6, xb: 15, m: 9, ep: 17, ea: 2, eb: 2, G: '5, 1', da: 3, db: 7 }],
      ['Xavfsiz tub p = 2027', { p: 2027, g: 2, xa: 777, xb: 1500, m: 404, ep: 97, ea: 3, eb: 2, G: '', da: 11, db: 29 }],
      ['g generator emas', { p: 23, g: 2, xa: 6, xb: 15, m: 9, ep: 17, ea: 2, eb: 3, G: '16, 0', da: 4, db: 9 }],
      ['Xato kiritmalar', { p: 21, g: 5, xa: 6, xb: 15, m: 9, ep: 17, ea: 2, eb: 2, G: '5, 2', da: 0, db: 7 }]
    ]
  }
};

// Alohida sahifali modullar (Kripto Lab'dan ko'chirilgan, o'z papkasida ishlaydi)
const PAGES = {
  aes: {
    title: 'AES', href: 'aes/', full: 'Advanced Encryption Standard',
    desc: '128-bitli blok, SubBytes, ShiftRows, MixColumns va AddRoundKey raundlari.',
    icon: '<svg viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M8 19h32M8 29h32M19 8v32M29 8v32" stroke="currentColor" stroke-width="2"/><rect x="19" y="19" width="10" height="10" fill="currentColor"/></svg>'
  },
  sha256: {
    title: 'SHA-256', href: 'sha256/', full: 'Secure Hash Algorithm 256',
    desc: 'Xabarni to‘ldirish, 64 raund va 256-bitli xesh hosil bo‘lishi.',
    icon: '<svg viewBox="0 0 48 48"><path d="M18 6l-4 36M34 6l-4 36M8 17h34M6 31h34" fill="none" stroke="currentColor" stroke-width="3"/></svg>'
  },
  kuznechik: {
    title: 'Kuznechik', href: 'kuznechik/', full: 'GOST R 34.12-2015 blokli shifri',
    desc: 'S-box, L-almashtirish va 10 raundli rus standart blokli shifri.',
    icon: '<svg viewBox="0 0 48 48"><path d="M10 10h6v12l12-12h9L23 24l14 14h-9L16 26v12h-6z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
  }
};

function route() {
  const h = location.hash.slice(1);
  document.body.className = MODULES[h] ? 'theme-' + h : 'theme-home';
  MODULES[h] ? renderModule(h) : renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

function renderHome() {
  app.innerHTML = `
  <div class="hbar"><span class="hlogo">XOR</span><span class="hsep"></span><span class="hsub">zamonaviy kriptografiya modullari</span></div>
  <svg class="hcurve" viewBox="0 0 600 600" aria-hidden="true"><path d="M330 40C250 150 150 220 150 300s100 150 180 260M150 300c-40-60-90-80-130-60s-30 100 10 120 80-10 120-60"/></svg>
  <main class="tiles">
    <div class="brand"><b>SHIFR</b><span>Zamonaviy kriptografiya<br>laboratoriyasi</span></div>
    ${Object.entries(MODULES).map(([k, m]) => `
      <a class="tile tile-${k}" href="#${k}" title="${m.full}. ${m.desc}">
        <div class="tile-ico">${m.icon}</div>
        <h2>${m.title}</h2>
      </a>`).join('')}
    ${Object.entries(PAGES).map(([k, m]) => `
      <a class="tile tile-${k}" href="${m.href}" title="${m.full}. ${m.desc}">
        <div class="tile-ico">${m.icon}</div>
        <h2>${m.title}</h2>
      </a>`).join('')}
  </main>`;
}

function field(id, label, val, type = 'number') {
  return `<label class="fld"><span>${label}</span><input id="f-${id}" type="${type}" value="${val}"></label>`;
}

function renderModule(key) {
  const m = MODULES[key], d = m.defaults;
  const extra = key === 'dh' ? '' : key === 'ecc'
    ? field('P', 'Nuqta P (x, y)', d.P, 'text') + field('Q', 'Nuqta Q (x, y)', d.Q, 'text') + field('k', 'Skalyar k', d.k)
    : key === 'elgamal'
    ? field('nb', 'Maxfiy kalit n<sub>B</sub>', d.nb) + field('k', 'Tasodifiy k (boshlang‘ich)', d.k) + field('msg', 'Ochiq matn (A–Z, 0–9, ␣)', d.msg, 'text')
    : field('d', 'Maxfiy kalit d', d.d) + field('k', 'Tasodifiy k', d.k) + field('msg', 'Xabar M', d.msg, 'text');
  app.innerHTML = `
  <div class="frame">
  <nav class="top">
    <a href="#" class="back">← Modullar</a><button class="ptog" id="ptog" title="Parametrlar">⚙</button>
    <div class="mhead"><div class="mico">${m.icon}</div><div><h1>${m.title}</h1><p>${m.full}</p></div></div>
    <div class="modes"><button class="seg on" data-mode="step">Bitta qadam</button><button class="seg" data-mode="all">To‘liq jarayon</button></div>
  </nav>
  <section class="params">
    <div class="grid${key === 'dh' ? ' dhgrid' : ''}">
      ${key === 'dh' ? `<div class="presets"><span>Misollar:</span>${m.presets.map(([n], i) => `<button class="pre" data-i="${i}">${n}</button>`).join('')}</div>
      <div class="fgs"><fieldset class="fg"><legend>Diffie–Hellman · Z<sub>p</sub>*</legend><div class="fgg" style="--c:5">
      ${field('p', 'p (tub)', d.p)}${field('g', 'Generator g', d.g)}${field('xa', 'Alice: a', d.xa)}${field('xb', 'Bob: b', d.xb)}${field('m', 'Mallory: m', d.m)}</div></fieldset>
      <fieldset class="fg"><legend>ECDH · y² ≡ x³ + ax + b (mod p)</legend><div class="fgg" style="--c:6">
      ${field('ep', 'p (tub)', d.ep)}${field('ea', 'a', d.ea)}${field('eb', 'b', d.eb)}${field('G', 'G (bo‘sh = avto)', d.G, 'text')}${field('da', 'Alice: d<sub>A</sub>', d.da)}${field('db', 'Bob: d<sub>B</sub>', d.db)}</div></fieldset></div>`
      : `${field('p', 'Modul p (tub)', d.p)}${field('a', 'a', d.a)}${field('b', 'b', d.b)}
      ${extra}`}
    </div>
    <button id="run" class="btn">Hisoblash</button>
  </section>
  <div id="err" class="err"></div>
  <div id="pipe" class="pipe"></div>
  <section id="steps" class="steps"></section>
  <div class="bar">
    <div class="ctrl">
      <button class="btn ghost" id="prev" title="← (bitta amal orqaga)">◀ Oldingi</button>
      <button class="btn play" id="play" title="Space">▶ Avto</button>
      <button class="btn ghost" id="next" title="→ (bitta amal oldinga)">Keyingi ▶</button>
    </div>
    <input type="range" id="scrub" min="0" value="0" class="scrub">
    <span id="count"></span>
    <div class="speeds">Tezlik ${[0.5, 1, 2, 4, 10].map(s => `<button class="sp ${s === 1 ? 'on' : ''}" data-s="${s}">${s === 0.5 ? '½' : s}×</button>`).join('')}</div>
  </div>
  </div>`;
  let mode = 'step', steps = [], units = [], uStep = [], stepRange = [], g = 0, playing = false, timer = null, speed = 1;
  const UNITS = 'div.sub, div.f, div.res, div.warn, tr, details, .chip, .cell, .keys, .sig, .verdict, svg.plot, .ct, .xchg';
  const frame = $('#steps');

  // g — butun jarayondagi joriy amal raqami; 0..g gacha bo'lganlar ko'rinadi
  function setPos(ng, follow = true) {
    if (!units.length) return;
    g = Math.max(0, Math.min(units.length - 1, ng));
    const cs = uStep[g];
    units.forEach((u, i) => { u.classList.toggle('hid', i > g); u.classList.remove('now'); });
    const cur = units[g];
    cur.classList.add('now');
    let p = cur.parentElement; while (p && p !== frame) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
    document.querySelectorAll('.step').forEach((el, j) => el.style.display = (mode === 'all' ? j <= cs : j === cs) ? '' : 'none');
    document.querySelectorAll('.pipe a').forEach((el, j) => {
      const [a, b] = stepRange[j], f = g >= b ? 1 : g < a ? 0 : (g - a + 1) / (b - a + 1);
      el.classList.toggle('on', j === cs); el.classList.toggle('done', g >= b);
      el.querySelector('i').style.width = (f * 100) + '%';
    });
    const pa = $('.pipe a.on'), pp = $('#pipe');
    if (pa) pp.scrollLeft = pa.offsetLeft - pp.clientWidth / 2 + pa.clientWidth / 2;
    $('#scrub').max = units.length - 1; $('#scrub').value = g;
    $('#count').textContent = `${g + 1} / ${units.length}`;
    $('#prev').disabled = g === 0; $('#next').disabled = g === units.length - 1;
    if (follow) {
      const r = cur.getBoundingClientRect(), fr = frame.getBoundingClientRect();
      frame.scrollTo({ top: frame.scrollTop + r.top - fr.top - fr.height / 2 + r.height / 2, behavior: playing && speed <= 2 ? 'smooth' : 'instant' });
    }
  }
  const delay = () => {
    const u = units[g], light = u.tagName === 'TR' || u.classList.contains('chip') || u.classList.contains('cell');
    const stepEnd = stepRange[uStep[g]][1] === g;
    return (stepEnd ? 1600 : light ? 260 : 800) / speed;
  };
  function tick() { if (!playing) return; if (g >= units.length - 1) return stop(); setPos(g + 1); timer = setTimeout(tick, delay()); }
  function stop() { playing = false; clearTimeout(timer); $('#play').textContent = '▶ Avto'; $('#play').classList.remove('on'); }
  function play() {
    if (playing) return stop();
    if (g >= units.length - 1) setPos(0);
    playing = true; $('#play').textContent = '❚❚ Pauza'; $('#play').classList.add('on');
    timer = setTimeout(tick, delay());
  }
  $('#play').onclick = play;
  $('#ptog').onclick = () => $('.frame').classList.toggle('showp');
  $('#prev').onclick = () => { stop(); setPos(g - 1); };
  $('#next').onclick = () => { stop(); setPos(g + 1); };
  $('#scrub').oninput = e => { stop(); setPos(+e.target.value); };
  document.querySelectorAll('.sp').forEach(b => b.onclick = () => { document.querySelectorAll('.sp').forEach(x => x.classList.remove('on')); b.classList.add('on'); speed = +b.dataset.s; });
  document.querySelectorAll('.seg').forEach(b => b.onclick = () => {
    document.querySelectorAll('.seg').forEach(x => x.classList.remove('on')); b.classList.add('on'); mode = b.dataset.mode; setPos(g);
  });
  document.onkeydown = e => {
    if (!location.hash || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); setPos(g + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); setPos(g - 1); }
    else if (e.key === ' ') { e.preventDefault(); play(); }
  };
  const run = () => {
    stop();
    $('#err').textContent = '';
    try {
      const v = id => $('#f-' + id).value;
      if (key === 'dh') steps = runDH(v);
      else {
        const p = +v('p'), a = +v('a'), b = +v('b');
        if ([p, a, b].some(x => !Number.isInteger(x))) throw 'p, a, b butun son bo‘lishi kerak.';
        if (p > 2000 || p < 2) throw 'p 2 dan 2000 gacha bo‘lishi kerak (o‘quv rejimi, barcha nuqtalar sanaladi).';
        if (key !== 'ecc' && !isPrime(p)) throw `p = ${p} tub son emas.`;
        steps = ({ ecdsa: runECDSA, gost: runGOST, elgamal: runElGamal, ecc: runECC })[key](p, a, b, v);
      }
      if (steps.warn?.length) $('#err').innerHTML = steps.warn.map(w => '⚠ ' + w).join('<br>');
    } catch (e) { $('#err').textContent = '⚠ ' + (e.message || e); steps = []; }
    frame.innerHTML = steps.map((s, i) => `<article class="step" id="s${i}"><div class="shead"><span class="snum">${i + 1}</span><div><div class="sphase">${s.phase}</div><h2>${s.title}</h2></div></div><div class="sbody">${s.html}</div></article>`).join('');
    $('#pipe').innerHTML = steps.map((s, i) => `<a data-i="${i}"><b><span>${i + 1}</span>${s.title}</b><em>${s.phase}</em><i></i></a>`).join('<s>▸</s>');
    units = []; uStep = []; stepRange = [];
    document.querySelectorAll('.step').forEach((st, j) => {
      const a = units.length;
      [...st.querySelectorAll(UNITS)].forEach(u => { units.push(u); uStep.push(j); });
      stepRange.push([a, units.length - 1]);
    });
    document.querySelectorAll('.pipe a').forEach(el => el.onclick = () => { stop(); setPos(stepRange[+el.dataset.i][1], false); frame.scrollTop = 0; });
    if (units.length) { setPos(stepRange[0][1], false); frame.scrollTop = 0; }
  };
  $('#run').onclick = run;
  document.querySelectorAll('.pre').forEach(bt => bt.onclick = () => {
    const o = m.presets[+bt.dataset.i][1];
    for (const k in o) $('#f-' + k).value = o[k];
    run();
    document.querySelectorAll('.pre').forEach(x => x.classList.toggle('on', x === bt));
  });
  document.querySelectorAll('.params input').forEach(i => i.addEventListener('input', () => document.querySelectorAll('.pre').forEach(x => x.classList.remove('on'))));
  run();
}

// ---------- Umumiy qadamlar ----------
function curveSteps(p, a, b) {
  const c = new Curve(a, b, p);
  const disc = mod(4 * a ** 3 + 27 * b * b, p);
  if (disc === 0) throw 'Egri chiziq singulyar: 4a³ + 27b² ≡ 0 (mod p). Boshqa a, b tanlang.';
  const s1 = { phase: 'Domen parametrlari', title: 'Egri chiziqni aniqlash', html: `
    <div class="f big">E: y² ≡ x³ + ${a}x + ${b} (mod ${p})</div>
    <div class="sub">p = ${p} tub son ✔ (${p} ni √${p} ≈ ${Math.sqrt(p).toFixed(2)} gacha bo‘luvchilari yo‘q)</div>
    <div class="sub">Singulyar emaslik sharti: Δ = 4a³ + 27b² ≢ 0 (mod p)</div>
    <div class="f">4·${a}³ + 27·${b}² = ${4 * a ** 3} + ${27 * b * b} = ${4 * a ** 3 + 27 * b * b} ≡ <b>${disc}</b> (mod ${p}) ≠ 0 ✔</div>` };
  const g = findG(c);
  if (!g.G || g.n < 5) throw 'Yetarli katta tub tartibli nuqta topilmadi. Boshqa parametrlar tanlang.';
  const s2 = { phase: 'Domen parametrlari', title: 'Nuqtalarni sanash va G (generator) ni topish', html: g.html + plot(c, g) };
  return { c, g, steps: [s1, s2] };
}

function plot(c, g) {
  const p = c.p, S = 340, k = S / p;
  const sub = new Set(g.multiples.filter(m => m[1]).map(m => m[1] + ''));
  let s = `<div class="sub">Egri chiziq nuqtalari grafigi (to‘q — ⟨G⟩ kichik guruhi, halqa — G)</div><svg class="plot" viewBox="-14 -6 ${S + 22} ${S + 22}">
  <rect x="0" y="0" width="${S}" height="${S}" class="pbg"/>`;
  g.pts.forEach(P => s += `<circle cx="${P[0] * k + k / 2}" cy="${S - P[1] * k - k / 2}" r="${Math.max(2, k / 2.4)}" class="${sub.has(P + '') ? 'pin' : 'pout'}"><title>${fmtP(P)}</title></circle>`);
  s += `<circle cx="${g.G[0] * k + k / 2}" cy="${S - g.G[1] * k - k / 2}" r="${Math.max(6, k)}" class="pG"/>
  <text x="0" y="${S + 13}" class="pt">0</text><text x="${S - 16}" y="${S + 13}" class="pt">${p - 1}</text><text x="-12" y="8" class="pt">y</text></svg>`;
  return s;
}

const fmtSecret = (x, n, name) => { const v = mod(x, n); return v === 0 ? 1 : v; };

// ---------- ECDSA ----------
function runECDSA(p, a, b, v) {
  const { c, g, steps } = curveSteps(p, a, b);
  const { G, n } = g;
  let d = mod(+v('d'), n) || 1, k = mod(+v('k'), n) || 1;
  const msg = v('msg');
  const Q = c.mul(d, G, 'G');
  steps.push({ phase: 'Kalit yaratish', title: 'Ochiq kalit Q = d·G', html: `
    <div class="f">Maxfiy kalit: d ∈ [1, n−1] = [1, ${n - 1}] ⇒ <b>d = ${d}</b></div>${Q.html}
    <div class="keys"><div><span>Maxfiy</span>d = ${d}</div><div><span>Ochiq</span>Q = ${fmtP(Q.R)}</div></div>` });
  const H = hashHtml(msg, n, `M = "${msg}" xabarining xeshi (o‘quv uchun soddalashtirilgan; amalda SHA-256)`);
  const e = H.e;
  steps.push({ phase: 'Imzolash', title: 'Xabar xeshi e = H(M) mod n', html: H.html + `<div class="res">e = ${H.full} mod ${n} = <b>${e}</b></div>` });
  // r, s (0 bo'lsa k ni o'zgartiramiz)
  let R, r, s, kinv, note = '';
  for (let t = 0; t < n; t++) {
    R = c.mul(k, G, 'G'); r = mod(R.R[0], n);
    const ki = invHtml(k, n); kinv = ki; s = mod(ki.val * (e + d * r), n);
    if (r !== 0 && s !== 0) break;
    note += `<div class="warn">k = ${k} da r yoki s = 0 chiqdi ⇒ k = ${k + 1} olinadi</div>`; k = mod(k + 1, n) || 1;
  }
  steps.push({ phase: 'Imzolash', title: 'Tasodifiy k va R = k·G', html: note + `<div class="f">k ∈ [1, ${n - 1}] ⇒ <b>k = ${k}</b></div>${R.html}
    <div class="f">r = x<sub>R</sub> mod n = ${R.R[0]} mod ${n} = <b>${r}</b> ${r ? '≠ 0 ✔' : ''}</div>` });
  steps.push({ phase: 'Imzolash', title: 's = k⁻¹(e + d·r) mod n', html: kinv.html + `
    <div class="f">s = ${kinv.val}·(${e} + ${d}·${r}) mod ${n} = ${kinv.val}·${e + d * r} mod ${n} = ${kinv.val * (e + d * r)} mod ${n} = <b>${s}</b></div>
    <div class="sig">Imzo: (r, s) = (<b>${r}</b>, <b>${s}</b>)</div>` });
  // Tekshirish
  const w = invHtml(s, n), u1 = mod(e * w.val, n), u2 = mod(r * w.val, n);
  steps.push({ phase: 'Tekshirish', title: 'w = s⁻¹, u₁ = e·w, u₂ = r·w', html: `<div class="f">1 ≤ r, s ≤ n−1 ✔</div>${w.html}
    <div class="f">u₁ = e·w mod n = ${e}·${w.val} mod ${n} = <b>${u1}</b></div>
    <div class="f">u₂ = r·w mod n = ${r}·${w.val} mod ${n} = <b>${u2}</b></div>` });
  const A = c.mul(u1, G, 'G'), B = c.mul(u2, Q.R, 'Q'), X = c.add(A.R, B.R);
  steps.push({ phase: 'Tekshirish', title: 'X = u₁·G + u₂·Q', html: `
    <details open><summary>u₁·G = ${u1}·G = <b>${fmtP(A.R)}</b></summary>${A.html}</details>
    <details open><summary>u₂·Q = ${u2}·Q = <b>${fmtP(B.R)}</b></summary>${B.html}</details>
    <div class="sub">Yig‘indi:</div>${X.html}` });
  const vv = X.R ? mod(X.R[0], n) : null, ok = vv === r;
  steps.push({ phase: 'Natija', title: 'v = xₓ mod n va r bilan solishtirish', html: `
    <div class="f">v = ${X.R ? X.R[0] : '—'} mod ${n} = <b>${vv}</b>, r = <b>${r}</b></div>
    <div class="verdict ${ok ? 'good' : 'bad'}">${ok ? '✔ v = r — imzo HAQIQIY' : '✘ v ≠ r — imzo noto‘g‘ri'}</div>
    <div class="sub">Nima uchun ishlaydi: u₁G + u₂Q = (e·w)G + (r·w)dG = w(e + rd)G = kG = R</div>` });
  return steps;
}

// ---------- GOST R 34.10-2018 (+34.11 xesh) ----------
function runGOST(p, a, b, v) {
  const { c, g, steps } = curveSteps(p, a, b);
  const { G: P, n: q } = g;
  steps[1].html = steps[1].html.replace(/G = <b>/, 'P (bazaviy nuqta) = G = <b>');
  let d = mod(+v('d'), q) || 1, k = mod(+v('k'), q) || 1;
  const msg = v('msg');
  const Q = c.mul(d, P, 'P');
  steps.push({ phase: 'Kalitlar', title: 'Imzo kaliti d va tekshirish kaliti Q = d·P', html: `
    <div class="f">0 &lt; d &lt; q = ${q} ⇒ <b>d = ${d}</b></div>${Q.html}
    <div class="keys"><div><span>Imzo kaliti</span>d = ${d}</div><div><span>Tekshirish kaliti</span>Q = ${fmtP(Q.R)}</div></div>` });
  const H = hashHtml(msg, q, `1-qadam (34.11-2018): h = H(M). Haqiqiy “Стрибог” 256/512-bit; bu yerda o‘quv uchun soddalashtirilgan xesh`);
  const alpha = H.full; let e = mod(alpha, q), en = '';
  if (e === 0) { e = 1; en = ' ⇒ e = 0 bo‘lgani uchun e = 1 olinadi'; }
  steps.push({ phase: 'Imzo shakllantirish', title: 'h = H(M), α — h ning butun soni, e = α mod q', html: H.html + `
    <div class="f">α = ${alpha}</div><div class="res">e = α mod q = ${alpha} mod ${q} = <b>${e}</b>${en}</div>` });
  let C, r, s, note = '';
  for (let t = 0; t < q; t++) {
    C = c.mul(k, P, 'P'); r = mod(C.R[0], q); s = mod(r * d + k * e, q);
    if (r && s) break; note += `<div class="warn">k = ${k}: r yoki s = 0 ⇒ yangi k = ${k + 1}</div>`; k = mod(k + 1, q) || 1;
  }
  steps.push({ phase: 'Imzo shakllantirish', title: 'Tasodifiy k, C = k·P, r = x_C mod q', html: note + `<div class="f">0 &lt; k &lt; q ⇒ <b>k = ${k}</b></div>${C.html}
    <div class="f">r = x<sub>C</sub> mod q = ${C.R[0]} mod ${q} = <b>${r}</b> ≠ 0 ✔</div>` });
  steps.push({ phase: 'Imzo shakllantirish', title: 's = (r·d + k·e) mod q', html: `
    <div class="f">s = (${r}·${d} + ${k}·${e}) mod ${q} = (${r * d} + ${k * e}) mod ${q} = ${r * d + k * e} mod ${q} = <b>${s}</b> ≠ 0 ✔</div>
    <div class="f">Imzo vektori ζ = (r̄ ‖ s̄): r = ${r} = ${r.toString(2).padStart(q.toString(2).length, '0')}₂, s = ${s} = ${s.toString(2).padStart(q.toString(2).length, '0')}₂</div>
    <div class="sig">ζ = (r, s) = (<b>${r}</b>, <b>${s}</b>)</div>` });
  const ev = invHtml(e, q), vI = ev.val, z1 = mod(s * vI, q), z2 = mod(-r * vI, q);
  steps.push({ phase: 'Imzoni tekshirish', title: 'e ni qayta hisoblash, v = e⁻¹ mod q, z₁, z₂', html: `
    <div class="f">0 &lt; r, s &lt; q ✔ &nbsp; h = H(M), e = ${e}</div>${ev.html}
    <div class="f">z₁ = s·v mod q = ${s}·${vI} mod ${q} = <b>${z1}</b></div>
    <div class="f">z₂ = −r·v mod q = −${r}·${vI} mod ${q} = ${-r * vI} mod ${q} = <b>${z2}</b></div>` });
  const A = c.mul(z1, P, 'P'), B = c.mul(z2, Q.R, 'Q'), CC = c.add(A.R, B.R);
  steps.push({ phase: 'Imzoni tekshirish', title: 'C = z₁·P + z₂·Q', html: `
    <details open><summary>z₁·P = ${z1}·P = <b>${fmtP(A.R)}</b></summary>${A.html}</details>
    <details open><summary>z₂·Q = ${z2}·Q = <b>${fmtP(B.R)}</b></summary>${B.html}</details><div class="sub">Yig‘indi:</div>${CC.html}` });
  const R = CC.R ? mod(CC.R[0], q) : null, ok = R === r;
  steps.push({ phase: 'Natija', title: 'R = x_C mod q, R = r ?', html: `
    <div class="f">R = ${CC.R ? CC.R[0] : '—'} mod ${q} = <b>${R}</b>, r = <b>${r}</b></div>
    <div class="verdict ${ok ? 'good' : 'bad'}">${ok ? '✔ R = r — imzo QABUL QILINADI' : '✘ R ≠ r — imzo rad etiladi'}</div>
    <div class="sub">Isbot: z₁P + z₂Q = s·e⁻¹·P − r·e⁻¹·dP = e⁻¹(s − rd)P = e⁻¹·ke·P = kP = C</div>
    <div class="sub">ECDSA dan farqi: s = rd + ke (teskari k kerak emas), tekshirishda e⁻¹ ishlatiladi.</div>` });
  return steps;
}

// ---------- EC ElGamal ----------
const ALPHA = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function runElGamal(p, a, b, v) {
  const { c, g, steps } = curveSteps(p, a, b);
  const { G, n } = g;
  const msg = v('msg').toUpperCase();
  const size = Math.min(ALPHA.length, n - 1);
  const alpha = ALPHA.slice(0, size);
  for (const ch of msg) if (!alpha.includes(ch)) throw `“${ch}” belgisi jadvalda yo‘q (n = ${n} bo‘lgani uchun faqat ${size} ta belgi akslantiriladi).`;
  const table = {}, rev = {};
  let tb = `<div class="sub">Akslantirish qoidasi: i-belgi → P<sub>i</sub> = i·G (i = 1 … ${size}). n = ${n} &gt; ${size} bo‘lgani uchun barcha nuqtalar turli ✔</div><div class="map">`;
  let Pi = null;
  for (let i = 1; i <= size; i++) {
    Pi = c.add(Pi, G, false).R; const ch = alpha[i - 1]; table[ch] = Pi; rev[Pi + ''] = ch;
    tb += `<div class="cell ${msg.includes(ch) ? 'use' : ''}"><b>${ch === ' ' ? '␣' : ch}</b><i>${i}G</i><span>${fmtP(Pi)}</span></div>`;
  }
  tb += `</div>`;
  steps.push({ phase: 'Tayyorgarlik', title: 'Belgilarni nuqtalarga akslantiruvchi jadval', html: tb });
  const nb = mod(+v('nb'), n) || 1;
  const Pb = c.mul(nb, G, 'G');
  steps.push({ phase: 'Kalit yaratish', title: 'B tomonning kalitlari: P_B = n_B·G', html: `<div class="f">Maxfiy kalit n<sub>B</sub> = <b>${nb}</b></div>${Pb.html}
    <div class="keys"><div><span>Maxfiy</span>n<sub>B</sub> = ${nb}</div><div><span>Ochiq</span>P<sub>B</sub> = ${fmtP(Pb.R)}</div></div>` });
  steps.push({ phase: 'Kodlash', title: 'Ochiq matnni nuqtalarga aylantirish', html: `<div class="f big">M = "${msg}"</div><div class="map">` +
    [...msg].map(ch => `<div class="cell use"><b>${ch === ' ' ? '␣' : ch}</b><i>${alpha.indexOf(ch) + 1}G</i><span>${fmtP(table[ch])}</span></div>`).join('') + `</div>` });
  const k0 = +v('k');
  const cts = [];
  let enc = `<div class="sub">Har bir belgi uchun alohida tasodifiy k<sub>i</sub> olinadi (bu yerda k<sub>i</sub> = k + i). C₁ = k·G, C₂ = P<sub>m</sub> + k·P<sub>B</sub></div>`;
  [...msg].forEach((ch, i) => {
    const k = mod(k0 + i, n) || 1, Pm = table[ch];
    const C1 = c.mul(k, G, 'G'), kPb = c.mul(k, Pb.R, 'P_B'), C2 = c.add(Pm, kPb.R);
    cts.push({ ch, k, C1: C1.R, C2: C2.R });
    enc += `<details class="enc"><summary><b>'${ch === ' ' ? '␣' : ch}'</b> → P<sub>m</sub> = ${fmtP(Pm)}, k = ${k} ⇒ C = { ${fmtP(C1.R)}, ${fmtP(C2.R)} }</summary>
      <div class="sub">C₁ = ${k}·G</div>${C1.html}<div class="sub">k·P<sub>B</sub> = ${k}·${fmtP(Pb.R)}</div>${kPb.html}
      <div class="sub">C₂ = P<sub>m</sub> + k·P<sub>B</sub></div>${C2.html}</details>`;
  });
  enc += `<div class="sub">Shifrmatn:</div><div class="ct">${cts.map(t => `{${fmtP(t.C1)}, ${fmtP(t.C2)}}`).join(' ')}</div>`;
  steps.push({ phase: 'Shifrlash', title: 'Har bir belgini shifrlash (C₁, C₂)', html: enc });
  let dec = `<div class="sub">B tomon: P<sub>m</sub> = C₂ − n<sub>B</sub>·C₁ (ayirish = qarama-qarshi nuqtani qo‘shish: −(x, y) = (x, −y mod p))</div>`, out = '';
  cts.forEach(t => {
    const S = c.mul(nb, t.C1, 'C₁'), negS = c.neg(S.R), M = c.add(t.C2, negS), ch = rev[M.R + ''] ?? '?'; out += ch;
    dec += `<details class="enc"><summary>{${fmtP(t.C1)}, ${fmtP(t.C2)}} → ${fmtP(M.R)} → <b>'${ch === ' ' ? '␣' : ch}'</b></summary>
      <div class="sub">n<sub>B</sub>·C₁ = ${nb}·${fmtP(t.C1)}</div>${S.html}
      <div class="f">−n<sub>B</sub>C₁ = ${fmtP(negS)}</div><div class="sub">C₂ + (−n<sub>B</sub>C₁)</div>${M.html}
      <div class="f">Jadvaldan: ${fmtP(M.R)} → '${ch}'</div></details>`;
  });
  const ok = out === msg;
  dec += `<div class="verdict ${ok ? 'good' : 'bad'}">Deshifrlangan matn: "${out}" ${ok ? '✔ asl matnga teng' : '✘'}</div>
    <div class="sub">Isbot: C₂ − n<sub>B</sub>C₁ = P<sub>m</sub> + k·n<sub>B</sub>G − n<sub>B</sub>·kG = P<sub>m</sub></div>`;
  steps.push({ phase: 'Deshifrlash', title: 'Nuqtalarni tiklash va jadval orqali belgilarga qaytarish', html: dec });
  return steps;
}

// ---------- Elliptik egri chiziqlar (arifmetika moduli) ----------
function parsePt(s) {
  const m = String(s).trim().match(/^\(?\s*(-?\d+)\s*[,;\s]\s*(-?\d+)\s*\)?$/);
  return m ? [+m[1], +m[2]] : null;
}
function plotMarks(c, pts, marks) {
  const p = c.p, S = 340, k = S / p, X = x => x * k + k / 2, Y = y => S - y * k - k / 2;
  let s = `<div class="sub">E(F<sub>${p}</sub>) nuqtalari grafigi</div><svg class="plot" viewBox="-14 -6 ${S + 30} ${S + 22}"><rect x="0" y="0" width="${S}" height="${S}" class="pbg"/>`;
  pts.forEach(P => s += `<circle cx="${X(P[0])}" cy="${Y(P[1])}" r="${Math.max(2, k / 2.6)}" class="pin"><title>${fmtP(P)}</title></circle>`);
  marks.filter(m => m.P).forEach(m => s += `<circle cx="${X(m.P[0])}" cy="${Y(m.P[1])}" r="${Math.max(6, k * .9)}" class="mk ${m.cls}"/><text x="${X(m.P[0]) + Math.max(7, k)}" y="${Y(m.P[1]) - 4}" class="mkt ${m.cls}">${m.label}</text>`);
  return s + `<text x="0" y="${S + 13}" class="pt">0</text><text x="${S - 16}" y="${S + 13}" class="pt">${p - 1}</text></svg>
    <div class="legend">${marks.filter(m => m.P).map(m => `<span class="${m.cls}">● ${m.label} = ${fmtP(m.P)}</span>`).join('')}</div>`;
}

function runECC(p, a, b, v) {
  const steps = [], warn = []; steps.warn = warn;
  // 1) p tubligi
  const sq = Math.floor(Math.sqrt(p));
  let h = `<div class="f big">p = ${p}</div><div class="sub">Sinov bo‘lish usuli: p ni 2 dan ⌊√p⌋ = ${sq} gacha bo‘lgan sonlarga bo‘lib ko‘ramiz. Birortasiga qoldiqsiz bo‘linsa — p murakkab.</div><div class="chips">`;
  let div = null;
  for (let i = 2; i <= sq; i++) { const r = p % i; h += `<span class="chip ${r === 0 ? 'inf' : ''}">${p} mod ${i} = ${r}</span>`; if (!r) { div = i; break; } }
  h += `</div>`;
  if (div) {
    h += `<div class="verdict bad">✘ ${p} = ${div} · ${p / div} — tub son emas. F<sub>p</sub> maydon bo‘lmaydi (masalan, ${div} ning teskarisi mavjud emas).</div>`;
    warn.push(`p = ${p} tub son emas (${p} = ${div}·${p / div}). Hisoblash to‘xtatildi — tub p kiriting (masalan 17, 97, 101).`);
    steps.push({ phase: 'Tekshiruv', title: 'p tub sonmi?', html: h }); return steps;
  }
  if (p <= 3) {
    h += `<div class="verdict bad">✘ p = ${p}: y² = x³ + ax + b ko‘rinishi uchun p &gt; 3 bo‘lishi kerak.</div>`;
    warn.push('p > 3 bo‘lishi kerak (2 va 3 xarakteristikada boshqa tenglama ishlatiladi).');
    steps.push({ phase: 'Tekshiruv', title: 'p tub sonmi?', html: h }); return steps;
  }
  h += `<div class="verdict good">✔ ${p} — tub son (2 … ${sq} sonlarining hech biriga bo‘linmaydi)</div>`;
  steps.push({ phase: 'Tekshiruv', title: 'p tub sonmi?', html: h });

  // 2) singulyarlik
  const A = mod(a, p), B = mod(b, p);
  const disc = mod(4 * A ** 3 + 27 * B * B, p);
  h = `${A !== a || B !== b ? `<div class="warn">a, b mod p ga keltirildi: a = ${a} ≡ ${A}, b = ${b} ≡ ${B}</div>` : ''}
    <div class="f big">E: y² ≡ x³ + ${A}x + ${B} (mod ${p})</div>
    <div class="sub">Egri chiziq singulyar bo‘lmasligi (o‘z-o‘zini kesmasligi, qaytish nuqtasi yo‘qligi) sharti: Δ = 4a³ + 27b² ≢ 0 (mod p)</div>
    <div class="f">4a³ = 4·${A}³ = ${4 * A ** 3}</div><div class="f">27b² = 27·${B}² = ${27 * B * B}</div>
    <div class="f">Δ = ${4 * A ** 3} + ${27 * B * B} = ${4 * A ** 3 + 27 * B * B} ≡ <b>${disc}</b> (mod ${p})</div>`;
  if (disc === 0) {
    h += `<div class="verdict bad">✘ Δ ≡ 0 — egri chiziq SINGULYAR. Nuqtalar guruh tashkil qilmaydi.</div>`;
    warn.push(`Egri chiziq singulyar: 4a³ + 27b² ≡ 0 (mod ${p}). Boshqa a yoki b tanlang.`);
    steps.push({ phase: 'Tekshiruv', title: 'Singulyar emasligini tekshirish', html: h }); return steps;
  }
  h += `<div class="verdict good">✔ Δ = ${disc} ≠ 0 — egri chiziq singulyar emas</div>`;
  steps.push({ phase: 'Tekshiruv', title: 'Singulyar emasligini tekshirish', html: h });

  // 3) kiritilgan nuqtalar
  const c = new Curve(A, B, p);
  const all = c.points();
  const sample = all.pts.slice(0, 8).map(fmtP).join(', ');
  const pts = {};
  h = `<div class="sub">Nuqta (x, y) egri chiziqda yotishi uchun y² mod p = x³ + ax + b mod p bo‘lishi kerak.</div>`;
  for (const name of ['P', 'Q']) {
    const raw = v(name), pt = parsePt(raw);
    if (!pt) { h += `<div class="verdict bad">✘ ${name} = “${raw}” — format noto‘g‘ri. To‘g‘ri yozilishi: 5, 1</div>`; warn.push(`${name} nuqta formati noto‘g‘ri: “${raw}”. Masalan “5, 1” ko‘rinishida kiriting.`); continue; }
    let [x, y] = pt;
    if (x < 0 || y < 0 || x >= p || y >= p) { h += `<div class="warn">${name} koordinatalari mod ${p} ga keltirildi: (${x}, ${y}) → (${mod(x, p)}, ${mod(y, p)})</div>`; x = mod(x, p); y = mod(y, p); }
    const L = mod(y * y, p), R = c.rhs(x);
    h += `<div class="sub"><b>${name} = (${x}, ${y})</b></div>
      <div class="f">chap tomon: y² = ${y}² = ${y * y} ≡ <b>${L}</b> (mod ${p})</div>
      <div class="f">o‘ng tomon: x³ + ${A}x + ${B} = ${x}³ + ${A}·${x} + ${B} = ${x ** 3 + A * x + B} ≡ <b>${R}</b> (mod ${p})</div>`;
    if (L === R) { h += `<div class="res">${L} = ${R} ⇒ ✔ ${name} egri chiziqda yotadi</div>`; pts[name] = [x, y]; }
    else { h += `<div class="verdict bad">✘ ${L} ≠ ${R} — ${name} egri chiziqda YOTMAYDI</div>`; warn.push(`${name} = (${x}, ${y}) egri chiziqda yotmaydi (${L} ≠ ${R}). Egri chiziqdagi nuqtalarga misollar: ${sample}`); }
  }
  if (Object.keys(pts).length < 2) h += `<div class="sub">Egri chiziqdagi nuqtalarga misollar: ${sample} …</div>`;
  steps.push({ phase: 'Tekshiruv', title: 'Nuqtalar egri chiziqdami?', html: h });

  const { P, Q } = pts;
  let S = null, P2 = null, KP = null, kDone = false;
  // 4) teskari element (P + Q uchun kerak bo'ladigan)
  if (P && Q) {
    const same = P[0] === Q[0] && P[1] === Q[1];
    const den = same ? mod(2 * P[1], p) : mod(Q[0] - P[0], p);
    h = `<div class="sub">P + Q da λ ni topish uchun ${same ? '2y₁' : 'x₂ − x₁'} ning mod ${p} bo‘yicha teskarisi kerak. Teskari element a⁻¹: a·a⁻¹ ≡ 1 (mod p). U kengaytirilgan Evklid algoritmi bilan topiladi: r<sub>i+1</sub> = r<sub>i−1</sub> − q·r<sub>i</sub>, t<sub>i+1</sub> = t<sub>i−1</sub> − q·t<sub>i</sub>; r = 1 bo‘lganda t — javob.</div>
      <div class="f">${same ? `2y₁ = 2·${P[1]}` : `x₂ − x₁ = ${Q[0]} − ${P[0]}`} ≡ <b>${den}</b> (mod ${p})</div>`;
    if (den === 0) {
      h += `<div class="verdict bad">✘ ${den} ≡ 0 — 0 ning teskarisi mavjud emas (EKUB(0, ${p}) = ${p} ≠ 1). Bu holda P + Q = O.</div>`;
      warn.push('P + Q hisoblashda maxraj 0 ga teng (P = −Q yoki y = 0): teskari element mavjud emas, natija cheksiz uzoqlikdagi nuqta O.');
    } else h += EC.invHtml(den, p).html;
    steps.push({ phase: 'Asosiy amallar', title: 'Teskari element (Evklid)', html: h });

    // 5) P + Q
    const r = c.add(P, Q);
    S = r.R;
    h = `<div class="sub">Funksiya: ${same ? '<code>double(P)</code> — P = Q bo‘lgani uchun ikkilantirish chaqirildi' : '<code>addDistinct(P, Q)</code> — ikki turli nuqtani qo‘shish'}</div>
      <div class="f">P = ${fmtP(P)}, Q = ${fmtP(Q)}</div>${r.html}`;
    if (S) h += `<div class="f">Tekshiruv: ${fmtP(S)} egri chiziqda? ${S[1]}² mod ${p} = ${mod(S[1] * S[1], p)}, x³+${A}x+${B} mod ${p} = ${c.rhs(S[0])} ${c.on(S) ? '✔' : '✘'}</div>`;
    steps.push({ phase: 'Asosiy amallar', title: 'Nuqtalarni qo‘shish: P + Q', html: h });
  }
  if (P) {
    // 6) 2P
    const d2 = c.double(P); P2 = d2.R;
    h = `<div class="sub">Funksiya: <code>double(P)</code> — urinma chiziq bo‘yicha</div><div class="f">P = ${fmtP(P)}</div>${d2.html}`;
    if (P2) h += `<div class="f">Tekshiruv: ${fmtP(P2)} egri chiziqda? ${c.on(P2) ? '✔ ha' : '✘'}</div>`;
    steps.push({ phase: 'Asosiy amallar', title: 'Nuqtani ikkilantirish: 2P', html: h });

    // 7) kP
    const k = +v('k');
    if (!Number.isInteger(k) || k < 1 || k > 1e9) {
      warn.push(`k = “${v('k')}” noto‘g‘ri: 1 dan 10⁹ gacha butun son kiriting.`);
    } else {
      const m = c.mul(k, P, 'P'); KP = m.R; kDone = true;
      steps.push({ phase: 'Asosiy amallar', title: `Skalyar ko‘paytma: ${k}·P`, html: `<div class="sub">double() va addDistinct() funksiyalari navbat bilan chaqiriladi</div>${m.html}` });
    }
  }

  // 8) #E
  const N = c.curveOrder();
  const lo = Math.ceil(p + 1 - 2 * Math.sqrt(p)), hi = Math.floor(p + 1 + 2 * Math.sqrt(p));
  h = `<div class="sub">Funksiya: <code>curveOrder()</code>. Har bir x uchun z = x³ + ${A}x + ${B} mod ${p}; z kvadratik chegirma bo‘lsa — 2 ta nuqta (z = 0 bo‘lsa — 1 ta), aks holda nuqta yo‘q.</div>
    <div class="scroll"><table class="mini pts"><tr><th>x</th><th>z = x³+ax+b mod p</th><th>QR?</th><th>y</th><th>Nuqtalar</th></tr>`;
  all.rows.forEach(r => h += `<tr class="${r.ys.length ? 'ok' : 'no'}"><td>${r.x}</td><td>${r.x}³+${A}·${r.x}+${B} = ${r.x ** 3 + A * r.x + B} ≡ ${r.r}</td><td>${r.ys.length ? '✔' : '✘'}</td><td>${r.ys.join(', ') || '—'}</td><td>${r.ys.map(y => `(${r.x},${y})`).join(' ')}</td></tr>`);
  h += `</table></div><div class="f">Affin nuqtalar: ${all.pts.length} ta, + cheksiz uzoqlikdagi O</div>
    <div class="res">#E(F<sub>${p}</sub>) = ${all.pts.length} + 1 = <b>${N}</b></div>
    <div class="f">Hasse teoremasi: |N − (p + 1)| ≤ 2√p ⇒ ${lo} ≤ ${N} ≤ ${hi} ✔</div>
    <div class="f">N = ${N} = ${EC.factor(N).join(' · ')} ${isPrime(N) ? '(tub — har bir nuqta O dan boshqa generator)' : ''}</div>
    ${plotMarks(c, all.pts, [{ P, label: 'P', cls: 'm1' }, { P: Q, label: 'Q', cls: 'm2' }, { P: S, label: 'P+Q', cls: 'm3' }, { P: P2, label: '2P', cls: 'm4' }])}`;
  steps.push({ phase: 'Tartiblar', title: 'Egri chiziq tartibi #E(F_p)', html: h });

  // 9) nuqta tartiblari
  for (const [name, X] of [['P', P], ['Q', Q]]) {
    if (!X) continue;
    const tbl = c.multiplesTable(X, 5000), o = c.pointOrder(X);
    h = `<div class="sub">Funksiya: <code>pointOrder(${name})</code> — ${name}, 2${name}, 3${name}, … ketma-ket qo‘shiladi, toki k·${name} = O bo‘lguncha. Eng kichik shunday k — tartib.</div><div class="chips">`;
    tbl.forEach(([i, R]) => h += `<span class="chip ${R ? '' : 'inf'}">${i}${name} = ${fmtP(R)}</span>`);
    h += `</div><div class="res">ord(${name}) = <b>${o}</b></div>
      <div class="f">Lagranj teoremasi: ord(${name}) | #E ⇒ ${N} / ${o} = ${N / o} ${N % o === 0 ? '✔' : '✘'}</div>
      <div class="f">${o === N ? `ord(${name}) = #E ⇒ ${name} butun guruhni hosil qiladi (generator)` : `${name} tartibi ${o} bo‘lgan qism-guruhni hosil qiladi`}</div>`;
    if (name === 'P' && kDone) { const k = +v('k'); h += `<div class="f">Tekshiruv: ${k}·P = (${k} mod ${o})·P = ${mod(k, o)}·P = ${fmtP(mod(k, o) ? tbl[mod(k, o) - 1][1] : null)} ${fmtP(KP) === fmtP(mod(k, o) ? tbl[mod(k, o) - 1][1] : null) ? '✔' : '✘'}</div>`; }
    steps.push({ phase: 'Tartiblar', title: `Nuqta tartibi ord(${name})`, html: h });
  }
  // 10) Xulosa
  h = `<table class="mini"><tr><th>Ko‘rsatkich</th><th>Natija</th></tr>
    <tr><td>Egri chiziq</td><td>y² ≡ x³ + ${A}x + ${B} (mod ${p})</td></tr><tr><td>p tub</td><td>✔</td></tr><tr><td>Δ</td><td>${disc} ≠ 0 ✔</td></tr>
    <tr><td>P</td><td>${P ? fmtP(P) + ' ✔' : '✘ egri chiziqda emas'}</td></tr><tr><td>Q</td><td>${Q ? fmtP(Q) + ' ✔' : '✘ egri chiziqda emas'}</td></tr>
    ${P && Q ? `<tr><td>P + Q</td><td>${fmtP(S)}</td></tr>` : ''}${P ? `<tr><td>2P</td><td>${fmtP(P2)}</td></tr>` : ''}${kDone ? `<tr><td>${v('k')}·P</td><td>${fmtP(KP)}</td></tr>` : ''}
    <tr><td>#E</td><td>${N}</td></tr>${P ? `<tr><td>ord(P)</td><td>${c.pointOrder(P)}</td></tr>` : ''}${Q ? `<tr><td>ord(Q)</td><td>${c.pointOrder(Q)}</td></tr>` : ''}</table>
    <div class="verdict ${warn.length ? 'bad' : 'good'}">${warn.length ? `⚠ ${warn.length} ta ogohlantirish bor — yuqoridagi xabarlarni ko‘ring` : '✔ Barcha tekshiruvlar o‘tdi, hisoblar yakunlandi'}</div>`;
  steps.push({ phase: 'Natija', title: 'Yakuniy natijalar', html: h });
  return steps;
}

// ---------- DH va ECDH (kalit almashish protokollari) ----------
const powQ = (g, e, p) => { let r = 1 % p, x = mod(g, p); while (e > 0) { if (e % 2) r = r * x % p; x = x * x % p; e = Math.floor(e / 2); } return r; };
const fmtFac = f => Object.entries(f.reduce((o, x) => (o[x] = (o[x] || 0) + 1, o), {})).map(([b, e]) => e > 1 ? `${b}<sup>${e}</sup>` : b).join(' · ');

// Modulli darajaga ko'tarish: «kvadratga oshirish va ko'paytirish» — har bir bit jadvalda
function powHtml(g, e, p, title) {
  const bits = e.toString(2); let r = 1;
  let h = `<div class="sub">${title}: ${e} = ${bits}<sub>2</sub> — «kvadratga oshirish va ko‘paytirish» algoritmi (chapdan o‘ngga, R = 1 dan boshlab)</div>
    <div class="scroll"><table class="mini"><tr><th>bit</th><th>R² mod p</th><th>bit = 1 ⇒ R·${g} mod p</th><th>R</th></tr>`;
  for (const bit of bits) {
    const sq = r * r % p; let nr = sq, cell = '—';
    if (bit === '1') { nr = sq * g % p; cell = `${sq}·${g} = ${sq * g} ≡ ${nr}`; }
    h += `<tr><td>${bit}</td><td>${r}² = ${r * r} ≡ ${sq}</td><td>${cell}</td><td><b>${nr}</b></td></tr>`;
    r = nr;
  }
  h += `</table></div><div class="res">${g}<sup>${e}</sup> mod ${p} = <b>${r}</b></div>`;
  return { val: r, html: h };
}

// Tublikni sinov bo'lish bilan tekshirish (faqat tub bo'luvchilarga)
function primeHtml(p) {
  const sq = Math.floor(Math.sqrt(p)); let div = null;
  let h = `<div class="sub">Sinov bo‘lish: ${p} ni ⌊√${p}⌋ = ${sq} gacha bo‘lgan tub sonlarga bo‘lib ko‘ramiz</div><div class="chips">`;
  for (let i = 2; i <= sq; i++) { if (!isPrime(i)) continue; const r = p % i; h += `<span class="chip ${r ? '' : 'inf'}">${p} mod ${i} = ${r}</span>`; if (!r) { div = i; break; } }
  h += `</div>`;
  return { ok: p > 3 && !div, div, html: h };
}

const party = (cls, ico, name, body) => `<div class="xp ${cls}"><h4><i>${ico}</i>${name}</h4>${body}</div>`;
const xchg = (L, mid, R) => `<div class="xchg">${L}<div class="xm">${mid}</div>${R}</div>`;

function readInt(v, id, name) {
  const s = String(v(id)).trim(), x = Number(s);
  if (s === '' || !Number.isInteger(x)) throw `${name} butun son bo‘lishi kerak (kiritilgan: “${s}”).`;
  return x;
}

function runDH(v) {
  const steps = [], warn = []; steps.warn = warn;
  const dh = dhPart(v, steps, warn), ec = ecdhPart(v, steps, warn);
  // Yakuniy taqqoslash
  const row = (k, a, b) => `<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`;
  const na = '—';
  let h = `<table class="mini"><tr><th>Ko‘rsatkich</th><th>DH (Z<sub>p</sub>*)</th><th>ECDH (E(F<sub>p</sub>))</th></tr>
    ${row('Guruh', dh ? `Z<sub>${dh.p}</sub>*, tartibi p − 1 = ${dh.p - 1}` : na, ec ? `E(F<sub>${ec.p}</sub>), #E = ${ec.N}` : na)}
    ${row('Generator', dh ? `g = ${dh.g}, ord(g) = ${dh.o}` : na, ec ? `G = ${fmtP(ec.G)}, ord(G) = n = ${ec.n}` : na)}
    ${row('Asosiy amal', 'modulli darajaga ko‘tarish g<sup>x</sup> mod p', 'skalyar ko‘paytma d·G (qo‘shish + ikkilantirish)')}
    ${row('Maxfiy kalitlar', dh ? `a = ${dh.a}, b = ${dh.b}` : na, ec ? `d<sub>A</sub> = ${ec.da}, d<sub>B</sub> = ${ec.db}` : na)}
    ${row('Ochiq kalitlar', dh ? `A = ${dh.A}, B = ${dh.B}` : na, ec ? `Q<sub>A</sub> = ${fmtP(ec.QA)}, Q<sub>B</sub> = ${fmtP(ec.QB)}` : na)}
    ${row('Umumiy sir', dh ? `K = g<sup>ab</sup> mod p = <b>${dh.K}</b>` : na, ec ? `S = d<sub>A</sub>d<sub>B</sub>·G = ${fmtP(ec.S)}, K = x<sub>S</sub> = <b>${ec.S[0]}</b>` : na)}
    ${row('Ikki tomon kaliti teng', dh ? (dh.eq ? '✔' : '✘') : na, ec ? (ec.eq ? '✔' : '✘') : na)}
    ${row('Eve: to‘liq qidiruv', dh ? `${dh.tries} ta urinishda a topildi` : na, ec ? `${ec.tries} ta urinishda d<sub>A</sub> topildi` : na)}
    ${row('Eng yaxshi ma’lum hujum', 'indeks hisobi / sonli maydon g‘alviri (subeksponensial)', 'Pollard ρ (≈ √n, eksponensial)')}
    </table>
    <div class="sub">Bir xil xavfsizlik darajasi uchun kalit uzunliklari (NIST SP 800-57):</div>
    <table class="mini"><tr><th>Xavfsizlik (bit)</th><th>DH: p uzunligi</th><th>ECDH: n uzunligi</th><th>Nisbat</th></tr>
    ${[[80, 1024, 160], [112, 2048, 224], [128, 3072, 256], [192, 7680, 384], [256, 15360, 512]].map(([s, a, b]) => `<tr><td>${s}</td><td>${a}</td><td>${b}</td><td>${(a / b).toFixed(1)} : 1</td></tr>`).join('')}</table>
    <div class="f">Xulosa: ECDH bir xil xavfsizlikni ancha qisqa kalitlar bilan beradi, shuning uchun TLS 1.3, Signal, SSH kabi protokollarda X25519 / P-256 ishlatiladi.</div>`;
  const ok = dh && ec && dh.eq && ec.eq;
  h += `<div class="verdict ${ok ? 'good' : 'bad'}">${ok ? `✔ Ikkala protokolda ham Alice va Bob bir xil umumiy kalitga ega bo‘ldi (DH: ${dh.K}, ECDH: ${ec.S[0]})` : `⚠ Hisoblash to‘liq yakunlanmadi — yuqoridagi ogohlantirishlarni ko‘ring`}</div>`;
  steps.push({ phase: 'Xulosa', title: 'DH va ECDH taqqoslash', html: h });
  return steps;
}

function dhPart(v, steps, warn) {
  const P1 = 'DH · Parametrlar';
  const stop = (title, h, msg, ph = P1) => { warn.push('DH: ' + msg); steps.push({ phase: ph, title, html: h + `<div class="verdict bad">✘ ${msg}</div>` }); return null; };
  let p, g0, a, b, m;
  try {
    p = readInt(v, 'p', 'p'); g0 = readInt(v, 'g', 'g'); a = readInt(v, 'xa', 'a (Alice)'); b = readInt(v, 'xb', 'b (Bob)'); m = readInt(v, 'm', 'm (Mallory)');
  } catch (e) { return stop('Kiritilgan qiymatlar', '', e); }
  const T1 = 'p tub sonmi? p − 1 tahlili';
  if (p < 5 || p > 1000000) return stop(T1, `<div class="f big">p = ${p}</div>`, 'p 5 dan 1 000 000 gacha bo‘lishi kerak (o‘quv rejimi: diskret logarifm hujumini ham ko‘rsatish uchun).');

  // 1) p tubligi va p − 1 tahlili
  const pc = primeHtml(p);
  let h = `<div class="f big">p = ${p}</div>${pc.html}`;
  if (!pc.ok) return stop(T1, h, `p = ${p} = ${pc.div}·${p / pc.div} tub son emas — Z<sub>p</sub>* siklik guruh bo‘lmaydi. Tub p kiriting (masalan 23, 2027).`);
  const fac = EC.factor(p - 1), qs = [...new Set(fac)], q = (p - 1) / 2, safe = isPrime(q), big = Math.max(...qs);
  h += `<div class="verdict good">✔ ${p} — tub son</div>
    <div class="sub">Guruh Z<sub>p</sub>* = {1, 2, …, p − 1} ko‘paytirish bo‘yicha siklik, tartibi p − 1. Diskret logarifm murakkabligi p − 1 ning tub bo‘luvchilariga bog‘liq (Pohlig–Hellman).</div>
    <div class="f">p − 1 = ${p - 1} = <b>${fmtFac(fac)}</b> ⇒ eng katta tub bo‘luvchi ${big}</div>
    <div class="f">q = (p − 1)/2 = ${q} ${safe ? '— tub ⇒ <b>p xavfsiz tub son (safe prime)</b> ✔' : '— tub emas ⇒ p xavfsiz tub son emas'}</div>`;
  if (!safe) h += `<div class="warn">Amalda p = 2q + 1 (q — katta tub) ko‘rinishidagi xavfsiz tub sonlar tanlanadi (RFC 3526, RFC 7919 guruhlari), aks holda Pohlig–Hellman hujumi osonlashadi.</div>`;
  steps.push({ phase: P1, title: T1, html: h });

  // 2) g generatormi
  const T2 = 'g generatormi? ord(g) ni hisoblash';
  const g = mod(g0, p);
  h = `<div class="f big">g = ${g0}${g !== g0 ? ` ≡ ${g} (mod ${p})` : ''}</div>`;
  if (g < 2 || g > p - 2) return stop(T2, h, `g = ${g} yaroqsiz: g ∈ [2, p − 2] bo‘lishi kerak (g = 0, 1, p − 1 trivial qiymatlar beradi).`);
  h += `<div class="sub">g generator (boshlang‘ich ildiz) bo‘lishi uchun p − 1 ning har bir tub bo‘luvchisi q<sub>i</sub> da g<sup>(p−1)/q<sub>i</sub></sup> ≢ 1 (mod p) bo‘lishi kerak:</div>`;
  qs.forEach(qi => { const r = powQ(g, (p - 1) / qi, p); h += `<div class="f">q = ${qi}: ${g}<sup>${p - 1}/${qi}</sup> = ${g}<sup>${(p - 1) / qi}</sup> mod ${p} = <b>${r}</b> ${r === 1 ? '= 1 ✘' : '≠ 1 ✔'}</div>`; });
  let o = p - 1;
  for (const qi of qs) while (o % qi === 0 && powQ(g, o / qi, p) === 1) o /= qi;
  if (p <= 200) {
    h += `<div class="sub">g ning darajalari g<sup>k</sup> mod p (k = 1 … ${o}):</div><div class="chips">`;
    for (let k = 1, r = g; k <= o; k++, r = r * g % p) h += `<span class="chip ${r === 1 ? 'inf' : ''}">${g}<sup>${k}</sup> = ${r}</span>`;
    h += `</div>`;
  }
  const roots = []; for (let c = 2; c < p && roots.length < 8; c++) if (qs.every(qi => powQ(c, (p - 1) / qi, p) !== 1)) roots.push(c);
  const phi = qs.reduce((x, qi) => x / qi * (qi - 1), p - 1);
  h += `<div class="res">ord(g) = <b>${o}</b></div>`;
  if (o === p - 1) h += `<div class="verdict good">✔ g = ${g} — generator: g<sup>k</sup> Z<sub>${p}</sub>* ning barcha ${p - 1} ta elementini hosil qiladi</div>`;
  else {
    h += `<div class="verdict bad">✘ g = ${g} generator emas: ord(g) = ${o} &lt; p − 1 = ${p - 1}</div>`;
    warn.push(`DH: g = ${g} generator emas (ord(g) = ${o} &lt; ${p - 1}). Kalitlar faqat ${o} ta qiymatli qism-guruhda yotadi — Eve uchun qidiruv ${(p - 1) / o} marta osonlashadi. Generatorlar: ${roots.join(', ')}, …`);
  }
  h += `<div class="f">Z<sub>${p}</sub>* dagi generatorlar soni φ(p − 1) = φ(${p - 1}) = ${phi}; eng kichiklari: ${roots.join(', ')}${roots.length === 8 ? ', …' : ''}</div>`;
  steps.push({ phase: P1, title: T2, html: h });

  // 3–4) Kalitlar
  const keyStep = (who, sym, X, pub) => {
    const t = `${who}: ${pub} = g^${sym} mod p`;
    let hh = `<div class="f">${who} maxfiy kalitni tasodifiy tanlaydi: ${sym} ∈ [2, p − 2] = [2, ${p - 2}] ⇒ <b>${sym} = ${X}</b></div>`;
    if (X < 2 || X > p - 2) return stop(t, hh, `${sym} = ${X} oraliqdan tashqarida: ${sym} ∈ [2, ${p - 2}] bo‘lishi kerak.`, 'DH · Kalitlar');
    const r = powHtml(g, X, p, `${pub} = ${g}<sup>${X}</sup> mod ${p}`);
    hh += r.html + `<div class="keys"><div><span>${who} maxfiy</span>${sym} = ${X}</div><div><span>${who} ochiq</span>${pub} = ${r.val}</div></div>`;
    steps.push({ phase: 'DH · Kalitlar', title: t, html: hh });
    return r.val;
  };
  const A = keyStep('Alice', 'a', a, 'A'); if (A === null) return null;
  const B = keyStep('Bob', 'b', b, 'B'); if (B === null) return null;
  if (a === b) warn.push('DH: a = b — amalda ikki tomon mustaqil tasodifiy kalit tanlaydi.');

  // 5) Almashinuv
  h = xchg(party('xa', 'A', 'Alice', `<p>maxfiy: a = ${a}</p><p>ochiq: A = ${A}</p>`),
    `<div class="arr r">A = ${A} ⟶</div><div class="arr l">⟵ B = ${B}</div><div class="eve">ochiq kanal · Eve ko‘radi: p = ${p}, g = ${g}, A = ${A}, B = ${B}</div>`,
    party('xb', 'B', 'Bob', `<p>maxfiy: b = ${b}</p><p>ochiq: B = ${B}</p>`)) +
    `<div class="sub">Alice A ni, Bob B ni ochiq kanal orqali yuboradi. Maxfiy a va b hech qachon uzatilmaydi.</div>`;
  steps.push({ phase: 'DH · Almashinuv', title: 'Ochiq kalitlar almashinuvi', html: h });

  // 6) Umumiy kalit
  const KA = powHtml(B, a, p, `K<sub>A</sub> = ${B}<sup>${a}</sup> mod ${p}`), KB = powHtml(A, b, p, `K<sub>B</sub> = ${A}<sup>${b}</sup> mod ${p}`);
  const e = a * b % (p - 1), K0 = powQ(g, e, p), eq = KA.val === KB.val;
  h = `<details open><summary>Alice: K<sub>A</sub> = B<sup>a</sup> mod p = ${B}<sup>${a}</sup> mod ${p} = <b>${KA.val}</b></summary>${KA.html}</details>
    <details open><summary>Bob: K<sub>B</sub> = A<sup>b</sup> mod p = ${A}<sup>${b}</sup> mod ${p} = <b>${KB.val}</b></summary>${KB.html}</details>
    <div class="f">Tekshiruv: g<sup>ab</sup> = g<sup>ab mod (p−1)</sup> = ${g}<sup>${a}·${b} mod ${p - 1}</sup> = ${g}<sup>${e}</sup> mod ${p} = <b>${K0}</b></div>
    <div class="verdict ${eq ? 'good' : 'bad'}">${eq ? `✔ K<sub>A</sub> = K<sub>B</sub> = ${KA.val} — umumiy maxfiy kalit kelishildi` : '✘ kalitlar teng emas'}</div>
    <div class="sub">Nima uchun teng: K<sub>A</sub> = (g<sup>b</sup>)<sup>a</sup> = g<sup>ab</sup> = (g<sup>a</sup>)<sup>b</sup> = K<sub>B</sub> (mod p)</div>`;
  steps.push({ phase: 'DH · Umumiy kalit', title: 'Umumiy kalit K = g^ab mod p', html: h });

  // 7) Eve: diskret logarifm (to'liq qidiruv)
  let x = 0, r = 1;
  h = `<div class="sub">Eve faqat p, g, A, B ni biladi. K ni topish uchun a = log<sub>g</sub> A (diskret logarifm) kerak. Eng sodda usul — to‘liq qidiruv: g<sup>1</sup>, g<sup>2</sup>, … ni A = ${A} bilan solishtirish.</div><div class="chips">`;
  do { x++; r = r * g % p; if (x <= 24 || r === A) h += `<span class="chip ${r === A ? 'inf' : ''}">${g}<sup>${x}</sup> = ${r}${r === A ? ' = A' : ''}</span>`; else if (x === 25) h += `<span class="chip">…</span>`; } while (r !== A && x < p);
  const KE = powQ(B, x, p);
  h += `</div><div class="res">Eve topdi: x = ${x} (${x} ta urinish)${x === a ? ', x = a' : `, x ≡ a (mod ord(g) = ${o})`}</div>
    <div class="f">K<sub>Eve</sub> = B<sup>x</sup> mod p = ${B}<sup>${x}</sup> mod ${p} = <b>${KE}</b> ${KE === KA.val ? '= K ✔' : '✘'}</div>
    <div class="f">«Kichik qadam – katta qadam» (BSGS) usuli ≈ √(p − 1) ≈ ${Math.ceil(Math.sqrt(p - 1))} qadam talab qiladi.</div>
    <div class="verdict bad">⚠ Kichik p da DH buziladi: Eve ${x} ta urinishda umumiy kalitni tikladi</div>
    <div class="sub">Amalda p ≥ 2048 bit: bunday guruhda diskret logarifm (sonli maydon g‘alviri bilan ham) ≈ 2<sup>112</sup> amal talab qiladi — hisoblash jihatdan imkonsiz.</div>`;
  steps.push({ phase: 'DH · Tahlil', title: 'Passiv hujum: Eve diskret logarifmni qidiradi', html: h });

  // 8) MITM
  let mm = m; if (m < 2 || m > p - 2) { mm = 2 + mod(m - 2, p - 3); warn.push(`DH: Mallory kaliti m = ${m} oraliqdan tashqarida, m = ${mm} olindi.`); }
  const M = powQ(g, mm, p), K1 = powQ(M, a, p), K1m = powQ(A, mm, p), K2 = powQ(M, b, p), K2m = powQ(B, mm, p);
  h = xchg(party('xa', 'A', 'Alice', `<p>yuboradi: A = ${A}</p><p>oladi: M = ${M} (B deb o‘ylaydi)</p><p>K₁ = M<sup>a</sup> = ${M}<sup>${a}</sup> = <b>${K1}</b></p>`),
    party('xmal', 'M', 'Mallory', `<p>m = ${mm}, M = ${g}<sup>${mm}</sup> = ${M}</p><p>A ni ushlab, Bobga M yuboradi</p><p>B ni ushlab, Alicega M yuboradi</p><p>K₁ = A<sup>m</sup> = <b>${K1m}</b></p><p>K₂ = B<sup>m</sup> = <b>${K2m}</b></p>`),
    party('xb', 'B', 'Bob', `<p>yuboradi: B = ${B}</p><p>oladi: M = ${M} (A deb o‘ylaydi)</p><p>K₂ = M<sup>b</sup> = ${M}<sup>${b}</sup> = <b>${K2}</b></p>`)) +
    `<div class="f">Alice ↔ Mallory kaliti: K₁ = ${M}<sup>${a}</sup> = ${A}<sup>${mm}</sup> = <b>${K1}</b> ${K1 === K1m ? '✔' : '✘'}</div>
    <div class="f">Bob ↔ Mallory kaliti: K₂ = ${M}<sup>${b}</sup> = ${B}<sup>${mm}</sup> = <b>${K2}</b> ${K2 === K2m ? '✔' : '✘'}</div>
    <div class="verdict bad">⚠ Autentifikatsiyasiz DH «o‘rtadagi odam» hujumiga zaif: Mallory ikkala kalitni ham biladi, xabarlarni o‘qib, qayta shifrlab uzatadi</div>
    <div class="sub">Himoya: ochiq kalitlarni raqamli imzo bilan tasdiqlash (ECDSA, GOST 34.10 modullari), sertifikatlar (TLS), STS protokoli.</div>`;
  steps.push({ phase: 'DH · Tahlil', title: 'Faol hujum: «o‘rtadagi odam» (MITM)', html: h });
  return { p, g, o, a, b, A, B, K: KA.val, eq, tries: x };
}

function ecdhPart(v, steps, warn) {
  const P1 = 'ECDH · Parametrlar';
  const stop = (title, h, msg, ph = P1) => { warn.push('ECDH: ' + msg); steps.push({ phase: ph, title, html: h + `<div class="verdict bad">✘ ${msg}</div>` }); return null; };
  let p, a, b, da, db;
  try { p = readInt(v, 'ep', 'Egri chiziq p'); a = readInt(v, 'ea', 'a'); b = readInt(v, 'eb', 'b'); da = readInt(v, 'da', 'd_A'); db = readInt(v, 'db', 'd_B'); }
  catch (e) { return stop('Kiritilgan qiymatlar', '', e); }
  const T1 = 'Egri chiziq: p tubligi va singulyarlik';
  if (p < 5 || p > 2000) return stop(T1, `<div class="f big">p = ${p}</div>`, 'Egri chiziq uchun p 5 dan 2000 gacha bo‘lishi kerak (o‘quv rejimi, barcha nuqtalar sanaladi).');
  const pc = primeHtml(p);
  let h = `<div class="f big">E: y² ≡ x³ + ${mod(a, p)}x + ${mod(b, p)} (mod ${p})</div>${pc.html}`;
  if (!pc.ok) return stop(T1, h, `p = ${p} tub son emas — F<sub>p</sub> maydon bo‘lmaydi.`);
  a = mod(a, p); b = mod(b, p);
  const disc = mod(4 * a ** 3 + 27 * b * b, p);
  h += `<div class="f">p = ${p} tub ✔</div><div class="sub">Singulyar emaslik: Δ = 4a³ + 27b² ≢ 0 (mod p)</div>
    <div class="f">4·${a}³ + 27·${b}² = ${4 * a ** 3} + ${27 * b * b} = ${4 * a ** 3 + 27 * b * b} ≡ <b>${disc}</b> (mod ${p})</div>`;
  if (disc === 0) return stop(T1, h, `Egri chiziq singulyar (Δ ≡ 0 mod ${p}) — boshqa a yoki b tanlang.`);
  h += `<div class="verdict good">✔ Δ = ${disc} ≠ 0 — egri chiziq singulyar emas</div>`;
  steps.push({ phase: P1, title: T1, html: h });

  // G
  const c = new Curve(a, b, p), Gs = String(v('G')).trim();
  let pref = null, note = '';
  if (Gs) {
    const pt = parsePt(Gs);
    if (!pt) { note = `<div class="warn">G = “${Gs}” formati noto‘g‘ri — G avtomatik tanlanadi</div>`; warn.push(`ECDH: G formati noto‘g‘ri (“${Gs}”), G avtomatik tanlandi. Masalan “5, 1” ko‘rinishida kiriting.`); }
    else {
      const P = [mod(pt[0], p), mod(pt[1], p)];
      if (!c.on(P)) { note = `<div class="warn">G = ${fmtP(P)}: y² mod ${p} = ${mod(P[1] * P[1], p)}, x³ + ax + b mod ${p} = ${c.rhs(P[0])} — egri chiziqda yotmaydi. G avtomatik tanlanadi.</div>`; warn.push(`ECDH: G = ${fmtP(P)} egri chiziqda yotmaydi, G avtomatik tanlandi.`); }
      else pref = P;
    }
  }
  const g = findG(c, pref);
  if (!g.G || g.n < 5) return stop('Nuqtalarni sanash va G ni topish', note + g.html, 'Yetarli katta tub tartibli nuqta topilmadi — boshqa parametrlar tanlang.');
  const { G, n, N } = g;
  if (pref && fmtP(pref) !== fmtP(G)) { const po = c.order(pref); note += `<div class="warn">Kiritilgan G = ${fmtP(pref)} tartibi ${po} — bu eng katta tub tartib n = ${n} emas (kichik qism-guruh). Shuning uchun G = ${fmtP(G)} olindi.</div>`; warn.push(`ECDH: kiritilgan G = ${fmtP(pref)} kichik qism-guruhda (tartibi ${po}), G = ${fmtP(G)} olindi.`); }
  if (N === p) { note += `<div class="warn">#E = p = ${p} — anomal egri chiziq: Smart hujumi ECDLP ni polinomial vaqtda yechadi. Amalda bunday egri chiziqlar ishlatilmaydi.</div>`; warn.push(`ECDH: #E = p = ${p} (anomal egri chiziq) — kriptografik jihatdan zaif, boshqa a, b tanlang.`); }
  steps.push({ phase: P1, title: 'Nuqtalarni sanash va G ni topish', html: note + g.html + plot(c, g) });

  // Kalitlar
  const fixD = (d, sym) => {
    if (d >= 1 && d <= n - 1) return d;
    const r = mod(d, n);
    if (r === 0) return null;
    warn.push(`ECDH: ${sym} = ${d} oraliqdan tashqarida, ${sym} = ${d} mod ${n} = ${r} olindi.`); return r;
  };
  const da1 = fixD(da, 'd_A'), db1 = fixD(db, 'd_B');
  if (da1 === null || db1 === null) return stop('Ochiq kalitlar Q = d·G', `<div class="f">d ∈ [1, n − 1] = [1, ${n - 1}]</div>`, `${da1 === null ? `d_A = ${da}` : `d_B = ${db}`} ≡ 0 (mod n = ${n}) — maxfiy kalit 0 bo‘lishi mumkin emas (ochiq kalit O bo‘lib qoladi).`, 'ECDH · Kalitlar');
  da = da1; db = db1;
  const QA = c.mul(da, G, 'G'), QB = c.mul(db, G, 'G');
  h = `<div class="f">Maxfiy kalitlar: d ∈ [1, n − 1] = [1, ${n - 1}] ⇒ <b>d<sub>A</sub> = ${da}</b>, <b>d<sub>B</sub> = ${db}</b></div>
    <details open><summary>Alice: Q<sub>A</sub> = d<sub>A</sub>·G = ${da}·G = <b>${fmtP(QA.R)}</b></summary>${QA.html}</details>
    <details open><summary>Bob: Q<sub>B</sub> = d<sub>B</sub>·G = ${db}·G = <b>${fmtP(QB.R)}</b></summary>${QB.html}</details>
    <div class="keys"><div><span>Alice</span>d<sub>A</sub> = ${da} · Q<sub>A</sub> = ${fmtP(QA.R)}</div><div><span>Bob</span>d<sub>B</sub> = ${db} · Q<sub>B</sub> = ${fmtP(QB.R)}</div></div>`;
  steps.push({ phase: 'ECDH · Kalitlar', title: 'Ochiq kalitlar Q = d·G', html: h });

  // Almashinuv + ochiq kalitni tekshirish
  h = xchg(party('xa', 'A', 'Alice', `<p>maxfiy: d<sub>A</sub> = ${da}</p><p>ochiq: Q<sub>A</sub> = ${fmtP(QA.R)}</p>`),
    `<div class="arr r">Q<sub>A</sub> = ${fmtP(QA.R)} ⟶</div><div class="arr l">⟵ Q<sub>B</sub> = ${fmtP(QB.R)}</div><div class="eve">ochiq kanal · Eve ko‘radi: E, G, n, Q<sub>A</sub>, Q<sub>B</sub></div>`,
    party('xb', 'B', 'Bob', `<p>maxfiy: d<sub>B</sub> = ${db}</p><p>ochiq: Q<sub>B</sub> = ${fmtP(QB.R)}</p>`)) +
    `<div class="sub">Qabul qilingan ochiq kalitni tekshirish (SP 800-56A, «noto‘g‘ri egri chiziq» hujumidan himoya):</div>`;
  for (const [nm, Q] of [['Q<sub>A</sub>', QA.R], ['Q<sub>B</sub>', QB.R]]) {
    const L = mod(Q[1] * Q[1], p), R = c.rhs(Q[0]), nQ = c.mulQ(n, Q);
    h += `<div class="f">${nm} = ${fmtP(Q)}: ≠ O ✔ · y² ≡ ${L}, x³ + ax + b ≡ ${R} ${L === R ? '⇒ egri chiziqda ✔' : '✘'} · n·${nm} = ${n}·${fmtP(Q)} = ${fmtP(nQ)} ${nQ ? '✘' : '✔'}</div>`;
  }
  steps.push({ phase: 'ECDH · Almashinuv', title: 'Ochiq kalitlar almashinuvi va tekshiruvi', html: h });

  // Umumiy sir
  const SA = c.mul(da, QB.R, 'Q<sub>B</sub>'), SB = c.mul(db, QA.R, 'Q<sub>A</sub>'), eq = fmtP(SA.R) === fmtP(SB.R);
  const e = da * db % n, S0 = c.mulQ(e, G);
  h = `<details open><summary>Alice: S<sub>A</sub> = d<sub>A</sub>·Q<sub>B</sub> = ${da}·${fmtP(QB.R)} = <b>${fmtP(SA.R)}</b></summary>${SA.html}</details>
    <details open><summary>Bob: S<sub>B</sub> = d<sub>B</sub>·Q<sub>A</sub> = ${db}·${fmtP(QA.R)} = <b>${fmtP(SB.R)}</b></summary>${SB.html}</details>
    <div class="f">Tekshiruv: (d<sub>A</sub>·d<sub>B</sub> mod n)·G = (${da}·${db} mod ${n})·G = ${e}·G = <b>${fmtP(S0)}</b></div>
    <div class="verdict ${eq ? 'good' : 'bad'}">${eq ? `✔ S<sub>A</sub> = S<sub>B</sub> = ${fmtP(SA.R)} — umumiy kalit K = x<sub>S</sub> = ${SA.R[0]}` : '✘ nuqtalar teng emas'}</div>
    <div class="sub">Nima uchun teng: d<sub>A</sub>·Q<sub>B</sub> = d<sub>A</sub>·(d<sub>B</sub>·G) = d<sub>B</sub>·(d<sub>A</sub>·G) = d<sub>B</sub>·Q<sub>A</sub>. Amalda K = x<sub>S</sub> dan KDF (masalan HKDF-SHA256) orqali simmetrik kalit olinadi.</div>`;
  steps.push({ phase: 'ECDH · Umumiy kalit', title: 'Umumiy sir S = d_A·d_B·G', html: h });

  // Eve: ECDLP (to'liq qidiruv)
  let R = null, k = 0;
  h = `<div class="sub">Eve d<sub>A</sub> ni topishi uchun Q<sub>A</sub> = k·G tenglamani yechishi kerak (ECDLP). To‘liq qidiruv: G, 2G, 3G, … ni Q<sub>A</sub> = ${fmtP(QA.R)} bilan solishtiradi.</div><div class="chips">`;
  do { k++; R = c.add(R, G, false).R; const hit = fmtP(R) === fmtP(QA.R); if (k <= 24 || hit) h += `<span class="chip ${hit ? 'inf' : ''}">${k}G = ${fmtP(R)}</span>`; else if (k === 25) h += `<span class="chip">…</span>`; } while (fmtP(R) !== fmtP(QA.R) && k < n);
  const SE = c.mulQ(k, QB.R);
  h += `</div><div class="res">Eve topdi: d<sub>A</sub> = ${k} (${k} ta urinish)</div>
    <div class="f">S<sub>Eve</sub> = ${k}·Q<sub>B</sub> = <b>${fmtP(SE)}</b> ${fmtP(SE) === fmtP(SA.R) ? '= S ✔' : '✘'}</div>
    <div class="f">Pollard ρ usuli ≈ √(πn/4) ≈ ${Math.ceil(Math.sqrt(Math.PI * n / 4))} qadam talab qiladi.</div>
    <div class="verdict bad">⚠ Kichik egri chiziqda ECDH ham buziladi: ${k} ta urinish yetarli bo‘ldi</div>
    <div class="sub">Amalda n ≈ 2<sup>256</sup> (P-256, Curve25519): Pollard ρ ≈ 2<sup>128</sup> amal — imkonsiz. ECDH ham autentifikatsiyasiz MITM hujumiga zaif (DH dagi kabi).</div>`;
  steps.push({ phase: 'ECDH · Tahlil', title: 'Passiv hujum: Eve ECDLP ni qidiradi', html: h });
  return { p, G, n, N, da, db, QA: QA.R, QB: QB.R, S: SA.R, eq, tries: k };
}

route();

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
  <header class="hero">
    <div class="eyebrow">Elliptik egri chiziqli kriptografiya</div>
    <h1>Kripto Laboratoriya</h1>
    <p>Har bir algoritmni qadam-baqadam ko‘ring: nuqtalarni sanash, generator G ni topish, λ hisoblash, teskari elementlar, imzo va shifrlash — barchasi formula va raqamlar bilan.</p>
  </header>
  <main class="cards">
    ${Object.entries(MODULES).map(([k, m], i) => `
      <a class="card card-${k}" href="#${k}">
        <div class="card-ico">${m.icon}</div>
        <div class="card-tag">${m.tag}</div>
        <h2>${m.title}</h2>
        <div class="card-full">${m.full}</div>
        <p>${m.desc}</p>
        <span class="card-go">Modulga kirish →</span>
      </a>`).join('')}
  </main>
  <footer class="foot">y² ≡ x³ + ax + b (mod p) · o‘quv maqsadidagi kichik parametrlar</footer>`;
}

function field(id, label, val, type = 'number') {
  return `<label class="fld"><span>${label}</span><input id="f-${id}" type="${type}" value="${val}"></label>`;
}

function renderModule(key) {
  const m = MODULES[key], d = m.defaults;
  const extra = key === 'ecc'
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
    <div class="grid">
      ${field('p', 'Modul p (tub)', d.p)}${field('a', 'a', d.a)}${field('b', 'b', d.b)}
      ${extra}
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
  const UNITS = 'div.sub, div.f, div.res, div.warn, tr, details, .chip, .cell, .keys, .sig, .verdict, svg.plot, .ct';
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
      const p = +v('p'), a = +v('a'), b = +v('b');
      if ([p, a, b].some(x => !Number.isInteger(x))) throw 'p, a, b butun son bo‘lishi kerak.';
      if (p > 2000 || p < 2) throw 'p 2 dan 2000 gacha bo‘lishi kerak (o‘quv rejimi, barcha nuqtalar sanaladi).';
      if (key !== 'ecc' && !isPrime(p)) throw `p = ${p} tub son emas.`;
      steps = ({ ecdsa: runECDSA, gost: runGOST, elgamal: runElGamal, ecc: runECC })[key](p, a, b, v);
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

route();

import { K, H0, H0_INFO, K_INFO, hex8, rotr, shr, S0, S1, s0, s1, Ch, Maj, add, u32, sha256Trace, pad } from './sha.js';
import { $, $$, enc, reduce, KS, setKS, REG, NM, SIG, CHM, TT, WCOL, KCOL, wcol, bitsOf, ring, it, opx } from './ring.js';

/* ================= Sahifa effektlari ================= */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
$$('.reveal').forEach((el) => io.observe(el));

/* ---- Hero: aylanayotgan 3 ta halqa, har 1.6 soniyada yangi qiymat kirib keladi ---- */
(function hero() {
  const el = $('#heroArt');
  const radii = [150, 112, 76], cols = ['#38bdf8', '#a78bfa', '#f472b6'];
  let s = '<svg viewBox="-190 -190 380 380">';
  radii.forEach((R, k) => {
    s += `<g class="hring hr${k}">`;
    for (let i = 31; i >= 0; i--) {
      const a = ((31 - i) * Math.PI) / 16;
      s += `<circle data-k="${k}" data-i="${i}" cx="${(R * Math.sin(a)).toFixed(1)}" cy="${(-R * Math.cos(a)).toFixed(1)}" r="${7 - k}" fill="${cols[k]}" opacity=".12"/>`;
    }
    s += '</g>';
  });
  s += '<text y="-4" id="heroT1"></text><text y="16" id="heroT2" style="font-size:11px;opacity:.6"></text></svg>';
  el.innerHTML = s;
  let n = 0;
  const upd = () => {
    const words = sha256Trace(enc.encode('halqa' + n++)).digest;
    $$('circle', el).forEach((c) => {
      const w = words[+c.dataset.k];
      c.setAttribute('opacity', (w >>> +c.dataset.i) & 1 ? '.95' : '.1');
    });
    $('#heroT1').textContent = hex8(words[0]);
    $('#heroT2').textContent = 'SHA-256';
  };
  upd();
  setInterval(upd, 1600);
})();

/* ================= 01. Ko'chki (avalanche) ================= */
(function aval() {
  const bitsHash = (str) => {
    const d = sha256Trace(enc.encode(str));
    const out = [];
    d.digest.forEach((w) => { for (let i = 31; i >= 0; i--) out.push((w >>> i) & 1); });
    return { out, hex: d.hex };
  };
  const upd = () => {
    const A = bitsHash($('#avA').value), B = bitsHash($('#avB').value);
    $('#avHexA').textContent = A.hex; $('#avHexB').textContent = B.hex;
    $('#gridA').innerHTML = A.out.map((b) => `<i class="${b ? 'o' : ''}"></i>`).join('');
    let diff = 0;
    $('#gridB').innerHTML = B.out.map((b, i) => {
      const d = b !== A.out[i]; if (d) diff++;
      return `<i class="${d ? (b ? 'diff' : 'diff0') : b ? 'o' : ''}"></i>`;
    }).join('');
    $('#avRes').innerHTML = diff === 0
      ? 'Matnlar bir xil — xeshlar ham bir xil. (Xesh doim aniq: bir xil kirish = bir xil chiqish.)'
      : `<b>${diff}</b> / 256 bit farq qildi (${(diff / 2.56).toFixed(0)}%). Tasodifiy ikki xesh orasida taxminan 50% kutiladi.`;
  };
  $('#avA').oninput = $('#avB').oninput = upd;
  upd();
})();

/* ================= 02. Halqa tushunchasi ================= */
(function ringDemo() {
  const inp = $('#rdHex');
  const upd = () => {
    const v = inp.value.replace(/[^0-9a-f]/gi, '').padStart(8, '0').slice(0, 8);
    const n = parseInt(v, 16);
    $('#rdRing').innerHTML = ring(n, { size: 220, color: '#f472b6', cls: 'glow', dot: 6.5 });
    const b = n.toString(2).padStart(32, '0');
    $('#rdBits').innerHTML = [0, 8, 16, 24].map((k) => `<span>${[...b.slice(k, k + 8)].map((x) => `<i class="${x === '1' ? 'o' : 'z'}" style="font-style:normal">${x}</i>`).join('').replace(/(<i[^>]*>.<\/i>){4}/, (m) => m + ' ')}</span>`).join('');
  };
  inp.oninput = upd;
  $('#rdRand').onclick = () => { inp.value = hex8(Math.random() * 2 ** 32); upd(); };
  upd();
})();

/* ================= 02. Oltita amal ================= */
const OA = 0x6a09e667, OB = 0xbb67ae85, OC = 0x3c6ef372;
const CY = '#38bdf8', PK = '#f472b6', AM = '#fbbf24', VI = '#a78bfa', GR = '#4ade80';
const opIt = (lab, v, color, extra = {}) => `<div class="it">${lab ? `<span class="lb" style="color:${color}">${lab}</span>` : ''}${ring(v, { size: 88, color, ...extra })}<code class="cp">${hex8(v)}</code></div>`;
const opSign = (t) => `<span class="opx">${t}</span>`;
const rotCtl = '<span>n =</span><input type="range" min="1" max="31" value="6"><b class="nv">6</b>';

const OPS = [
  {
    id: 'rotr', name: 'Aylantirish', sym: 'ROTR n', ctl: rotCtl,
    what: "Halqani <b>n qadam</b> soat mili bo'yicha buramiz. Oxirgi bitlar (oq chiziqli) chetdan chiqib, boshdan qaytib kiradi — <b>hech narsa yo'qolmaydi</b>.",
    play(el) {
      const n = +$('input', el).value, demo = $('.opdemo', el), note = $('.opnote', el);
      demo.innerHTML = opIt('x', OA, CY, { cls: 'glow', rot: 0, bitCls: (i) => (i < n ? 'wrap' : '') }) + opSign('→') + '<div class="slot"></div>';
      note.textContent = '';
      setTimeout(() => { $('.rg', demo).style.transform = `rotate(${n * 11.25}deg)`; }, 60);
      setTimeout(() => {
        $('.slot', demo).outerHTML = opIt(`ROTR ${n}`, rotr(OA, n), VI, { cls: 'glow', reveal: 0.02 });
        note.innerHTML = `Har bir bit <b>${n}</b> o'rin pastga siljidi; pastdagi ${n} ta bit tepaga o'tdi.`;
      }, 2400 * KS);
    },
  },
  {
    id: 'shr', name: 'Surish', sym: 'SHR n', ctl: rotCtl,
    what: "Aylantirishga o'xshaydi, lekin chiqib ketgan bitlar <b>qaytmaydi</b>: ular yo'qoladi, tepada o'rniga <b>nollar</b> keladi.",
    play(el) {
      const n = +$('input', el).value, demo = $('.opdemo', el), note = $('.opnote', el);
      demo.innerHTML = opIt('x', OA, CY, { cls: 'glow', rot: 0, bitCls: (i) => (i < n ? 'wrap' : '') }) + opSign('→') + '<div class="slot"></div>';
      note.textContent = '';
      setTimeout(() => { $('.rg', demo).style.transform = `rotate(${n * 11.25}deg)`; }, 60);
      setTimeout(() => $$('circle', demo).forEach((c) => { if (+c.dataset.i < n) c.classList.add('dead'); }), 2300 * KS);
      setTimeout(() => {
        $('.slot', demo).outerHTML = opIt(`SHR ${n}`, shr(OA, n), VI, { cls: 'glow', reveal: 0.02 });
        note.innerHTML = `Qaytib kirgan ${n} ta bit o'chirildi — tepada <b>${n} ta nol</b>.`;
      }, 3100 * KS);
    },
  },
  {
    id: 'xor', name: 'XOR', sym: 'A ⊕ B',
    what: "Ikki halqani bit-ma-bit solishtiramiz: <b>har xil</b> bo'lsa → 1, <b>bir xil</b> bo'lsa → 0. XOR — SHA-256 ning asosiy aralashtiruvchisi.",
    play(el) {
      const r = (OA ^ OB) >>> 0, demo = $('.opdemo', el);
      const colors = []; for (let i = 0; i < 32; i++) colors[i] = VI;
      demo.innerHTML = opIt('A', OA, CY) + opSign('⊕') + opIt('B', OB, PK) + opSign('=') + opIt('A⊕B', r, VI, { reveal: 0.07, colors, cls: 'glow' });
      $('.opnote', el).innerHTML = 'Natija halqasi nuqta-nuqta <b>ketma-ket</b> paydo bo\'ladi: A va B farq qilgan joyda yonadi.';
    },
  },
  {
    id: 'ch', name: 'Tanlov', sym: 'Ch(x,y,z)',
    what: "<b>x</b> — kalit: x ning biti <b>1</b> bo'lsa natijaga <b>y</b> dan (pushti), <b>0</b> bo'lsa <b>z</b> dan (sariq) bit olinadi. Natijadagi rang — bit qayerdan kelganini ko'rsatadi.",
    play(el) {
      const r = Ch(OA, OB, OC), demo = $('.opdemo', el), colors = [];
      for (let i = 0; i < 32; i++) colors[i] = (OA >>> i) & 1 ? PK : AM;
      demo.innerHTML = opIt('x', OA, CY) + opIt('y', OB, PK) + opIt('z', OC, AM) + opSign('=') + opIt('Ch', r, GR, { reveal: 0.07, colors, cls: 'glow' });
      $('.opnote', el).innerHTML = 'Pushti nuqta — y dan, sariq nuqta — z dan olingan bit (o\'chiq bo\'lsa ham rangi manbani bildiradi).';
    },
  },
  {
    id: 'maj', name: 'Ko\'pchilik', sym: 'Maj(x,y,z)',
    what: "Uch halqa <b>ovoz beradi</b>: har bir o'rinda kamida <b>ikkitasi 1</b> desa — natija 1, aks holda 0.",
    play(el) {
      const r = Maj(OA, OB, OC), demo = $('.opdemo', el), colors = [];
      for (let i = 0; i < 32; i++) colors[i] = GR;
      demo.innerHTML = opIt('x', OA, CY) + opIt('y', OB, PK) + opIt('z', OC, AM) + opSign('=') + opIt('Maj', r, GR, { reveal: 0.07, colors, cls: 'glow' });
      $('.opnote', el).innerHTML = 'Har bir o\'rinda uch bitdan ko\'pchiligi qanday bo\'lsa, shu yoziladi.';
    },
  },
  {
    id: 'add', name: 'Qo\'shish (mod 2³²)', sym: 'A + B',
    mode: 0,
    ctl: '<button class="btn sm on" data-m="0">oddiy</button><button class="btn sm" data-m="1">to\'lib ketadigan</button>',
    what: "Oddiy qo'shish, lekin natija <b>32 bitdan oshsa</b>, ortiqcha (33-bit) tashlab yuboriladi. Halqa to'lib, yana noldan boshlanadi — soat kabi.",
    play(el) {
      const [a, b] = this.mode ? [0xc0000000, 0x50000000] : [0x00ff00ff, 0x0000a5a5];
      const full = a + b, r = u32(full), demo = $('.opdemo', el), colors = []; for (let i = 0; i < 32; i++) colors[i] = VI;
      demo.innerHTML = opIt('A', a, CY) + opSign('+') + opIt('B', b, PK) + opSign('=') + opIt('A+B', r, VI, { reveal: 0.07, colors, cls: 'glow' });
      $('.opnote', el).innerHTML = full >= 2 ** 32
        ? `${a} + ${b} = ${full} — bu 2³² = 4 294 967 296 dan katta. Ortig'i tashlanadi → <b>${r}</b>.`
        : `${a} + ${b} = <b>${full}</b> — 32 bitga sig'di, o'zgarishsiz.`;
    },
  },
];
(function buildOps() {
  const g = $('#opgrid');
  OPS.forEach((def) => {
    const el = document.createElement('article');
    el.className = 'card opc';
    el.innerHTML = `<h3><span>${def.name}</span><span class="sym">${def.sym}</span></h3><p class="what">${def.what}</p><div class="opdemo"></div><div class="opctl">${def.ctl || ''}<button class="btn sm primary play">▶ O'ynat</button></div><div class="opnote"></div>`;
    g.appendChild(el);
    const play = () => def.play.call(def, el);
    $('.play', el).onclick = play;
    const rg = $('input[type=range]', el);
    if (rg) rg.oninput = () => { $('.nv', el).textContent = rg.value; };
    if (def.id === 'add') $$('[data-m]', el).forEach((b) => b.onclick = () => { def.mode = +b.dataset.m; $$('[data-m]', el).forEach((x) => x.classList.toggle('on', x === b)); play(); });
    const ob = new IntersectionObserver((es) => { if (es[0].isIntersecting) { play(); ob.disconnect(); } }, { threshold: 0.5 });
    ob.observe(el);
  });
})();

/* ================= 03. Jadvallar ================= */
(function tables() {
  const fr = (x) => x.toFixed(12).slice(0, 14);
  let h = '<tr><th>№</th><th>Tub son p</th><th>√p</th><th>Kasr qismi</th><th>Kasr × 2³²</th><th>Hex (32 bit)</th><th>Halqa</th></tr>';
  H0_INFO.forEach((x) => {
    h += `<tr><td style="color:${REG[x.i]};font-weight:700">H${x.i}</td><td>${x.p}</td><td>${x.root.toFixed(10)}…</td><td>0.${fr(x.frac).slice(2)}…</td><td>${x.word}</td><td class="hx" style="color:${REG[x.i]}">${hex8(x.word)}</td><td class="ringc">${ring(x.word, { size: 52, color: REG[x.i] })}</td></tr>`;
  });
  $('#tblH').innerHTML = h;

  $('#tblSig').innerHTML = `<tr><th>Funksiya</th><th>Qayerda</th><th>Formula</th></tr>
    <tr><td style="color:${SIG}" class="hx">Σ0(a)</td><td>raund, a tomoni</td><td>ROTR 2 ⊕ ROTR 13 ⊕ ROTR 22</td></tr>
    <tr><td style="color:${SIG}" class="hx">Σ1(e)</td><td>raund, e tomoni</td><td>ROTR 6 ⊕ ROTR 11 ⊕ ROTR 25</td></tr>
    <tr><td style="color:#fb7185" class="hx">σ0(x)</td><td>xabar jadvali</td><td>ROTR 7 ⊕ ROTR 18 ⊕ SHR 3</td></tr>
    <tr><td style="color:#fb7185" class="hx">σ1(x)</td><td>xabar jadvali</td><td>ROTR 17 ⊕ ROTR 19 ⊕ SHR 10</td></tr>
    <tr><td style="color:${CHM}" class="hx">Ch(e,f,g)</td><td>raund</td><td>(e AND f) ⊕ (NOT e AND g) — "e tanlaydi"</td></tr>
    <tr><td style="color:${CHM}" class="hx">Maj(a,b,c)</td><td>raund</td><td>(a∧b) ⊕ (a∧c) ⊕ (b∧c) — "ko'pchilik"</td></tr>`;

  const kg = $('#kgrid');
  kg.innerHTML = K_INFO.map((x) => `<div class="kc" data-i="${x.i}" style="--c:${wcol(x.i * 1)}"><small>K${x.i}</small>${hex8(x.word)}</div>`).join('');
  const sel = (i) => {
    $$('.kc', kg).forEach((e) => e.classList.toggle('sel', +e.dataset.i === i));
    const x = K_INFO[i], big = x.frac * 2 ** 32;
    $('#kinfo').innerHTML = `<b style="font-size:1.05rem">K${i}</b>
      <div class="ringw">${ring(x.word, { size: 150, color: wcol(i), cls: 'glow', dot: 4.5 })}</div>
      <div class="ln">${i + 1}-tub son: <b>${x.p}</b></div>
      <div class="ln">∛${x.p} = ${x.root.toFixed(12)}…</div>
      <div class="ln">kasr qismi = 0.${x.frac.toFixed(12).slice(2)}…</div>
      <div class="ln">kasr × 2³² = ${Math.floor(big)}</div>
      <div class="ln">hex = <b>${hex8(x.word)}</b></div>`;
  };
  kg.onclick = (e) => { const c = e.target.closest('.kc'); if (c) sel(+c.dataset.i); };
  sel(0);
})();


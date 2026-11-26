import { K, H0, H0_INFO, K_INFO, hex8, rotr, shr, S0, S1, s0, s1, Ch, Maj, add, u32, sha256Trace, pad } from './sha.js';
import { $, $$, enc, reduce, KS, setKS, REG, NM, SIG, CHM, TT, WCOL, KCOL, wcol, bitsOf, ring, it, opx } from './ring.js';

/* ================= 04. Jonli pleyer ================= */
let frames = [], cur = 0, autoOn = false, autoT = null, timers = [], trace = null, msgBytes = null;

const later = (fn, ms) => { timers.push(setTimeout(fn, ms * KS)); };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const bitsRow = (b) => `<span class="bb">${[...bitsOf(b)].map((x) => `<i class="${x === '1' ? 'o' : 'z'}">${x}</i>`).join('')}</span>`;

/* --- vizualizatsiya bo'laklari --- */
function textViz(bytes, text) {
  const shown = bytes.slice(0, 12);
  let h = '<table class="chartab"><tr><th>Bayt №</th><th>Hex</th><th>O\'nli</th><th>8 bit</th></tr>';
  shown.forEach((b, i) => {
    h += `<tr class="ap" style="--d:${i * 0.12}"><td>${i}</td><td>${hex8(b).slice(6)}</td><td>${b}</td><td>${bitsRow(b)}</td></tr>`;
  });
  h += '</table>';
  if (bytes.length > shown.length) h += `<p class="muted">… va yana ${bytes.length - shown.length} bayt.</p>`;
  if (!bytes.length) h = '<p class="muted">Matn bo\'sh — 0 bayt. Bo\'sh matnning ham xeshi bor!</p>';
  return h;
}

function padViz(p, bytes, step) {
  const len = bytes.length;
  const lenStart = p.padded.length - 8;
  let h = '';
  for (let b = 0; b < p.blocks; b++) {
    if (p.blocks > 1) h += `<div class="blk-l">${b + 1}-blok (64 bayt = 512 bit)</div>`;
    h += '<div class="bytes">';
    for (let j = 0; j < 64; j++) {
      const i = b * 64 + j, v = p.padded[i];
      let cls, nw = false;
      if (i < len) cls = 'msg';
      else if (i === len) { cls = step >= 1 ? 'one' : 'pend'; nw = step === 1; }
      else if (i >= lenStart) { cls = step >= 3 ? 'len' : 'pend'; nw = step === 3; }
      else { cls = step >= 2 ? 'zero' : 'pend'; nw = step === 2; }
      const d = nw ? Math.min(j * 0.03, 1.6) : 0;
      h += `<b class="${cls}${nw ? ' new' : ''}" style="--d:${d}">${hex8(v).slice(6)}</b>`;
    }
    h += '</div>';
  }
  h += `<div class="lgd"><span><i style="background:rgba(56,189,248,.5)"></i>xabar baytlari</span><span><i style="background:rgba(251,191,36,.6)"></i>"1" biti (80)</span><span><i style="background:rgba(255,255,255,.2)"></i>nollar</span><span><i style="background:rgba(244,114,182,.6)"></i>uzunlik (64 bit)</span></div>`;
  if (step === 1) h += `<p class="formula">80 hex = <em>1000 0000</em> ikkilikda: birinchi bit 1, qolgani 0.</p>`;
  if (step === 3) h += `<p class="formula">Uzunlik: ${len} bayt × 8 = <em>${p.bitLen}</em> bit = <em>${p.bitLen.toString(16).padStart(16, '0')}</em> (hex, 64 bit)</p>`;
  return h;
}

function wordsViz(words) {
  return `<div class="words">${words.map((w, j) => it(`W${j}`, w, wcol(j), { d: j * 0.12, size: 66, glow: true })).join('')}</div>`;
}

function wgrid(t, W, src = {}) {
  let h = '<div class="wgrid">';
  for (let j = 0; j < 64; j++) {
    let cls = 'wc', st = `--c:${src[j] || wcol(j)}`;
    if (j < t) cls += ' done'; if (src[j]) cls += ' src'; if (j === t) cls += ' cur';
    h += `<div class="${cls}" style="${st}">W${j}</div>`;
  }
  return h + '</div>';
}

function schedViz(bl, s) {
  const t = s.t;
  const c1 = '#fb7185', c2 = '#38bdf8', c3 = '#facc15', c4 = '#4ade80';
  const src = { [t - 2]: c1, [t - 7]: c2, [t - 15]: c3, [t - 16]: c4 };
  return `<div class="sch"><div class="schl"><div class="vcols">
    <div class="box"><h4>σ1 — <b>W${t - 2}</b> ni aralashtiramiz</h4>
      <div class="row">${it(`W${t - 2}`, s.w2, c1, { d: 0.1 })}${opx('→ σ1 →', 0.4)}${it('σ1', s.s1, c1, { d: 0.7, reveal: 0.02 })}</div></div>
    <div class="box"><h4>σ0 — <b>W${t - 15}</b> ni aralashtiramiz</h4>
      <div class="row">${it(`W${t - 15}`, s.w15, c3, { d: 0.1 })}${opx('→ σ0 →', 0.4)}${it('σ0', s.s0, c3, { d: 0.7, reveal: 0.02 })}</div></div>
  </div>
  <div class="box" style="margin-top:12px"><h4>Yig'indi — kirib kelayotgan ranglar: <b>W${t - 7}</b> va <b>W${t - 16}</b> (eski so'zlar)</h4>
    <div class="row">${it('σ1', s.s1, c1, { d: 1.7 })}${opx('+', 1.9)}${it(`W${t - 7}`, s.w7, c2, { d: 2, fly: 1, fx: -90, fy: -60 })}${opx('+', 2.6)}${it('σ0', s.s0, c3, { d: 2.7 })}${opx('+', 2.9)}${it(`W${t - 16}`, s.w16, c4, { d: 3, fly: 1, fx: 90, fy: -60 })}${opx('=', 3.8, 1)}${it(`W${t}`, s.val, WCOL, { d: 3.9, reveal: 0.025, glow: true, size: 66 })}</div>
    <p class="formula">W${t} = σ1(W${t - 2}) + W${t - 7} + σ0(W${t - 15}) + W${t - 16}  <em>(mod 2³²)</em></p></div>
  </div>${wgrid(t, null, src)}</div>`;
}

const regRow = (vals, o = {}) => `<div class="regwrap"><div class="slots">${NM.map((n, i) => `<span style="color:${REG[i]}">${n}</span>`).join('')}</div><div class="regs" id="regs">${vals.map((v, i) => `<div class="rn${o.pop ? ' fi' : ''}" style="transform:translateX(${i * 100}px);--d:${i * 0.12}">${ring(v, { size: 84, color: REG[i], cls: 'glow' })}</div>`).join('')}</div></div>`;

const itr = (l, v, c, o = {}) => it(l, v, c, { size: 54, ...o });

function roundViz(bl, r) {
  const [a, b, c, d, e, f, g, h] = r.before, t = r.t;
  const T1 = `<div class="box"><h4><b>T1</b> — e tomoni <span style="color:${KCOL}">(K${t})</span> va <span style="color:#fff">(W${t})</span> kirib keladi</h4>
    <div class="row">${itr('e', e, REG[4], { d: 0.1 })}${opx('→ Σ1 →', 0.35)}${itr('Σ1(e)', r.sig1, SIG, { d: 0.6, reveal: 0.02 })}</div>
    <div class="row">${itr('e', e, REG[4], { d: 0.9 })}${itr('f', f, REG[5], { d: 1 })}${itr('g', g, REG[6], { d: 1.1 })}${opx('→ Ch →', 1.3)}${itr('Ch', r.ch, CHM, { d: 1.5, reveal: 0.02 })}</div>
    <div class="row">${itr('h', h, REG[7], { d: 2 })}${opx('+', 2.1)}${itr('Σ1', r.sig1, SIG, { d: 2.15 })}${opx('+', 2.2)}${itr('Ch', r.ch, CHM, { d: 2.25 })}${opx('+', 2.3)}${itr(`K${t}`, r.K, KCOL, { d: 2.4, fly: 1, fx: -110, fy: -90 })}${opx('+', 3)}${itr(`W${t}`, r.W, WCOL, { d: 3.1, fly: 1, fx: 110, fy: -90 })}${opx('=', 3.7, 1)}${itr('T1', r.T1, TT, { d: 3.8, reveal: 0.02, glow: true })}</div>
    <p class="formula">T1 = h + Σ1(e) + Ch(e,f,g) + <em>K${t}</em> + <em>W${t}</em></p></div>`;
  const T2 = `<div class="box"><h4><b>T2</b> — a tomoni</h4>
    <div class="row">${itr('a', a, REG[0], { d: 0.1 })}${opx('→ Σ0 →', 0.35)}${itr('Σ0(a)', r.sig0, SIG, { d: 0.6, reveal: 0.02 })}</div>
    <div class="row">${itr('a', a, REG[0], { d: 0.9 })}${itr('b', b, REG[1], { d: 1 })}${itr('c', c, REG[2], { d: 1.1 })}${opx('→ Maj →', 1.3)}${itr('Maj', r.maj, CHM, { d: 1.5, reveal: 0.02 })}</div>
    <div class="row">${itr('Σ0', r.sig0, SIG, { d: 2.4 })}${opx('+', 2.6)}${itr('Maj', r.maj, CHM, { d: 2.7 })}${opx('=', 3.2, 1)}${itr('T2', r.T2, TT, { d: 3.3, reveal: 0.02, glow: true })}</div>
    <p class="formula">T2 = Σ0(a) + Maj(a,b,c)</p></div>`;
  const nv = `<div class="box"><h4>Yangi <b>a</b> va <b>e</b> yasaladi, qolganlari bir joy suriladi</h4>
    <div class="newvals">
      <div class="row">${itr('T1', r.T1, TT, { d: 4.7 })}${opx('+', 4.8)}${itr('T2', r.T2, TT, { d: 4.9 })}${opx('=', 5, 1)}${itr('yangi a', r.after[0], REG[0], { d: 5.1, reveal: 0.02, glow: true })}</div>
      <div class="row">${itr('d', d, REG[3], { d: 4.7 })}${opx('+', 4.8)}${itr('T1', r.T1, TT, { d: 4.9 })}${opx('=', 5, 1)}${itr('yangi e', r.after[4], REG[4], { d: 5.1, reveal: 0.02, glow: true })}</div>
    </div></div>`;
  return `${regRow(r.before)}<div class="regsep"></div><div class="rr"><div class="vcols3">${T1}${T2}${nv}</div></div>`;
}

function runRound(r) {
  setSub([0, 1]);
  later(() => setSub([2]), 4.7);
  later(() => {
    setSub([3]);
    const regs = $('#regs'); if (!regs) return;
    const n = [...regs.children];
    n[7].classList.add('out');
    for (let i = 0; i < 7; i++) {
      n[i].style.transform = `translateX(${(i + 1) * 100}px)`;
      $('svg', n[i]).style.setProperty('--c', REG[i + 1]);
    }
    n[3].innerHTML = ring(r.after[4], { size: 84, color: REG[4], cls: 'glow' });
    n[3].classList.add('pop');
    const na = document.createElement('div');
    na.className = 'rn born'; na.style.transform = 'translateX(0)';
    na.innerHTML = ring(r.after[0], { size: 84, color: REG[0], cls: 'glow' });
    regs.appendChild(na);
  }, 5.9);
}

function finalViz(bl) {
  const row = (lab, arr, d0, colorFn, o = {}) => `<div class="blk-l">${lab}</div><div class="eight">${arr.map((v, i) => it(o.names ? o.names[i] : `H${i}`, v, colorFn(i), { d: d0 + i * 0.15, size: 62, ...o.opt })).join('')}</div>`;
  return row('Oldingi holat (H0…H7)', bl.Hin, 0, (i) => REG[i])
    + row('64 raunddan keyingi a…h', bl.work, 1.4, (i) => REG[i], { names: NM })
    + row('Yig\'indi (mod 2³²) = yangi H0…H7', bl.Hout, 3.2, () => '#ffffff', { names: bl.Hout.map((_, i) => `H${i}'`), opt: { reveal: 0.02, glow: true } });
}

function digestViz(tr) {
  return `<div class="digest">${tr.digest.map((w, i) => `<span style="color:${REG[i]};--d:${i * 0.3}">${hex8(w)}</span>`).join('')}</div>
    <p class="muted">Rang — qaysi so'z (H0…H7) ekanini bildiradi. Jami 8 × 32 = 256 bit = 64 hex belgi.</p>
    <div class="eight" style="margin-top:12px">${tr.digest.map((w, i) => it(`H${i}`, w, REG[i], { d: i * 0.2, size: 70, glow: true })).join('')}</div>
    <div class="verify" id="verify">Tekshirilmoqda…</div>
    <button class="btn sm" id="copyH" style="margin-top:8px">📋 Xeshni nusxalash</button>`;
}

/* --- kadrlarni yig'ish --- */
function buildFrames(bytes, tr) {
  const F = [];
  const nB = tr.blocks.length;
  const pre = (b) => (nB > 1 ? `${b + 1}/${nB}-blok · ` : '');
  const len = bytes.length;
  const add = (f) => { f.id = F.length; F.push(f); };

  add({ node: 0, blk: 0, stage: 0, badge: 'MATN', title: 'Matn → baytlar → bitlar', dur: 4,
    say: "Kompyuter harflarni emas, <b>sonlarni</b> biladi. Shuning uchun har bir belgi avval <b>bayt</b>ga (0…255 orasidagi son), so'ng <b>8 ta bit</b>ga aylanadi. Jadvalda <b style=\"color:var(--pk)\">1</b> lar pushti rangda.",
    viz: () => textViz(bytes) });
  const padSay = [
    null,
    "SHA-256 xabarni <b>512 bitli (64 baytli)</b> bloklarda ishlaydi. Xabar odatda aniq shu uzunlikda bo'lmaydi, shuning uchun uni <b>to'ldiramiz</b>. <b>1-qadam:</b> xabar oxiriga bitta <b>1</b> biti qo'yamiz (bayt ko'rinishida <code>80</code>).",
    "<b>2-qadam:</b> oxirgi 8 baytga joy qoldirib, blokning qolgan qismini <b>nollar</b> bilan to'ldiramiz.",
    `<b>3-qadam:</b> oxirgi 8 baytga xabarning <b>asl uzunligi</b> (bit hisobida) yoziladi: ${len} bayt = <b>${len * 8}</b> bit. Endi xabar aniq ${tr.pad.blocks} ta blokka teng.${tr.pad.blocks > 1 ? ' (Xabar uzun bo\'lgani uchun 1 emas, bir nechta blok chiqdi.)' : ''}`,
  ];
  [1, 2, 3].forEach((s) => add({ node: 1, blk: 0, stage: 0, badge: 'TO\'LDIRISH', title: `To'ldirish (padding) — ${s}/3`, dur: 3.8, say: padSay[s], viz: () => padViz(tr.pad, bytes, s) }));

  tr.blocks.forEach((bl, b) => {
    add({ node: 2, blk: b, stage: 1, badge: 'JADVAL', title: `${pre(b)}Blok → 16 ta so'z`, dur: 4.5,
      say: "64 bayt = 16 ta <b>32 bitli so'z</b> (har 4 bayt — 1 so'z). Har bir so'z — bitta <b>halqa</b>: W0, W1 … W15. Bu xabarning o'zi.",
      viz: () => wordsViz(bl.words) });
    add({ node: 3, blk: b, prog: 0, stage: 1, badge: 'JADVAL', title: `${pre(b)}16 ta so'zni 64 tagacha o'stiramiz`, dur: 4,
      say: "Keyingi bosqichga <b>64 ta</b> so'z kerak, bizda esa 16 ta. Qolgan <b>48 tasini</b> eskilarini aralashtirib yasaymiz: har yangi so'z to'rtta eskisidan olinadi. Pastda kataklar birin-ketin to'lib boradi.",
      viz: () => wgrid(16, bl.W) });
    bl.sched.forEach((s) => add({ node: 3, blk: b, prog: (s.t - 15) / 48, stage: 1, badge: 'JADVAL', title: `${pre(b)}W${s.t} ni yasash`, dur: 6,
      say: `Yangi <b>W${s.t}</b> uchun to'rt qiymat qo'shiladi: <b>σ1(W${s.t - 2})</b>, <b>W${s.t - 7}</b>, <b>σ0(W${s.t - 15})</b>, <b>W${s.t - 16}</b>. Kirib kelayotgan qiymatlar turli rangda. Yig'indi 2³² dan oshsa — ortig'i tashlanadi.`,
      viz: () => schedViz(bl, s) }));

    add({ node: 4, blk: b, stage: 2, badge: 'RAUND', title: `${pre(b)}Hisoblash mashinasi: a, b, c, d, e, f, g, h`, dur: 5,
      say: `Endi asosiy qism. Sakkizta <b>ishchi halqa</b> a…h bor. Boshida ular ${b === 0 ? "<b>H0…H7</b> boshlang'ich qiymatlarga (§3 jadval) teng" : 'oldingi blokning natijasiga teng'}. Keyin <b>64 marta</b> bir xil aylanma bajariladi. Har aylanishda <b style="color:${KCOL}">K[t]</b> konstantasi va <b>W[t]</b> so'zi <b>kirib keladi</b>.`,
      viz: () => `${regRow(bl.Hin, { pop: 1 })}<div class="lgd" style="margin-top:14px"><span><i style="background:${KCOL}"></i>K[t] — jadvaldagi konstanta</span><span><i style="background:#fff"></i>W[t] — xabar so'zi</span><span><i style="background:${SIG}"></i>Σ — aylantirib aralashtirish</span><span><i style="background:${CHM}"></i>Ch / Maj — tanlov / ovoz</span><span><i style="background:${TT}"></i>T1, T2 — oraliq yig'indilar</span></div>` });
    bl.rounds.forEach((r) => add({ node: 5, blk: b, prog: (r.t + 1) / 64, stage: 2, badge: `RAUND ${r.t + 1}/64`, title: `${pre(b)}${r.t + 1}-raund`, dur: 7,
      say: `<b>${r.t + 1}-raund.</b> Chap tomonda <b>T1</b>, o'ngda <b>T2</b> hisoblanadi (kirib kelayotgan <b style="color:${KCOL}">K${r.t}</b> va <b>W${r.t}</b> ni kuzating). Keyin halqalar bir joy suriladi: a→b→c→d, e→f→g→h, <b>h chiqib ketadi</b>, yangi <b>a = T1+T2</b>, yangi <b>e = d+T1</b>.`,
      viz: () => roundViz(bl, r), run: () => runRound(r) }));

    add({ node: 6, blk: b, stage: 3, badge: 'NATIJA', title: `${pre(b)}Natijani boshlang'ich qiymatga qo'shish`, dur: 7,
      say: `64 raunddan keyin a…h ni boshlang'ich <b>H0…H7</b> ga <b>bit-ma-bit emas, son sifatida qo'shamiz</b> (mod 2³²).${b < nB - 1 ? ' Bu yangi 8 so\'z keyingi blokning boshlang\'ich qiymati bo\'ladi.' : ' Bu — yakuniy xesh!'}`,
      viz: () => finalViz(bl) });
  });

  add({ node: 7, blk: nB - 1, stage: 3, badge: 'XESH', title: 'Tayyor: 256 bitli xesh', dur: 6,
    say: `Sakkiz so'zni ketma-ket yozsak — <b>SHA-256 xesh</b>. Matn: <code>${escapeH(msgText).slice(0, 40) || '(bo\'sh)'}</code>`,
    viz: () => digestViz(tr),
    run: () => {
      const v = $('#verify');
      const done = (ok) => { if (v) { v.className = 'verify ' + (ok ? 'ok' : 'bad'); v.textContent = ok ? '✓ Brauzerning o\'z SHA-256 hisobi bilan to\'liq mos keldi' : '✗ Brauzer natijasi bilan mos kelmadi'; } };
      if (crypto?.subtle) crypto.subtle.digest('SHA-256', bytes).then((d) => done([...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('') === tr.hex)).catch(() => { if (v) v.textContent = ''; });
      else if (v) v.textContent = '';
      $('#copyH').onclick = () => { navigator.clipboard?.writeText(tr.hex); $('#copyH').textContent = '✓ Nusxalandi'; };
    } });
  return F;
}

const escapeH = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* --- Umumiy sxema (infografik): hozirgi qadamni ko'rsatib turadi --- */
const MAP = [
  { t: 'Matn', d: 'Harflar → baytlar → bitlar', c: '#38bdf8' },
  { t: "To'ldirish", d: '1 + nollar + uzunlik = 512 bit', c: '#60a5fa' },
  { t: "16 ta so'z", d: 'Blok → W0 … W15', c: '#a78bfa' },
  { t: 'Xabar jadvali', d: 'W16 … W63 yasaladi (48 marta)', c: '#e879f9' },
  { t: 'Boshlanish', d: 'a…h ← H0…H7', c: '#f472b6' },
  { t: '64 raund', d: 'Har raundda K[t] va W[t] kirib keladi', c: '#fb923c', sub: ['T1: Σ1 + Ch + h + K + W', 'T2: Σ0 + Maj', 'Yangi a = T1+T2, e = d+T1', 'a…h bir joy suriladi'] },
  { t: "Qo'shish", d: 'H0…H7 + a…h (mod 2³²)', c: '#facc15' },
  { t: 'Xesh', d: "8 so'z = 256 bit", c: '#4ade80' },
];
function buildMap(big) {
  let h = '';
  MAP.forEach((n, i) => {
    h += `${i ? '<span class="marr">▶</span>' : ''}<div class="mn${n.sub ? ' wide' : ''}" data-node="${i}" style="--c:${n.c}">
      <div class="mt"><i>${i + 1}</i>${n.t}</div>${big ? `<div class="md">${n.d}</div>` : ''}
      ${n.sub && big ? `<ul class="msub">${n.sub.map((s, k) => `<li data-sub="${k}">${s}</li>`).join('')}</ul>` : ''}
      <div class="mbar"><b></b></div><div class="mlab"></div></div>`;
  });
  return h;
}
$('#mapBig').innerHTML = buildMap(true);
function setSub(arr) { $$('.msub li').forEach((li) => li.classList.toggle('on', arr.includes(+li.dataset.sub))); }
function updateMap(f) {
  const nB = trace.blocks.length;
  $$('[data-node]').forEach((el) => {
    const i = +el.dataset.node;
    const state = i < f.node ? 'done' : i === f.node ? 'cur' : 'todo';
    el.dataset.state = state;
    const p = state === 'done' ? 1 : state === 'cur' ? (f.prog ?? 0.5) : 0;
    $('.mbar b', el).style.width = `${Math.round(p * 100)}%`;
    let lab = '';
    if (i === 5 && state === 'cur') lab = `raund ${Math.round(f.prog * 64)}/64`;
    else if (i === 3 && state === 'cur') lab = `W${16 + Math.min(47, Math.round(f.prog * 48))}`;
    if (nB > 1 && i >= 2 && i <= 6 && state !== 'todo') lab += `${lab ? ' · ' : ''}blok ${f.blk + 1}/${nB}`;
    $('.mlab', el).textContent = lab;
  });
  if (f.node !== 5) setSub([]);
}
document.addEventListener('click', (e) => {
  const n = e.target.closest('[data-node]'); if (!n) return;
  const i = +n.dataset.node, cb = frames[cur].blk;
  let idx = frames.findIndex((f) => f.node === i && f.blk === cb);
  if (idx < 0) idx = frames.findIndex((f) => f.node === i);
  stopAuto(); show(idx);
});

/* --- boshqaruv --- */
let msgText = '';

function show(i) {
  clearTimers();
  cur = Math.max(0, Math.min(frames.length - 1, i));
  const f = frames[cur];
  $('#stBadge').textContent = f.badge;
  $('#stTitle').textContent = f.title;
  $('#stSay').innerHTML = f.say;
  $('#stCount').textContent = `${cur + 1} / ${frames.length}`;
  $('#viz').innerHTML = f.viz();
  f.run && f.run();
  $('#slider').max = frames.length - 1; $('#slider').value = cur;
  $('#bPrev').disabled = cur === 0; $('#bNext').disabled = cur === frames.length - 1;
  updateMap(f);
}

function stopAuto() { autoOn = false; clearTimeout(autoT); $('#bPlay').textContent = '▶ Avto'; }
function tick() {
  clearTimeout(autoT);
  if (!autoOn) return;
  autoT = setTimeout(() => {
    if (cur >= frames.length - 1) return stopAuto();
    show(cur + 1); tick();
  }, frames[cur].dur * 1000 * KS);
}
$('#bPlay').onclick = () => {
  if (autoOn) return stopAuto();
  if (cur >= frames.length - 1) show(0);
  autoOn = true; $('#bPlay').textContent = '⏸ To\'xtatish'; tick();
};
$('#bNext').onclick = () => { stopAuto(); show(cur + 1); };
$('#bPrev').onclick = () => { stopAuto(); show(cur - 1); };
$('#slider').oninput = (e) => { stopAuto(); show(+e.target.value); };
$('#speed').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#speed button').forEach((x) => x.classList.toggle('act', x === b));
  setKS(reduce ? 0.05 : 1 / +b.dataset.s);
  if (autoOn) tick();
};
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') { stopAuto(); show(cur + 1); }
  else if (e.key === 'ArrowLeft') { stopAuto(); show(cur - 1); }
  else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('#bPlay').click(); }
});

/* --- kirish matni --- */
let deb = null;
function load() {
  stopAuto();
  let text = $('#msg').value;
  let bytes = enc.encode(text);
  const MAXB = 183; // 3 blokkacha
  if (bytes.length > MAXB) { while (enc.encode(text).length > MAXB) text = text.slice(0, -1); bytes = enc.encode(text); }
  msgText = text; msgBytes = bytes;
  trace = sha256Trace(bytes);
  const p = trace.pad;
  $('#msgInfo').textContent = `${bytes.length} bayt · ${p.blocks} blok`;
  frames = buildFrames(bytes, trace);
  show(0);
}
$('#msg').oninput = () => { clearTimeout(deb); deb = setTimeout(load, 250); };
$$('.presets button').forEach((b) => b.onclick = () => { $('#msg').value = b.dataset.p; load(); });
load();
// umumiy sxemadan kelgan havola: player.html?node=5
{
  const n = new URLSearchParams(location.search).get('node');
  if (n !== null) { const i = frames.findIndex((f) => f.node === +n); if (i >= 0) show(i); }
}

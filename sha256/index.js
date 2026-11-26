// Umumiy infografik: SHA-256 ning butun tuzilishi bitta SVG sxemada (1600×900).
import { H0, K, hex8 } from './sha.js';
import { ring, REG, NM, SIG, CHM, TT, WCOL, KCOL, wcol } from './ring.js';

const MU = '#8f9ac6', TX = '#e9edff', CAP = '#b9c2e8';
const defs = new Map();
const mk = (c) => {
  const id = 'm' + c.replace('#', '');
  if (!defs.has(id)) defs.set(id, `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`);
  return id;
};
const path = (d, c, o = {}) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 2.6}" stroke-linejoin="round" ${o.dash ? 'stroke-dasharray="7 6"' : ''} ${o.noarrow ? '' : `marker-end="url(#${mk(c)})"`} class="${o.flow ? 'flow' : ''}"/>`;
const rect = (x, y, w, h, c, o = {}) => `<rect class="bx" x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 16}" fill="${o.fill || 'rgba(255,255,255,.04)'}" stroke="${c}" stroke-opacity="${o.so ?? 0.55}" stroke-width="${o.sw || 1.6}"/>`;
const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || CAP}" text-anchor="${o.a || 'start'}" ${o.mono ? 'class="mono"' : ''}>${s}</text>`;
const lines = (x, y, arr, o = {}) => arr.map((s, i) => txt(x, y + i * (o.lh || 19), s, o)).join('');
const badge = (x, y, n, c = '#fbbf24') => `<circle cx="${x}" cy="${y}" r="14" fill="${c}"/><text x="${x}" y="${y + 5}" font-size="15" font-weight="800" fill="#06101a" text-anchor="middle">${n}</text>`;
const mini = (x, y, size, val, color) => ring(val, { size, color, text: false, dot: 2.1 }).replace('<svg class="ring ', `<svg x="${x}" y="${y}" class="ring `);
const blk = (node, inner) => `<g class="blk" data-node="${node}">${inner}</g>`;
const tint = (c, a = 0.14) => `color-mix(in srgb, ${c} ${a * 100}%, transparent)`;

let s = '';

/* ---------- Yuqori qator: tayyorlash zanjiri ---------- */
const xs = [16, 282, 548, 814, 1080, 1346], BW = 236, BY = 66, BH = 170;
const boxes = [
  { n: 1, node: 0, t: 'Kirish matni', c: '#38bdf8', l: ['Istalgan matn: «Salom»,', 'parol, hatto butun fayl.', 'Kompyuter uni sonlarga', 'aylantirib oladi.'], ico: '📝' },
  { n: 1, node: 0, t: 'Baytlar → bitlar', c: '#60a5fa', l: ['Har harf — 8 ta 0 yoki 1:', '«S» → 01010011. Butun', 'xabar uzun bitlar', 'qatoriga aylanadi.'], ico: '🔢' },
  { n: 2, node: 1, t: "To'ldirish", c: '#a78bfa', l: ["Oxiriga qo'shamiz: bitta", '«1», keyin nollar, keyin', 'xabar uzunligi. Natija', "aniq 512 bit bo'ladi."], ico: '📦' },
  { n: 3, node: 2, t: '512 bitli blok', c: '#e879f9', l: ['512 bit = 16 ta so\'z,', 'har biri 32 bit: W0 … W15.', "Har so'z — bitta rangli", 'halqa.'], ico: '🧱' },
  { n: 4, node: 3, t: 'Xabar jadvali', c: '#f472b6', l: ["16 so'zdan 64 ta so'z", 'yasaladi (eskilarini', 'aralashtirib). Har raundga', 'bittadan W[t] beriladi.'], ico: '🗂️' },
  { n: '', node: 3, t: 'K konstantalari', c: '#a3e635', l: ["64 ta tayyor qat'iy son", '(tub sonlarning ildizi).', 'Hammada bir xil. Har', 'raundga bittadan K[t].'], ico: '' },
];
boxes.forEach((b, i) => {
  const x = xs[i];
  let g = rect(x, BY, BW, BH, b.c, { fill: tint(b.c, 0.07) });
  if (b.n) g += badge(x + 24, BY + 26, b.n, b.c);
  g += txt(x + (b.n ? 46 : 18), BY + 32, b.t, { s: 18, w: 700, c: TX });
  if (b.ico) g += txt(x + BW - 16, BY + 34, b.ico, { s: 24, a: 'end' });
  g += lines(x + 18, BY + 64, b.l, { s: 13.5, lh: 19 });
  if (i === 3) for (let k = 0; k < 16; k++) g += `<rect x="${x + 18 + k * 13}" y="${BY + 148}" width="10" height="10" rx="3" fill="${wcol(k)}"/>`;
  if (i === 4) for (let r = 0; r < 3; r++) for (let k = 0; k < 16; k++) g += `<rect x="${x + 18 + k * 13}" y="${BY + 132 + r * 11}" width="10" height="8" rx="2.5" fill="${wcol(r * 16 + k)}" opacity="${r === 0 ? 1 : 0.4}"/>`;
  if (i === 5) g += mini(x + BW - 62, BY + 8, 50, K[0], b.c);
  s += blk(b.node, g);
});
for (let i = 0; i < 4; i++) s += path(`M${xs[i] + BW + 3} ${BY + 78} H${xs[i + 1] - 3}`, MU, { flow: 1 });
s += txt(1196, 262, "↓ ikkalasi ham 6-qadamdagi mashinaga kirib boradi", { s: 12.5, c: MU, a: 'start' });
s += txt(16, 262, "▶ strelkalar — ma'lumot yo'nalishi   ·   rangli halqa = bitta 32 bitli son   ·   1–8 raqamli doiralar — qadamlar tartibi   ·   istalgan blokni bossangiz, jonli ko'rsatiladi", { s: 12.5, c: MU });

/* ---------- Pastki panel: hisob-kitob mashinasi ---------- */
s += rect(16, 272, 1568, 612, '#ffffff', { fill: 'rgba(255,255,255,.02)', so: 0.16, r: 22 });
s += txt(36, 298, "HISOB-KITOB MASHINASI — xesh shu yerda yasaladi", { s: 14, w: 800, c: MU });
s += txt(440, 298, "Oddiy tilda: 8 ta son (a…h) 64 marta aralashtiriladi; oxirida H0…H7 ga qo'shilib, xesh tayyor bo'ladi.", { s: 13, c: CAP });

const CY0 = 366, PITCH = 56, CH = 52;
const cell = (x, i, val, label) => {
  const y = CY0 + i * PITCH, c = REG[i];
  return rect(x, y, 190, CH, c, { fill: tint(c, 0.12), r: 12, so: 0.7 })
    + txt(x + 16, y + 35, label, { s: 25, w: 800, c })
    + txt(x + 58, y + 32, hex8(val), { s: 14, w: 600, c: TX, mono: 1 })
    + mini(x + 142, y + 2, 48, val, c);
};
/* H0..H7 xotirasi */
let gH = txt(60, 328, "H0 … H7 xotirasi", { s: 15, w: 700, c: TX }) + txt(60, 346, "natija shu yerda yig'iladi", { s: 12, c: MU });
for (let i = 0; i < 8; i++) gH += cell(40, i, H0[i], `H${i}`);
s += blk(4, badge(40, 331, 5) + gH);
/* a..h xotirasi */
let gM = txt(300, 328, 'a … h ishchi xotira', { s: 15, w: 700, c: TX }) + txt(300, 346, "har raund 1 pog'ona ↓", { s: 12, c: MU });
for (let i = 0; i < 8; i++) gM += cell(300, i, H0[i], NM[i]);
s += blk(4, gM);

/* boshida nusxa ko'chiriladi */
s += path(`M233 ${CY0 + 26} H297`, MU, { dash: 1 });
s += txt(236, CY0 + 18, 'boshida', { s: 10.5, c: MU });

/* T2 qutisi */
const BX = 560, BW2 = 470;
let g2 = rect(BX, 366, BW2, 206, TT, { fill: tint(TT, 0.05), so: 0.45 }) + badge(BX + 22, 392, 6) + txt(BX + 44, 398, "T2 — a tomoni", { s: 16, w: 700, c: TX });
g2 += rect(BX + 18, 414, 190, 52, SIG, { fill: tint(SIG, 0.16), r: 12, so: 0.8 }) + txt(BX + 30, 437, 'Σ0 (a)', { s: 17, w: 800, c: SIG }) + txt(BX + 30, 456, 'a ni aylantirib aralashtiradi', { s: 11.5 });
g2 += rect(BX + 18, 484, 190, 52, CHM, { fill: tint(CHM, 0.16), r: 12, so: 0.8 }) + txt(BX + 30, 507, 'Maj (a, b, c)', { s: 17, w: 800, c: CHM }) + txt(BX + 30, 526, 'uch qiymat «ovoz beradi»', { s: 11.5 });
g2 += `<circle cx="${BX + 282}" cy="475" r="17" fill="rgba(255,255,255,.08)" stroke="${MU}"/>` + txt(BX + 282, 482, '+', { s: 22, w: 700, c: TX, a: 'middle' });
g2 += path(`M${BX + 210} 440 H${BX + 282} V456`, SIG) + path(`M${BX + 210} 510 H${BX + 282} V494`, CHM);
g2 += rect(BX + 345, 449, 112, 52, TT, { fill: tint(TT, 0.18), r: 12, so: 0.9 }) + txt(BX + 401, 473, 'T2', { s: 20, w: 800, c: TT, a: 'middle' }) + txt(BX + 401, 491, 'oraliq natija', { s: 11, a: 'middle' });
g2 += path(`M${BX + 301} 475 H${BX + 343}`, TT);
s += blk(5, g2);

/* T1 qutisi */
let g1 = rect(BX, 592, BW2, 240, TT, { fill: tint(TT, 0.05), so: 0.45 }) + badge(BX + 22, 618, 6) + txt(BX + 44, 624, "T1 — e tomoni", { s: 16, w: 700, c: TX });
const chip = (x, y, w, h, c, t, sub) => rect(x, y, w, h, c, { fill: tint(c, 0.16), r: 12, so: 0.8 }) + txt(x + 12, y + 22, t, { s: 17, w: 800, c }) + (sub ? txt(x + 12, y + 40, sub, { s: 11.5 }) : '');
g1 += chip(BX + 18, 636, 175, 52, SIG, 'Σ1 (e)', 'e ni aylantirib aralashtiradi');
g1 += chip(BX + 18, 696, 175, 52, CHM, 'Ch (e, f, g)', 'e «tanlaydi»: f yoki g');
g1 += chip(BX + 18, 756, 175, 52, REG[7], 'h', 'eski qiymat, o\'zi qo\'shiladi');
g1 += `<circle cx="${BX + 290}" cy="722" r="19" fill="rgba(255,255,255,.08)" stroke="${MU}"/>` + txt(BX + 290, 730, '+', { s: 24, w: 700, c: TX, a: 'middle' });
g1 += path(`M${BX + 195} 662 H${BX + 290} V701`, SIG) + path(`M${BX + 195} 722 H${BX + 269}`, CHM) + path(`M${BX + 195} 782 H${BX + 290} V743`, REG[7]);
g1 += chip(BX + 345, 626, 112, 48, WCOL, 'W[t]', 'xabar so\'zi');
g1 += chip(BX + 345, 684, 112, 48, KCOL, 'K[t]', 'konstanta');
g1 += rect(BX + 345, 762, 112, 54, TT, { fill: tint(TT, 0.18), r: 12, so: 0.9 }) + txt(BX + 401, 787, 'T1', { s: 20, w: 800, c: TT, a: 'middle' }) + txt(BX + 401, 805, 'oraliq natija', { s: 11, a: 'middle' });
g1 += path(`M${BX + 343} 652 L${BX + 304} 708`, WCOL, { w: 2.2 }) + path(`M${BX + 343} 708 L${BX + 308} 716`, KCOL, { w: 2.2 }) + path(`M${BX + 301} 738 Q${BX + 320} 788 ${BX + 343} 790`, TT);
s += blk(5, g1);

/* xotiradan qutilarga */
s += path(`M493 446 H${BX - 3}`, MU) + txt(497, 438, 'a, b, c', { s: 12, c: MU });
s += path(`M493 700 H${BX - 3}`, MU) + txt(497, 692, 'e, f, g, h', { s: 12, c: MU });

/* tashqaridan W va K kirib keladi */
s += path(`M1198 ${BY + BH + 2} V650 H${BX + BW2 - 8}`, WCOL, { flow: 1 });
s += path(`M1550 ${BY + BH + 2} V708 H${BX + BW2 - 8}`, KCOL, { flow: 1 });
s += txt(1204, 330, 'W[t]', { s: 13, w: 700, c: WCOL }) + txt(1514, 330, 'K[t]', { s: 13, w: 700, c: KCOL, a: 'end' });

/* qo'shgichlar: yangi a va yangi e */
const AX = 1068;
s += blk(5,
  rect(AX, 372, 130, 92, REG[0], { fill: tint(REG[0], 0.16), r: 14, so: 0.9 }) + txt(AX + 65, 405, 'yangi a', { s: 17, w: 800, c: REG[0], a: 'middle' }) + txt(AX + 65, 427, '= T1 + T2', { s: 15, w: 600, c: TX, a: 'middle', mono: 1 }) + txt(AX + 65, 448, 'ikkalasini qo\'shamiz', { s: 11, a: 'middle' })
  + rect(AX, 706, 130, 92, REG[4], { fill: tint(REG[4], 0.16), r: 14, so: 0.9 }) + txt(AX + 65, 739, 'yangi e', { s: 17, w: 800, c: REG[4], a: 'middle' }) + txt(AX + 65, 761, '= d + T1', { s: 15, w: 600, c: TX, a: 'middle', mono: 1 }) + txt(AX + 65, 782, 'd ga T1 qo\'shamiz', { s: 11, a: 'middle' })
  + path(`M${BX + 457} 475 H1043 V404 H${AX - 3}`, TT) + path(`M1054 790 V440 H${AX - 3}`, TT, { noarrow: 0 })
  + path(`M${BX + 457} 790 H${AX - 3}`, TT)
  // d xotiradan
  + rect(1222, 728, 110, 40, REG[3], { fill: tint(REG[3], 0.14), r: 10, so: 0.8 }) + txt(1277, 753, 'd (xotiradan)', { s: 12.5, w: 700, c: REG[3], a: 'middle' }) + path(`M1220 748 H${AX + 133}`, REG[3], { dash: 1 })
);
/* yangi a, yangi e xotiraga qaytadi */
s += path(`M${AX + 65} 370 V334 H470 V364`, REG[0], { w: 2.8 });
s += path(`M${AX + 65} 800 V864 H268 V ${CY0 + 4 * PITCH + 26} H297`.replace('V ', 'V'), REG[4], { w: 2.8 });
s += txt(700, 328, 'yangi a  →  a xotirasiga yoziladi', { s: 12, c: REG[0] });
s += txt(700, 856, 'yangi e  →  e xotirasiga yoziladi', { s: 12, c: REG[4] });

/* 64 marta takrorlanish */
s += blk(5,
  rect(1236, 340, 280, 262, '#fb923c', { fill: tint('#fb923c', 0.07), so: 0.5 })
  + badge(1260, 368, 6, '#fb923c') + txt(1282, 374, '64 marta takrorlanadi', { s: 16, w: 700, c: TX })
  + txt(1376, 436, '×64', { s: 58, w: 800, c: '#fb923c', a: 'middle' })
  + lines(1256, 466, ["Bu mashina 64 marta aylanadi.", "Har aylanishda:", "• W[t] va K[t] kirib keladi", "• T1 va T2 hisoblanadi", "• a…h bir pog'ona suriladi", "• yangi a va e yoziladi"], { s: 13, lh: 20 })
);

/* ⑦ qo'shish va ⑧ xesh */
s += blk(6, path(`M395 ${CY0 + 8 * PITCH - 2} V${CY0 + 8 * PITCH + 14} H150 V${CY0 + 8 * PITCH - 2}`, '#facc15', { w: 2.8 }) + badge(306, CY0 + 8 * PITCH + 38, 7, '#facc15') + txt(328, CY0 + 8 * PITCH + 43, "oxirida: H0…H7 += a…h", { s: 13, w: 700, c: '#facc15' }));
s += blk(7, path(`M60 ${CY0 + 8 * PITCH - 2} V${CY0 + 8 * PITCH + 24}`, REG[7], { w: 2.8 }) + rect(40, CY0 + 8 * PITCH + 26, 190, 40, REG[7], { fill: tint(REG[7], 0.18), r: 12, so: 0.9 }) + badge(64, CY0 + 8 * PITCH + 46, 8, REG[7]) + txt(86, CY0 + 8 * PITCH + 52, 'XESH · 256 bit', { s: 15, w: 800, c: REG[7] }));

/* rang izohi */
const LG = [[REG[0], 'a … h — ishchi qiymatlar'], [SIG, 'Σ — aylantirib aralashtirish'], [CHM, 'Ch / Maj — tanlov / ovoz'], [KCOL, 'K — qat\'iy konstanta'], [WCOL, 'W — xabar so\'zi'], [TT, 'T1, T2 — oraliq yig\'indi']];
s += rect(1352, 724, 216, 150, '#ffffff', { fill: 'rgba(255,255,255,.03)', so: 0.15, r: 14 }) + txt(1366, 744, 'Ranglar izohi', { s: 12.5, w: 800, c: MU });
LG.forEach(([c, t], i) => { s += `<circle cx="1374" cy="${762 + i * 19}" r="5.5" fill="${c}"/>` + txt(1388, 766 + i * 19, t, { s: 12 }); });

document.getElementById('dg').innerHTML = `<defs>${[...defs.values()].join('')}</defs>${s}`;
document.getElementById('dg').addEventListener('click', (e) => {
  const b = e.target.closest('.blk');
  if (b) location.href = `player.html?node=${b.dataset.node}`;
});

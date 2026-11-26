import { SBOX, MIX, gmul, hex, parseHex, textToBlock } from './aes.js';
import { buildFrames } from './frames.js';
import { t, setLang, applyStatic } from './i18n.js';

const $ = (s) => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FIPS = { pt: '3243f6a8885a308d313198a2e0370734', key: '2b7e151628aed2a6abf7158809cf4f3c', ct: '3925841d02dc09fbdc118597196a0b32' };

/* ================= Yordamchilar ================= */
const sup = (n) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const poly = (b) => {
  if (!b) return '0';
  const x = [];
  for (let i = 8; i >= 0; i--) if (b >> i & 1) x.push(i === 0 ? '1' : i === 1 ? 'x' : `x${sup(i)}`);
  return x.join(' + ');
};
const polyS = (b) => `<span class="poly">${poly(b)}</span>`;
const bin = (b, n = 8) => b.toString(2).padStart(n, '0');
const bits = (b, cls = '') =>
  `<span class="bits ${cls}">${[7, 6, 5, 4, 3, 2, 1, 0].map((i) => `<i class="${b >> i & 1 ? 'one' : ''}">${b >> i & 1}</i>${i === 4 ? '<u></u>' : ''}`).join('')}</span>`;
const code = (x) => `<code>${x}</code>`;
const chip = (b, cls = '') => `<span class="bc ${cls}">${hex(b)}</span>`;
const chips = (arr, cls = '') => `<span class="chips">${arr.map((b) => chip(b, cls)).join('')}</span>`;
const rv = (html, d, cls = '') => `<div class="rv ${cls}" style="--d:${d}">${html}</div>`;
const seqr = (start = 0.2, step = 0.8) => { let x = start - step; return () => (x += step); };
const xt = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;
const RULE = () => code('x⁸ = x⁴ + x³ + x + 1');

const mini = (bytes, { active = -1, cols = 4, label = '' } = {}) => {
  let h = '<figure class="mfig"><div class="mini4">';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const i = c * 4 + r;
    h += `<span class="${c < cols ? 'on' : 'off'} ${i === active ? 'act' : ''}">${c < cols ? hex(bytes[i]) : '··'}</span>`;
  }
  return h + `</div>${label ? `<figcaption>${label}</figcaption>` : ''}</figure>`;
};

/* ================= Holat ================= */
let mode = 'text';
let data, frames = [], groups = [], cur = 0, prevCur = -1, speed = 1;
let timers = [], autoT = null, autoOn = false, expected = null;
const cells = [];

/* ================= Vizualizatsiyalar ================= */
function sboxTable(byte) {
  const hi = byte == null ? -1 : byte >> 4, lo = byte == null ? -1 : byte & 15;
  let h = `<table class="sb"><tr><th></th>${[...Array(16)].map((_, c) => `<th class="${c === lo ? 'hc' : ''}">${c.toString(16).toUpperCase()}</th>`).join('')}</tr>`;
  for (let r = 0; r < 16; r++) {
    h += `<tr><th class="${r === hi ? 'hr' : ''}">${r.toString(16).toUpperCase()}</th>`;
    for (let c = 0; c < 16; c++) {
      const cls = r === hi && c === lo ? 'hit' : r === hi ? 'r' : c === lo ? 'c' : '';
      h += `<td class="${cls}">${hex(SBOX[r * 16 + c])}</td>`;
    }
    h += '</tr>';
  }
  return h + '</table>';
}

function mulSteps(a, m, tm) {
  const L = [];
  const X = (v) => { const sh = (v << 1) & 0xff, ovf = v >> 7; return { sh, ovf, res: ovf ? sh ^ 0x1b : sh }; };
  const shiftTxt = (v, x) => `<div class="bl">${bits(v)} <span class="arrow">⟶ ${t('v.m.shift')}</span> <span class="ovf">${x.ovf}</span>${bits(x.sh)}</div>`;
  const reduceTxt = (x) => x.ovf
    ? t('v.m.ovf1', { x8: code('x⁸'), rule: `${RULE()} = ${code('00011011')}`, block: `<div class="bl">${bits(x.sh)} ⊕ ${bits(0x1b)} = ${bits(x.res)}</div>` })
    : t('v.m.ovf0');
  L.push(t('v.m.a', { h: code(hex(a)), bits: bits(a), poly: polyS(a) }));
  if (m === 1) {
    L.push(t('v.m.1', { one: code('1') }));
    L.push(t('v.m.res', { h: code(hex(a)), poly: polyS(a) }));
  } else if (m === 2) {
    const x = X(a);
    L.push(t('v.m.2', { x: code('x'), block: shiftTxt(a, x) }));
    L.push(reduceTxt(x));
    L.push(t('v.m.resb', { h: code(hex(x.res)), bits: bits(x.res), poly: polyS(x.res) }));
  } else {
    const x = X(a);
    L.push(t('v.m.3', { x1: code('x + 1'), block: shiftTxt(a, x) }));
    L.push(reduceTxt(x));
    L.push(t('v.m.3b', { block: `<div class="bl">${bits(x.res)} ⊕ ${bits(a)} = ${bits(x.res ^ a)}</div>` }));
    L.push(t('v.m.res', { h: code(hex(x.res ^ a)), poly: polyS(x.res ^ a) }));
  }
  return L.map((h, i) => rv(`<p>${h}</p>`, tm(), i === L.length - 1 ? 'final' : '')).join('');
}

function formula(rr, col, upto, act) {
  return `<div class="formula"><span class="fl">b<sub>${rr}</sub> =</span>` + [0, 1, 2, 3].map((k) =>
    `<span class="ft ${k === act ? 'act' : ''} ${k < upto ? 'done' : ''}">${hex(MIX[rr][k])}•${hex(col[k])}${k < upto ? ` = <b>${hex(gmul(col[k], MIX[rr][k]))}</b>` : ''}</span>`).join('<span class="fx">⊕</span>') + '</div>';
}

function matrixHTML(col, hlRow = -1) {
  const M = MIX.map((row, r) => `<div class="mrow ${r === hlRow ? 'hl' : ''}">${row.map((v) => `<span>${hex(v)}</span>`).join('')}</div>`).join('');
  const V = col.map((v) => `<div class="mrow"><span class="vv">${hex(v)}</span></div>`).join('');
  const R = col.map((_, r) => `<div class="mrow ${r === hlRow ? 'hl' : ''}"><span class="vv q">b<sub>${r}</sub></span></div>`).join('');
  return `<div class="matrix"><div class="mbr">${M}</div><span class="mop">×</span><div class="mbr col">${V}</div><span class="mop">=</span><div class="mbr col">${R}</div></div>`;
}

const VIZ = {
  none: () => '',

  bytes(f, v) {
    const tm = seqr(0.1, 0.12);
    return `<div class="bytestrip">${[...v.bytes].map((b, i) => rv(
      `${v.text != null ? `<em>${b >= 32 && b < 127 ? String.fromCharCode(b) : '·'}</em>` : ''}<b>${hex(b)}</b><small>${bin(b)}</small><u>#${i}</u>`, tm(), 'bchip')).join('')}</div>
      ${rv(`<p class="mutetxt">${t(v.text != null ? 'v.bytes.t' : 'v.bytes.n')}</p>`, 2.4)}`;
  },

  key(f, v) {
    return `<div class="twocol">${rv(mini(v.key, { label: t('v.key.label') }), 0.2)}${rv(`<p>${t('v.key.text')}</p>`, 0.9)}</div>`;
  },

  plan() {
    const tm = seqr(0.2, 0.7);
    return `<div class="plan">${[['0', 'key'], ['1', 'mix'], ['2', 'shift'], ['3', 'sub']].map(([n, c]) =>
      rv(`<span class="pn ${c}"><b>${t('v.plan.a' + n)}</b><small>${t('v.plan.b' + n)}</small></span>`, tm())).join('<span class="parr">→</span>')}</div>`;
  },

  xorrule(f, v) {
    const tm = seqr(0.2, 0.8);
    return `<div class="twocol">
      ${rv(`<table class="tt"><tr><th>A</th><th>K</th><th>A⊕K</th></tr><tr><td>0</td><td>0</td><td class="z">0</td></tr><tr><td>0</td><td>1</td><td class="o">1</td></tr><tr><td>1</td><td>0</td><td class="o">1</td></tr><tr><td>1</td><td>1</td><td class="z">0</td></tr></table>`, tm())}
      ${rv(mini(v.rk, { label: t('v.xr.key', { r: v.r }) }), tm())}</div>
      ${rv(`<p class="mutetxt">${t('v.xr.note')}</p>`, tm())}`;
  },

  kwintro(f, v) {
    const tm = seqr(0.2, 0.9);
    return `<div class="twocol">${rv(mini(v.prevKey, { label: t('v.kwi.prev', { p: v.r - 1 }) }), tm())}
      ${rv('<span class="bigarrow">→</span>', tm())}
      ${rv(mini(new Uint8Array(16), { cols: 0, label: t('v.kwi.new', { r: v.r }) }), tm())}</div>
      ${rv(`<p class="mutetxt">${t('v.kwi.note')}</p>`, tm())}`;
  },

  kw(f, v) {
    const { info: I, r, wi } = v, i = 4 * r + wi, tm = seqr(0.2, 1.0);
    const side = mini(v.rk, { cols: wi + 1, label: t('v.kw.side', { r }) });
    let body;
    if (wi === 0) {
      const g = I.g;
      body = rv(`<p>${t('v.kw.1', { w: code(`w[${i - 1}]`), c: chips(g.prev) })}</p>`, tm())
        + rv(`<p>${t('v.kw.2', { a: chips(g.prev), b: chips(g.rot, 'rot') })}</p>`, tm())
        + rv(`<p>${t('v.kw.3', { items: g.rot.map((b, k) => `<span class="sbp">S(${hex(b)})=${chip(g.sub[k], 'sub')}</span>`).join(' ') })}</p>`, tm())
        + rv(`<p>${t('v.kw.4', { rc: code(hex(g.rc)), s: hex(g.sub[0]), rc2: hex(g.rc), r: chip(g.x[0], 'mix'), c: chips(g.x) })}</p>`, tm())
        + rv(`<p>${t('v.kw.5', { w: code(`w[${i - 4}]`), c: chips(I.base) })}</p><div class="bl">${chips(g.x)} ⊕ ${chips(I.base)} = ${chips(I.res, 'key')}</div>`, tm(), 'final');
    } else {
      body = rv(`<p>${code(`w[${i - 1}]`)} = ${chips(v.prevWord)}</p>`, tm())
        + rv(`<p>${code(`w[${i - 4}]`)} = ${chips(I.base)}</p>`, tm())
        + rv(`<p>${t('v.kw.n3')}</p><div class="bl">${chips(v.prevWord)} ⊕ ${chips(I.base)} = ${chips(I.res, 'key')}</div>`, tm(), 'final');
    }
    return `<div class="kwlayout"><div>${body}</div>${rv(side, 0.3)}</div>`;
  },

  sbox(f, v) {
    if (v.byte == null) return `${rv(sboxTable(null), 0.1, 'sbwrap')}${rv(`<p class="mutetxt">${t('v.sb.intro')}</p>`, 0.8)}`;
    const b = v.byte;
    const hx = (n) => n.toString(16).toUpperCase();
    const side = rv(`<p>${t('v.sb.1', { b: code(hex(b)), bits: bits(b) })}</p>`, 0.2)
      + rv(`<p>${t('v.sb.2', { bin: code(bin(b >> 4, 4)), h: hx(b >> 4) })}</p>`, 0.9)
      + rv(`<p>${t('v.sb.3', { bin: code(bin(b & 15, 4)), h: hx(b & 15) })}</p>`, 1.6)
      + rv(`<p>${t('v.sb.4', { out: `<span class="hitbadge">${hex(v.out)}</span>` })}</p>`, 2.3, 'final');
    return `<div class="sblayout">${rv(sboxTable(b), 0.1, 'sbwrap')}<div class="sbside">${side}</div></div>`;
  },

  sboxcalc(f, v) {
    const b = v.byte, inv = v.inv, tm = seqr(0.2, 0.9);
    const bt = (x, i) => x >> i & 1;
    const tail = b === 0 ? t('v.sc.zero') : t('v.sc.found', { inv: hex(inv), b: code(hex(b)), inv2: code(hex(inv)), one: code(hex(gmul(b, inv))) });
    let h = rv(`<p>${t('v.sc.1', { b: code(hex(b)), poly: poly(b), tail })}</p>`, tm());
    h += rv(`<p>${t('v.sc.2', { inv: code(hex(inv)), bits: bits(inv), formula: code('sᵢ = bᵢ ⊕ bᵢ₊₄ ⊕ bᵢ₊₅ ⊕ bᵢ₊₆ ⊕ bᵢ₊₇ ⊕ cᵢ'), cbits: bits(0x63) })}</p>`, tm());
    let rows = '', res = 0;
    for (let i = 0; i < 8; i++) {
      const parts = [bt(inv, i), bt(inv, (i + 4) % 8), bt(inv, (i + 5) % 8), bt(inv, (i + 6) % 8), bt(inv, (i + 7) % 8), bt(0x63, i)];
      const s = parts.reduce((x, y) => x ^ y);
      res |= s << i;
      rows += `<tr class="rv" style="--d:${3.0 + i * 0.4}"><td>s<sub>${i}</sub></td><td>${parts.join(' ⊕ ')}</td><td class="eq">= <b class="${s ? 'o' : 'z'}">${s}</b></td></tr>`;
    }
    h += `<table class="aff"><tr><th>${t('v.sc.bit')}</th><th>bᵢ ⊕ bᵢ₊₄ ⊕ bᵢ₊₅ ⊕ bᵢ₊₆ ⊕ bᵢ₊₇ ⊕ cᵢ</th><th></th></tr>${rows}</table>`;
    h += rv(`<p>${t('v.sc.3', { bits: bits(res), hex: code(hex(res)), out: hex(v.out) })}</p>`, 6.4, 'final');
    return h;
  },

  shiftintro(f) {
    const tm = seqr(0.2, 0.7);
    const s = f.state;
    return `<div class="shrules">${[0, 1, 2, 3].map((r) => rv(
      `<span class="srn">${t('v.si.row', { r })}</span>${chips([0, 1, 2, 3].map((c) => s[c * 4 + r]))}<span class="arrow">←</span><b class="sh">${t('v.si.n', { r })}</b>`, tm())).join('')}</div>`;
  },

  shift(f, v) {
    if (v.total === 0) return rv(`<p class="mutetxt">${t('v.sh.none', { c: chips(v.before) })}</p>`, 0.2);
    const tm = seqr(0.2, 0.9);
    return rv(`<p><b>${t('v.sh.before')}</b></p>${chips(v.before)}`, tm())
      + rv(`<div class="shflow">${t('v.sh.flow', { w: `<span class="wrap">${hex(v.before[0])}</span>` })}</div>`, tm())
      + rv(`<p><b>${t('v.sh.after')}</b></p>${chips(v.after, 'shift')}`, tm(), 'final')
      + (v.step < v.total ? rv(`<p class="mutetxt">${t('v.sh.more', { n: v.total - v.step })}</p>`, tm()) : rv(`<p class="mutetxt">${t('v.sh.ready', { row: v.row })}</p>`, tm()));
  },

  xor(f, v) {
    const { a, k, r } = v;
    const col = (n) => 0.5 + n * 0.55;
    let head = '<th></th>', ra = `<th>${t('v.x.a')}</th>`, rk = `<th>${t('v.x.k')}</th>`, rr = '<th>A ⊕ K</th>', rn = '<th></th>';
    for (let n = 0; n < 8; n++) {
      const i = 7 - n, ab = a >> i & 1, kb = k >> i & 1, rb = ab ^ kb;
      head += `<th class="pw">x${i === 0 ? '⁰' : sup(i)}</th>`;
      ra += `<td class="rv" style="--d:${col(n)}"><i class="${ab ? 'one' : ''}">${ab}</i></td>`;
      rk += `<td class="rv" style="--d:${col(n) + 0.05}"><i class="${kb ? 'one' : ''}">${kb}</i></td>`;
      rr += `<td class="rv res" style="--d:${col(n) + 0.3}"><i class="${rb ? 'one' : ''}">${rb}</i></td>`;
      rn += `<td class="rv note ${rb ? 'o' : 'z'}" style="--d:${col(n) + 0.3}">${ab}⊕${kb}=${rb}</td>`;
    }
    return `<table class="xtab"><tr>${head}</tr><tr>${ra}</tr><tr>${rk}</tr><tr class="sep"><th></th><td colspan="8"></td></tr><tr>${rr}</tr><tr>${rn}</tr></table>
      ${rv(`<p class="polyline">${code(hex(a))} = ${polyS(a)}<br>${code(hex(k))} = ${polyS(k)}<br>${t('v.x.poly')} <b class="hot">${code(hex(r))}</b> = ${polyS(r)}</p>`, 5.0, 'final')}
      <div class="twocol small">${rv(mini(v.rk, { active: v.i, label: t('v.x.rk') }), 0.2)}</div>`;
  },

  lesson(f, v) {
    const E = 0x57;
    const tm = seqr(0.2, 0.9);
    switch (v.n) {
      case 0: {
        let strip = '';
        for (let n = 0; n < 8; n++) {
          const i = 7 - n, on = E >> i & 1;
          strip += `<div class="bs rv ${on ? 'on' : ''}" style="--d:${0.2 + n * 0.3}"><small>x${i === 0 ? '⁰' : sup(i)}</small><i class="${on ? 'one' : ''}">${on ? 1 : 0}</i><u>${t(on ? 'v.l0.have' : 'v.l0.no')}</u></div>`;
        }
        return `<div class="bitstrip">${strip}</div>`
          + rv(`<p class="polyline">${code(hex(E))} = ${bits(E)} = ${polyS(E)}</p>`, 3.0, 'final')
          + rv(`<p class="mutetxt">${t('v.l0.note')}</p>`, 3.8);
      }
      case 1: {
        const A = 0x57, B = 0x83;
        return rv(`<p>${code(hex(A))} = ${polyS(A)}</p><p>${code(hex(B))} = ${polyS(B)}</p>`, tm())
          + rv(`<p>${t('v.l1.a', { x: code('x'), one: code('1') })}</p><p class="polyline">${polyS(A ^ B)}</p>`, tm())
          + rv(`<p>${t('v.l1.b')}</p><div class="bl">${bits(A)}<br>${bits(B)} ⊕<br>${bits(A ^ B)} = ${code(hex(A ^ B))}</div>`, tm(), 'final');
      }
      case 2: {
        const x = (E << 1) & 0xff;
        return rv(`<p>${code(hex(E))} = ${polyS(E)}</p>`, tm())
          + rv(`<p>${t('v.l2.a', { x: code('x') })}</p><p class="polyline">${polyS(E << 1)}</p>`, tm())
          + rv(`<p>${t('v.l2.b')}</p><div class="bl">${bits(E)} <span class="arrow">⟶</span> ${bits(x)} = ${code(hex(x))}</div>`, tm(), 'final');
      }
      case 3: {
        const A = 0xae, sh = (A << 1) & 0xff, res = sh ^ 0x1b;
        return rv(`<p>${t('v.l3.a', { ae: code(hex(A)), poly: polyS(A), x: code('x') })}</p><p class="polyline">${polyS(A << 1)} — <b class="hot">${t('v.l3.has8', { x8: 'x⁸' })}</b></p>`, tm())
          + rv(`<p>${t('v.l3.b', { x8: code('x⁸'), rule: RULE() })}</p><p class="polyline">${polyS(sh)} + ${polyS(0x1b)} = ${polyS(res)}</p>`, tm())
          + rv(`<p>${t('v.l3.c', { h1b: code('1B') })}</p><div class="bl">${bits(sh)}<br>${bits(0x1b)} ⊕<br>${bits(res)} = ${code(hex(res))}</div>`, tm(), 'final');
      }
      case 4: {
        const x2 = xt(E);
        return rv(`<table class="tt wide"><tr><th>${t('v.l4.h1')}</th><th>${t('v.l4.h2')}</th><th>${t('v.l4.h3', { e: hex(E) })}</th></tr>
          <tr><td>01</td><td>${code('1')}</td><td>${bits(E)} = ${code(hex(E))}</td></tr>
          <tr><td>02</td><td>${code('x')}${t('v.l4.x2')}</td><td>${bits(x2)} = ${code(hex(x2))}</td></tr>
          <tr><td>03</td><td>${code('x+1')}${t('v.l4.x3')}</td><td>${bits(x2 ^ E)} = ${code(hex(x2 ^ E))}</td></tr></table>`, 0.2)
          + rv(`<p class="mutetxt">${t('v.l4.note')}</p>`, 1.4);
      }
      default: {
        const col = f.state ? [0, 1, 2, 3].map((r) => f.state[r]) : [0, 0, 0, 0];
        return rv(matrixHTML(col), 0.2)
          + rv(`<div class="forms">${[0, 1, 2, 3].map((r) => `<p>b<sub>${r}</sub> = ${[0, 1, 2, 3].map((k) => code(hex(MIX[r][k]) + '•a' + k)).join(' ⊕ ')}</p>`).join('')}</div>`, 1.0);
      }
    }
  },

  mixcol(f, v) {
    return rv(matrixHTML(v.col), 0.2)
      + rv(`<div class="forms">${[0, 1, 2, 3].map((r) => formula(r, v.col, 0, -1)).join('')}</div>`, 1.0)
      + rv(`<p class="mutetxt">${t('v.mc.note', { b: code('b₀ b₁ b₂ b₃') })}</p>`, 1.8);
  },

  term(f, v) {
    const tm = seqr(0.2, 0.9);
    return `<div class="termhead">${formula(v.rr, v.col, v.k, v.k)}</div>` + mulSteps(v.a, v.m, tm);
  },

  sum(f, v) {
    const tm = seqr(0.2, 0.55);
    let rows = v.terms.map((x, k) => rv(`<span class="slab">${hex(MIX[v.rr][k])}•${hex(v.col[k])}</span> ${bits(x)} <span class="hexv">${hex(x)}</span>`, tm(), 'srow')).join('');
    rows += rv(`<span class="slab">⊕ XOR</span> ${bits(v.res, 'resbits')} <span class="hexv big">${hex(v.res)}</span>`, tm() + 0.9, 'srow final');
    return `<div class="termhead">${formula(v.rr, v.col, 4, -1)}</div>${rows}`
      + rv(`<p class="polyline">${t('v.s.poly')} ${polyS(v.res)}</p>`, tm() + 1.3)
      + rv(`<p class="mutetxt">${t('v.s.note')}</p>`, tm() + 1.8);
  },

  result(f, v) {
    const hx = [...v.cipher].map(hex);
    return `<div class="cipher">${hx.map((h, i) => rv(`<b>${h}</b>`, 0.1 + i * 0.12, 'cb')).join('')}</div>
      ${rv(`<p class="hexline">${hx.join('').toLowerCase()}</p>`, 2.2)}
      ${rv(`<div id="verify" class="verify"><span class="spin"></span> ${t('v.r.check')}</div>`, 2.6)}
      <div class="resbtns">${rv(`<button class="btn primary" id="rRestart">${t('v.r.restart')}</button> <button class="btn ghost" id="rEdit">${t('v.r.edit')}</button>`, 3.0)}</div>`;
  },
};

/* ================= Rendering ================= */
function buildGridDOM() {
  const g = $('#grid');
  g.innerHTML = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const i = c * 4 + r;
    const el = document.createElement('div');
    el.className = 'cell idle';
    el.dataset.i = i;
    el.innerHTML = '<b class="v">··</b><i class="ix">' + i + '</i>';
    g.appendChild(el);
    cells[i] = el;
  }
}

function setVal(el, text, flip = true) {
  const v = el.firstChild;
  if (v.textContent === text) return;
  v.textContent = text;
  if (flip && !reduce) el.animate([{ transform: 'rotateX(90deg) scale(.8)', opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function paintGrid(f, forward) {
  $('#grid').classList.toggle('showidx', !!f.showIdx);
  const step = cells[4].offsetLeft - cells[0].offsetLeft;
  for (let i = 0; i < 16; i++) {
    const el = cells[i];
    el.className = `cell ${f.state ? f.cells[i] : 'empty'}`;
    const isRev = f.reveal && f.reveal.idx === i;
    setVal(el, f.state ? hex(isRev ? f.reveal.from : f.state[i]) : '··', !(f.anim && f.anim.type === 'shift'));
    if (isRev) {
      el.classList.add('reveal-wait');
      timers.push(setTimeout(() => { el.classList.remove('reveal-wait'); setVal(el, hex(f.state[i])); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 900); }, f.reveal.delay * speed * 1000));
    }
  }
  if (reduce || !forward) return;
  if (f.anim && f.anim.type === 'fill') {
    cells.forEach((el, i) => el.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: i * 130 * speed, easing: 'ease-out', fill: 'backwards' }));
  }
  if (f.anim && f.anim.type === 'shift') {
    const row = f.anim.row;
    for (let c = 0; c < 4; c++) {
      const el = cells[c * 4 + row];
      const dx = (((c + 1) % 4) - c) * step;
      el.style.zIndex = 5;
      el.animate(c === 3
        ? [{ transform: `translate(${dx}px,0)` }, { transform: `translate(${dx / 2}px,-64px) scale(1.15)`, offset: 0.5 }, { transform: 'none' }]
        : [{ transform: `translate(${dx}px,0)` }, { transform: 'none' }],
      { duration: 1300 * speed, delay: 250, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'backwards' }).onfinish = () => (el.style.zIndex = '');
    }
  }
}

function paintProgress(f) {
  const rounds = $('#rounds');
  if (!rounds.children.length) {
    for (let r = 0; r <= 10; r++) {
      const b = document.createElement('button');
      b.textContent = r;
      b.onclick = () => go(r === 0 ? 0 : frames.find((x) => x.round === r).id);
      rounds.appendChild(b);
    }
    const res = document.createElement('button'); res.textContent = '✓'; res.className = 'fin';
    res.onclick = () => go(frames.length - 1);
    rounds.appendChild(res);
  }
  [...rounds.children].forEach((b, i) => { if (i < 11) b.title = t('ui.round', { r: i }); });
  const curR = f.op === 'result' ? 11 : f.round;
  [...rounds.children].forEach((b, i) => { b.className = (i === 11 ? 'fin ' : '') + (i < curR ? 'past' : i === curR ? 'now' : ''); });
  const chipsEl = $('#opchips');
  chipsEl.innerHTML = groups.filter((g) => g.round === f.round).map((g) => {
    const gi = groups.indexOf(g);
    const sub = gi === f.group ? `<small>${cur - g.start + 1}/${g.end - g.start + 1}</small>` : '';
    return `<button class="chip ${g.op} ${gi === f.group ? 'on' : ''} ${gi < f.group ? 'done' : ''}" data-s="${g.start}">${t('op.' + g.op)}${sub}</button>`;
  }).join('');
  chipsEl.querySelectorAll('button').forEach((b) => (b.onclick = () => go(+b.dataset.s)));
  $('#barFill').style.width = `${(cur / (frames.length - 1)) * 100}%`;
}

const scroller = () => { const p = $('#panel'); return getComputedStyle(p).overflowY === 'auto' ? p : $('#stage'); };

function paint(forward) {
  timers.forEach(clearTimeout); timers = [];
  const f = frames[cur];
  const stage = $('#stage');
  stage.dataset.op = f.op;
  stage.style.setProperty('--spd', speed);
  $('#badge').textContent = f.op === 'prep' || f.op === 'result' ? t('op.' + f.op) : `${t('ui.round', { r: f.round })} · ${t('op.' + f.op)}`;
  $('#title').textContent = f.title;
  $('#say').innerHTML = f.say;
  $('#viz').innerHTML = (VIZ[f.viz.type] || VIZ.none)(f, f.viz);
  const panel = $('#panel');
  panel.scrollTop = 0; stage.scrollTop = 0;
  panel.classList.remove('pop'); void panel.offsetWidth; panel.classList.add('pop');
  paintGrid(f, forward);
  paintProgress(f);
  $('#counter').textContent = `${cur + 1} / ${frames.length}`;
  $('#bPrev').disabled = cur === 0;
  $('#bNext').disabled = cur === frames.length - 1;
  $('#bNext').textContent = t(cur === frames.length - 1 ? 'ctl.done' : 'ctl.next');
  $('#gNote').textContent = f.state ? '' : t('ui.empty');
  if (f.op === 'result') finishUI(f);
  scheduleAuto();
}

// Yangi qator paydo bo'lganda panel o'zi pastga suriladi
$('#viz').addEventListener('animationstart', (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains('rv')) return;
  const sc = scroller(), pr = sc.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.bottom > pr.bottom - 12) sc.scrollBy({ top: er.bottom - pr.bottom + 28, behavior: reduce ? 'auto' : 'smooth' });
});

function go(i) {
  const n = Math.max(0, Math.min(frames.length - 1, i));
  prevCur = cur; cur = n;
  paint(cur === prevCur + 1);
}

/* ================= Avto-o'ynash ================= */
const DWELL = { bytes: 6, none: 6, key: 6, plan: 8, kwintro: 8, sbox: 6.5, sboxcalc: 12, xorrule: 8, xor: 9, kw: 11, shiftintro: 9, shift: 6.5, lesson: 12, mixcol: 9, term: 9, sum: 8 };
function scheduleAuto() {
  clearTimeout(autoT);
  if (!autoOn) return;
  if (cur >= frames.length - 1) { setAuto(false); return; }
  autoT = setTimeout(() => go(cur + 1), (DWELL[frames[cur].viz.type] || 6) * speed * 1000);
}
function setAuto(on) {
  autoOn = on;
  $('#bAuto').textContent = t(on ? 'ctl.stop' : 'ctl.auto');
  $('#bAuto').classList.toggle('active', on);
  if (!on) clearTimeout(autoT); else scheduleAuto();
}

/* ================= Natija va tekshiruv ================= */
async function finishUI(f) {
  document.getElementById('rRestart')?.addEventListener('click', () => go(0));
  document.getElementById('rEdit')?.addEventListener('click', () => { const d = $('#inputsBox'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  const out = [...f.viz.cipher];
  let msg = '';
  try {
    const k = await crypto.subtle.importKey('raw', data.key, 'AES-CBC', false, ['encrypt']);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: new Uint8Array(16) }, k, data.block));
    msg = out.every((b, i) => b === ct[i]) ? `<span class="okb">✓</span> ${t('res.ok')}` : `<span class="badb">✗</span> ${t('res.bad')}`;
  } catch { msg = t('res.none'); }
  if (expected) {
    const same = out.map(hex).join('').toLowerCase() === expected;
    msg += `<br>${same ? '<span class="okb">✓</span>' : '<span class="badb">✗</span>'} ${t(same ? 'res.fips.ok' : 'res.fips.bad')}: <code>${expected}</code>`;
  }
  const el = document.getElementById('verify');
  if (el && frames[cur] === f) el.innerHTML = msg;
}

/* ================= Kiritish ================= */
function setMode(m) {
  mode = m;
  document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
  $('#inPt').placeholder = $('#inKey').placeholder = t(m === 'text' ? 'in.ph.text' : 'in.ph.hex');
}
function readInputs() {
  const hint = $('#inHint');
  hint.className = 'hint';
  if (mode === 'text') {
    const p = textToBlock($('#inPt').value), k = textToBlock($('#inKey').value);
    const notes = [];
    if (p.truncated || k.truncated) notes.push(t('hint.cut'));
    if (p.padded || k.padded) notes.push(t('hint.pad'));
    hint.textContent = notes.join(' · ');
    return { block: p.bytes, key: k.bytes, text: 'text' };
  }
  const p = parseHex($('#inPt').value), k = parseHex($('#inKey').value);
  if (!p || !k) { hint.textContent = t('hint.err'); hint.className = 'hint err'; return null; }
  hint.textContent = '';
  return { block: p, key: k };
}
function rebuild() {
  const b = buildFrames(data.block, data.key, { mode, text: data.text }, t);
  frames = b.frames; groups = b.groups;
}
function start(d, exp = null) {
  data = d; expected = exp;
  rebuild();
  cur = 0; prevCur = -1;
  setAuto(false);
  paint(false);
}

/* ================= Ishga tushirish ================= */
applyStatic();
buildGridDOM();
setMode('text');
$('#inPt').value = 'Salom, AES olam!';
$('#inKey').value = 'maxfiy-kalit-123';
document.querySelectorAll('#modeSeg button').forEach((b) => (b.onclick = () => {
  if (b.dataset.m === mode) return;
  setMode(b.dataset.m);
  $('#inPt').value = ''; $('#inKey').value = '';
}));
$('#inApply').onclick = () => { const d = readInputs(); if (d) { start(d); $('#app').scrollIntoView({ behavior: 'smooth' }); } };
$('#inFips').onclick = () => {
  setMode('hex');
  $('#inPt').value = FIPS.pt; $('#inKey').value = FIPS.key;
  start({ block: parseHex(FIPS.pt), key: parseHex(FIPS.key) }, FIPS.ct);
  $('#inHint').textContent = t('hint.fips', { ct: FIPS.ct });
};
$('#bNext').onclick = () => go(cur + 1);
$('#bPrev').onclick = () => go(cur - 1);
$('#bNextOp').onclick = () => { const g = groups[frames[cur].group + 1]; if (g) go(g.start); };
$('#bPrevRound').onclick = () => { const f = frames[cur]; const g = groups[f.group]; go(cur > g.start ? g.start : (groups[f.group - 1] || g).start); };
$('#bAuto').onclick = () => setAuto(!autoOn);
document.querySelectorAll('#spdSeg button').forEach((b) => (b.onclick = () => {
  speed = +b.dataset.s;
  document.querySelectorAll('#spdSeg button').forEach((x) => x.classList.toggle('on', x === b));
  paint(false);
}));
document.querySelectorAll('.langsw button').forEach((b) => (b.onclick = () => setLang(b.dataset.l)));
window.addEventListener('langchange', () => {
  setMode(mode);
  rebuild();
  setAuto(autoOn);
  paint(false);
  const hint = $('#inHint');
  if (hint.classList.contains('err')) hint.textContent = t('hint.err');
});
addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (/INPUT|TEXTAREA|SUMMARY/.test(tag) || (tag === 'BUTTON' && e.key === ' ')) return;
  const r = $('#app').getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(cur + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
});

start(readInputs());

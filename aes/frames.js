// Har bir AES qadamini mayda "kadr"larga bo'lib chiqadi.
// Kadr = ekranda bir marta bosish bilan ko'rinadigan bitta tushuntirish.
// Barcha matnlar t(kalit, o'zgaruvchilar) orqali olinadi (i18n.js).
import { SBOX, MIX, gmul, hex, expandKey } from './aes.js';

export const invGF = (a) => { for (let b = 1; b < 256; b++) if (gmul(a, b) === 1) return b; return 0; };
const code = (x) => `<code>${x}</code>`;
const idx = (c, r) => c * 4 + r;

export function buildFrames(block, key, meta, t) {
  const ks = expandKey(key);
  const frames = [];
  const add = (f) => {
    f.id = frames.length;
    f.cells = f.cells || Array(16).fill('idle');
    frames.push(f);
    return f;
  };
  let s = Uint8Array.from(block);

  /* ---------------- Tayyorgarlik ---------------- */
  add({ round: 0, op: 'prep', title: t('f.prep1.t'), say: t('f.prep1.s', { ex: code('3A') }), state: null, viz: { type: 'bytes', bytes: block, text: meta.mode === 'text' ? meta.text : null } });
  add({ round: 0, op: 'prep', title: t('f.prep2.t'), say: t('f.prep2.s'), state: s, anim: { type: 'fill' }, showIdx: true, viz: { type: 'none' } });
  add({ round: 0, op: 'prep', title: t('f.prep3.t'), say: t('f.prep3.s'), state: s, viz: { type: 'key', key } });
  add({ round: 0, op: 'prep', title: t('f.prep4.t'), say: t('f.prep4.s'), state: s, viz: { type: 'plan' } });

  /* ---------------- Raundlar ---------------- */
  const arkFrames = (r) => {
    const rk = ks.roundKeys[r];
    if (r > 0) {
      add({ round: r, op: 'keygen', title: t('f.kg.t', { r }), say: r === 1 ? t('f.kg1.s') : t('f.kgN.s', { p: r - 1 }), state: s, viz: { type: 'kwintro', r, prevKey: ks.roundKeys[r - 1] } });
      for (let wi = 0; wi < 4; wi++) {
        add({
          round: r, op: 'keygen', title: t('f.kgw.t', { n: wi + 1 }),
          say: wi === 0 ? t('f.kgw0.s', { p: r - 1 }) : t('f.kgwN.s'),
          state: s, viz: { type: 'kw', r, wi, info: ks.info[4 * r + wi], rk, prevWord: ks.w[4 * r + wi - 1], baseWord: ks.w[4 * r + wi - 4] },
        });
      }
    }
    add({
      round: r, op: 'addkey', title: r === 0 ? t('f.ark0.t') : t('f.ark.t', { r }),
      say: r === 0 ? t('f.ark0.s') : t('f.ark.s', { r }),
      state: s, viz: { type: 'xorrule', rk, r },
    });
    const cur = Uint8Array.from(s);
    for (let i = 0; i < 16; i++) {
      const val = s[i] ^ rk[i];
      const cells = Array(16).fill('idle');
      for (let j = 0; j < i; j++) cells[j] = 'done';
      cells[i] = 'active';
      const shown = Uint8Array.from(cur);
      shown[i] = val;
      add({
        round: r, op: 'addkey', title: t('f.xor.t', { n: i + 1 }),
        say: t('f.xor.s', { n: i + 1, a: code(hex(s[i])), k: code(hex(rk[i])) }),
        state: shown, cells, reveal: { idx: i, from: s[i], delay: 5.2 },
        viz: { type: 'xor', a: s[i], k: rk[i], r: val, i, rk },
      });
      cur[i] = val;
    }
    s = cur;
  };

  const subFrames = (r) => {
    add({ round: r, op: 'sub', title: t('f.sub.t'), say: r === 1 ? t('f.sub1.s') : t('f.subN.s'), state: s, viz: { type: 'sbox', byte: null } });
    const cur = Uint8Array.from(s);
    for (let i = 0; i < 16; i++) {
      const b = s[i], out = SBOX[b];
      const cells = Array(16).fill('idle');
      for (let j = 0; j < i; j++) cells[j] = 'done';
      cells[i] = 'active';
      add({
        round: r, op: 'sub', title: t('f.look.t', { n: i + 1 }),
        say: t('f.look.s', { b: code(hex(b)), hi: code(hex(b)[0]), lo: code(hex(b)[1]), out: code(hex(out)) }),
        state: Uint8Array.from(cur), cells, viz: { type: 'sbox', byte: b, out, i },
      });
      const shown = Uint8Array.from(cur);
      shown[i] = out;
      add({
        round: r, op: 'sub', title: t('f.calc.t', { n: i + 1 }), say: t('f.calc.s', { out: code(hex(out)) }),
        state: shown, cells, reveal: { idx: i, from: b, delay: 6.6 },
        viz: { type: 'sboxcalc', byte: b, out, i, inv: b ? invGF(b) : 0 },
      });
      cur[i] = out;
    }
    s = cur;
  };

  const shiftFrames = (r) => {
    add({ round: r, op: 'shift', title: t('f.sh.t'), say: t('f.sh.s'), state: s, viz: { type: 'shiftintro' } });
    const cur = Uint8Array.from(s);
    for (let row = 0; row < 4; row++) {
      const cellsBase = Array(16).fill('idle');
      for (let rr = 0; rr < row; rr++) for (let c = 0; c < 4; c++) cellsBase[idx(c, rr)] = 'done';
      for (let c = 0; c < 4; c++) cellsBase[idx(c, row)] = 'active';
      if (row === 0) {
        const rowv = [0, 1, 2, 3].map((c) => cur[idx(c, 0)]);
        add({ round: r, op: 'shift', title: t('f.sh0.t'), say: t('f.sh0.s'), state: Uint8Array.from(cur), cells: cellsBase, viz: { type: 'shift', row, step: 0, total: 0, before: rowv, after: rowv } });
        continue;
      }
      for (let st = 1; st <= row; st++) {
        const before = [0, 1, 2, 3].map((c) => cur[idx(c, row)]);
        const after = [before[1], before[2], before[3], before[0]];
        after.forEach((v, c) => (cur[idx(c, row)] = v));
        add({
          round: r, op: 'shift', title: t('f.shs.t', { row, st }),
          say: t(row > 1 ? 'f.shs.s2' : 'f.shs.s', { row, st, b: code(hex(before[0])) }),
          state: Uint8Array.from(cur), cells: cellsBase, anim: { type: 'shift', row, n: 1 },
          viz: { type: 'shift', row, step: st, total: row, before, after },
        });
      }
    }
    s = cur;
  };

  const mixFrames = (r) => {
    if (r === 1) {
      for (let n = 0; n < 6; n++) {
        add({ round: r, op: 'mix', title: t(`f.ml${n}.t`), say: t(`f.ml${n}.s`, { x: code('x'), x1: code('x + 1'), x8: code('x⁸'), x7: code('x⁷'), rule: code('x⁸ = x⁴ + x³ + x + 1'), c1b: code('00011011'), h1b: code('1B'), hex57: code('57'), x2: code('x²'), x3: code('x³') }), state: s, viz: { type: 'lesson', n }, kind: 'lesson' });
      }
    } else {
      add({ round: r, op: 'mix', title: t('f.mr.t'), say: t('f.mr.s', { f: code('02•a ⊕ 03•b ⊕ 01•c ⊕ 01•d'), h1b: code('1B') }), state: s, viz: { type: 'lesson', n: 5 }, kind: 'lesson' });
    }
    const out = Uint8Array.from(s);
    for (let c = 0; c < 4; c++) {
      const col = [0, 1, 2, 3].map((k) => s[idx(c, k)]);
      const base = Array(16).fill('idle');
      for (let cc = 0; cc < c; cc++) for (let k = 0; k < 4; k++) base[idx(cc, k)] = 'done';
      const cc0 = base.slice();
      for (let k = 0; k < 4; k++) cc0[idx(c, k)] = 'src';
      add({
        round: r, op: 'mix', title: t('f.mc.t', { c: c + 1 }),
        say: t('f.mc.s', { c: c + 1, vals: col.map((v) => code(hex(v))).join(' ') }),
        state: Uint8Array.from(out), cells: cc0, viz: { type: 'mixcol', col, c },
      });
      for (let rr = 0; rr < 4; rr++) {
        const terms = [];
        for (let k = 0; k < 4; k++) {
          const m = MIX[rr][k], a = col[k];
          const val = gmul(a, m);
          terms.push(val);
          const cells = cc0.slice();
          for (let q = 0; q < rr; q++) cells[idx(c, q)] = 'done';
          cells[idx(c, rr)] = 'active';
          add({
            round: r, op: 'mix', kind: 'term',
            title: t('f.mt.t', { rr, c: c + 1, k: k + 1 }),
            say: t(`f.mt.s${m}`, { k: k + 1, a: code(hex(a)), x: code('x'), x1: code('x + 1') }),
            state: Uint8Array.from(out), cells,
            viz: { type: 'term', col, c, rr, k, m, a, val, terms: terms.slice() },
          });
        }
        const res = terms.reduce((x, y) => x ^ y);
        const old = out[idx(c, rr)];
        out[idx(c, rr)] = res;
        const cells = cc0.slice();
        for (let q = 0; q <= rr; q++) cells[idx(c, q)] = 'done';
        add({
          round: r, op: 'mix', kind: 'sum',
          title: t('f.ms.t', { rr, c: c + 1 }), say: t('f.ms.s', { res: code(hex(res)) }),
          state: Uint8Array.from(out), cells, reveal: { idx: idx(c, rr), from: old, delay: 3.8 },
          viz: { type: 'sum', col, c, rr, terms: terms.slice(), res },
        });
      }
    }
    s = out;
  };

  arkFrames(0);
  for (let r = 1; r <= 10; r++) {
    subFrames(r);
    shiftFrames(r);
    if (r < 10) mixFrames(r);
    arkFrames(r);
  }

  add({ round: 10, op: 'result', title: t('f.res.t'), say: t('f.res.s'), state: s, cells: Array(16).fill('done'), viz: { type: 'result', cipher: s } });

  // Guruhlar (round+op) — navigatsiya uchun
  const groups = [];
  frames.forEach((f) => {
    const key = `${f.round}:${f.op}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, round: f.round, op: f.op, start: f.id, end: f.id };
      groups.push(g);
    }
    g.end = f.id;
    f.group = groups.length - 1;
  });
  return { frames, groups, cipher: s, ks };
}

/* Shifrlash jarayonini kadrlarga bo'lish. Kadrlarda til yo'q — faqat ma'lumot va i18n kalitlari.
   Har bir kadr: bitta kichik qadam (bir bayt, bir R-qadam, bir Feistel bosqichi). */
(function (root) {
  'use strict';
  const K = typeof require !== 'undefined' ? require('./kuznechik.js') : root.Kuz;
  const cp = (a) => a.slice();
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  function buildTrace(plain, key) {
    const rk = K.expandKey(key);
    const frames = [];
    function F(o) {
      frames.push(Object.assign({
        round: 0, ctx: '', p: {}, aux: null, auxLab: null, auxP: null,
        mainLab: 'lbl_state', mainP: null, cur: [], src: [], done: [], keys: 10, data: {}
      }, o));
    }

    /* ---- umumiy bo'laklar ---- */
    function xorBytes(base, a, k, extra) {       // 16 ta X_byte kadri; a — boshlang'ich, k — kalit
      let s = cp(a);
      for (let i = 0; i < 16; i++) {
        const before = s[i];
        s[i] = before ^ k[i];
        F(Object.assign({}, extra, {
          kind: 'X_byte', main: cp(s), aux: cp(k), cur: [i], src: [i], done: range(i),
          p: Object.assign({}, extra.p, { i: i + 1 }), data: { i, a: before, k: k[i], r: s[i] }
        }));
      }
      return s;
    }
    function subBytes(a, extra) {
      let s = cp(a);
      for (let i = 0; i < 16; i++) {
        const before = s[i];
        s[i] = K.PI[before];
        F(Object.assign({}, extra, {
          kind: 'S_byte', main: cp(s), cur: [i], done: range(i),
          p: Object.assign({}, extra.p, { i: i + 1 }), data: { i, v: before, out: s[i] }
        }));
      }
      return s;
    }
    function linSteps(a, extra) {
      let s = cp(a);
      for (let j = 1; j <= 16; j++) {
        const before = s;
        const terms = before.map((b, i) => ({ c: K.LC[i], b, p: K.gmul(K.LC[i], b) }));
        const sum = terms.reduce((x, t) => x ^ t.p, 0);
        s = K.R(before);
        F(Object.assign({}, extra, {
          kind: 'L_step', main: cp(s), cur: [0],
          p: Object.assign({}, extra.p, { j }), data: { j, before: cp(before), terms, sum, after: cp(s) }
        }));
      }
      return s;
    }

    /* ---- kirish ---- */
    F({ kind: 'start', chip: { id: 'start', key: 'chip_start' }, main: cp(plain), keys: 0, data: { plain: cp(plain), key: cp(key) } });

    /* ---- kalit yasash ---- */
    const kc = (id, key, p) => ({ id, key, p: p || {} });
    F({ kind: 'ks_intro', chip: kc('ksintro', 'chip_ksintro'), main: cp(plain), keys: 0 });
    F({ kind: 'ks_split', chip: kc('split', 'chip_split'), main: cp(rk[0]), mainLab: 'lbl_k1', aux: cp(rk[1]), auxLab: 'lbl_k2', keys: 2,
      data: { key: cp(key), k1: cp(rk[0]), k2: cp(rk[1]) } });

    let a1 = cp(rk[0]), a0 = cp(rk[1]);
    for (let g = 1; g <= 4; g++) {
      const chip = kc('g' + g, 'chip_group', { g });
      const keysNow = 2 * g;
      F({ kind: 'ks_group', chip, p: { g, n1: 8 * (g - 1) + 1, n2: 8 * g, k1: 2 * g + 1, k2: 2 * g + 2 },
        main: cp(a1), mainLab: 'lbl_a1', aux: cp(a0), auxLab: 'lbl_a0', keys: keysNow });
      for (let j = 1; j <= 8; j++) {
        const n = 8 * (g - 1) + j;
        const cn = K.C[n];
        const base = { chip, mainLab: 'lbl_a1', keys: keysNow };
        const pp = { n, g, j };
        if (n === 1) {                                   // birinchi iteratsiya to'liq, bayt-bayt
          F(Object.assign({}, base, { kind: 'ks_cvec', main: K.vec(n), mainLab: 'lbl_cwork', p: pp, data: { n, vec: K.vec(n) } }));
          linSteps(K.vec(n), Object.assign({}, base, { ctx: 'const', mainLab: 'lbl_cwork', p: pp }));
          F(Object.assign({}, base, { kind: 'ks_cdone', main: cp(cn), mainLab: 'lbl_c', mainP: { n }, p: pp, data: { n, c: cp(cn) } }));
          let s = xorBytes(base, a1, cn, { chip, ctx: 'ksx', mainLab: 'lbl_a1', auxLab: 'lbl_c', auxP: { n }, keys: keysNow, p: pp });
          s = subBytes(s, Object.assign({}, base, { ctx: 'ks', p: pp }));
          s = linSteps(s, Object.assign({}, base, { ctx: 'ks', p: pp }));
          s = xorBytes(base, s, a0, { chip, ctx: 'ksf', mainLab: 'lbl_a1', auxLab: 'lbl_a0', keys: keysNow, p: pp });
          F(Object.assign({}, base, { kind: 'ks_swap', main: cp(s), aux: cp(a1), auxLab: 'lbl_a0', p: pp, data: { n, newA1: cp(s), newA0: cp(a1) } }));
          a0 = cp(a1); a1 = s;
        } else {                                         // qolganlari blok darajasida
          const x = K.xor(a1, cn), sx = K.S(x), lx = K.L(sx), t = K.xor(lx, a0);
          F(Object.assign({}, base, { kind: 'ks_const', main: cp(a1), aux: cp(cn), auxLab: 'lbl_c', auxP: { n }, p: pp, data: { n, vec: K.vec(n), c: cp(cn), a1: cp(a1) } }));
          F(Object.assign({}, base, { kind: 'ks_X', main: cp(x), aux: cp(cn), auxLab: 'lbl_c', auxP: { n }, p: pp, data: { a: cp(a1), k: cp(cn), r: cp(x) } }));
          F(Object.assign({}, base, { kind: 'ks_S', main: cp(sx), p: pp, data: { a: cp(x), r: cp(sx) } }));
          F(Object.assign({}, base, { kind: 'ks_L', main: cp(lx), p: pp, data: { a: cp(sx), r: cp(lx) } }));
          F(Object.assign({}, base, { kind: 'ks_xor', main: cp(t), aux: cp(a0), auxLab: 'lbl_a0', p: pp, data: { a: cp(lx), k: cp(a0), r: cp(t) } }));
          F(Object.assign({}, base, { kind: 'ks_swap', main: cp(t), aux: cp(a1), auxLab: 'lbl_a0', p: pp, data: { n, newA1: cp(t), newA0: cp(a1) } }));
          a0 = cp(a1); a1 = t;
        }
      }
      F({ kind: 'ks_pair', chip, p: { g, k1: 2 * g + 1, k2: 2 * g + 2 }, main: cp(a1), mainLab: 'lbl_rk', mainP: { k: 2 * g + 1 },
        aux: cp(a0), auxLab: 'lbl_rk', auxP: { k: 2 * g + 2 }, keys: keysNow + 2, data: { k1: cp(a1), k2: cp(a0) } });
    }

    /* ---- shifrlash ---- */
    let s = cp(plain);
    for (let r = 1; r <= 10; r++) {
      const kb = rk[r - 1];
      const xchip = { id: 'X', key: 'chip_x', p: { k: r } };
      F({ kind: 'X_intro', ctx: 'enc', round: r, chip: xchip, p: { r }, main: cp(s), aux: cp(kb), auxLab: 'lbl_rk', auxP: { k: r }, data: { state: cp(s), k: cp(kb) } });
      s = xorBytes({}, s, kb, { round: r, chip: xchip, ctx: 'enc', auxLab: 'lbl_rk', auxP: { k: r }, p: { r } });
      if (r === 10) break;
      const schip = { id: 'S', key: 'chip_s' }, lchip = { id: 'L', key: 'chip_l' };
      F({ kind: 'S_intro', ctx: 'enc', round: r, chip: schip, p: { r }, main: cp(s), data: { first: r === 1 } });
      s = subBytes(s, { round: r, chip: schip, ctx: 'enc', p: { r } });
      F({ kind: 'L_intro', ctx: 'enc', round: r, chip: lchip, p: { r }, main: cp(s), data: { first: r === 1 } });
      s = linSteps(s, { round: r, chip: lchip, ctx: 'enc', p: { r } });
    }
    F({ kind: 'result', round: 10, chip: { id: 'res', key: 'chip_res' }, main: cp(s), done: range(16), data: { cipher: cp(s) } });

    return { frames, rk, cipher: s };
  }

  const titleKey = (f) => 'tt_' + f.kind + (f.ctx ? '_' + f.ctx : '');
  const leadKey = (f) => 'ld_' + f.kind + (f.ctx ? '_' + f.ctx : '');

  const api = { buildTrace, titleKey, leadKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Trace = api;
})(typeof self !== 'undefined' ? self : this);

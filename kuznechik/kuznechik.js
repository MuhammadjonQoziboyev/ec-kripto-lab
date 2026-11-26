/* Kuznyechik (GOST R 34.12-2015) — sof JavaScript yadro.
   Bayt tartibi: massivning 0-elementi = hex satrdagi birinchi bayt (a15), oxirgisi = a0. */
(function (root) {
  'use strict';

  const PI = [
    252, 238, 221, 17, 207, 110, 49, 22, 251, 196, 250, 218, 35, 197, 4, 77,
    233, 119, 240, 219, 147, 46, 153, 186, 23, 54, 241, 187, 20, 205, 95, 193,
    249, 24, 101, 90, 226, 92, 239, 33, 129, 28, 60, 66, 139, 1, 142, 79,
    5, 132, 2, 174, 227, 106, 143, 160, 6, 11, 237, 152, 127, 212, 211, 31,
    235, 52, 44, 81, 234, 200, 72, 171, 242, 42, 104, 162, 253, 58, 206, 204,
    181, 112, 14, 86, 8, 12, 118, 18, 191, 114, 19, 71, 156, 183, 93, 135,
    21, 161, 150, 41, 16, 123, 154, 199, 243, 145, 120, 111, 157, 158, 178, 177,
    50, 117, 25, 61, 255, 53, 138, 126, 109, 84, 198, 128, 195, 189, 13, 87,
    223, 245, 36, 169, 62, 168, 67, 201, 215, 121, 214, 246, 124, 34, 185, 3,
    224, 15, 236, 222, 122, 148, 176, 188, 220, 232, 40, 80, 78, 51, 10, 74,
    167, 151, 96, 115, 30, 0, 98, 68, 26, 184, 56, 130, 100, 159, 38, 65,
    173, 69, 70, 146, 39, 94, 85, 47, 140, 163, 165, 125, 105, 213, 149, 59,
    7, 88, 179, 64, 134, 172, 29, 247, 48, 55, 107, 228, 136, 217, 231, 137,
    225, 27, 131, 73, 76, 63, 248, 254, 141, 83, 170, 144, 202, 216, 133, 97,
    32, 113, 103, 164, 45, 43, 9, 91, 203, 155, 37, 208, 190, 229, 108, 82,
    89, 166, 116, 210, 230, 244, 180, 192, 209, 102, 175, 194, 57, 75, 99, 182
  ];
  const PI_INV = new Array(256);
  PI.forEach((v, i) => { PI_INV[v] = i; });

  const POLY = 0x1c3;                 // x^8 + x^7 + x^6 + x + 1
  const POLY_LOW = 0xc3;              // x^8 o'rniga qo'yiladigan: x^7 + x^6 + x + 1
  const LC = [148, 32, 133, 16, 194, 192, 1, 251, 1, 192, 194, 16, 133, 32, 148, 1];

  function gmul(a, b) {
    let r = 0;
    while (b) {
      if (b & 1) r ^= a;
      a <<= 1;
      if (a & 0x100) a ^= POLY;
      b >>= 1;
    }
    return r;
  }

  /* c * b ni o'qiladigan ko'rinishda: b*x^k zanjiri */
  function gmulTrace(c, b) {
    const top = c ? 31 - Math.clz32(c) : 0;
    const rows = [];
    let v = b;
    for (let k = 0; k <= top; k++) {
      const used = ((c >> k) & 1) === 1;
      const overflow = k < top ? (v & 0x80) !== 0 : false;
      const next = k < top ? (((v << 1) & 0xff) ^ (overflow ? POLY_LOW : 0)) : null;
      rows.push({ k, v, used, overflow, next });
      if (k < top) v = next;
    }
    let res = 0;
    rows.forEach((r) => { if (r.used) res ^= r.v; });
    return { rows, result: res, top };
  }

  function lin(b) {
    let s = 0;
    for (let i = 0; i < 16; i++) s ^= gmul(LC[i], b[i]);
    return s;
  }
  function R(b) {
    const o = new Array(16);
    o[0] = lin(b);
    for (let i = 1; i < 16; i++) o[i] = b[i - 1];
    return o;
  }
  function Rinv(o) {
    const b = o.slice(1);
    let x = o[0];
    for (let i = 0; i < 15; i++) x ^= gmul(LC[i], o[i + 1]);
    b.push(x);
    return b;
  }
  function L(b) { for (let i = 0; i < 16; i++) b = R(b); return b; }
  function Linv(b) { for (let i = 0; i < 16; i++) b = Rinv(b); return b; }
  function S(b) { return b.map((v) => PI[v]); }
  function Sinv(b) { return b.map((v) => PI_INV[v]); }
  function xor(a, b) { return a.map((v, i) => v ^ b[i]); }
  function vec(n) { const v = new Array(16).fill(0); v[15] = n; return v; }

  const C = [null];
  for (let i = 1; i <= 32; i++) C.push(L(vec(i)));

  function expandKey(key) {
    const ks = [key.slice(0, 16), key.slice(16, 32)];
    let a1 = ks[0], a0 = ks[1];
    for (let g = 0; g < 4; g++) {
      for (let j = 0; j < 8; j++) {
        const t = xor(L(S(xor(a1, C[8 * g + j + 1]))), a0);
        a0 = a1; a1 = t;
      }
      ks.push(a1, a0);
    }
    return ks;
  }

  function encryptBlock(p, rk) {
    let s = p;
    for (let r = 0; r < 9; r++) s = L(S(xor(s, rk[r])));
    return xor(s, rk[9]);
  }
  function decryptBlock(c, rk) {
    let s = xor(c, rk[9]);
    for (let r = 8; r >= 0; r--) s = xor(Sinv(Linv(s)), rk[r]);
    return s;
  }

  function toHex(b) { return b.map((v) => v.toString(16).padStart(2, '0')).join(''); }
  function fromHex(h) {
    h = h.replace(/[\s:,-]|0x/gi, '');
    if (h.length % 2 || /[^0-9a-f]/i.test(h)) return null;
    const o = [];
    for (let i = 0; i < h.length; i += 2) o.push(parseInt(h.substr(i, 2), 16));
    return o;
  }

  const OFFICIAL = {
    key: '8899aabbccddeeff0011223344556677fedcba98765432100123456789abcdef',
    plain: '1122334455667700ffeeddccbbaa9988',
    cipher: '7f679d90bebc24305a468d42b9d4edcd'
  };

  const api = { PI, PI_INV, POLY, POLY_LOW, LC, C, gmul, gmulTrace, lin, R, Rinv, L, Linv, S, Sinv, xor, vec,
    expandKey, encryptBlock, decryptBlock, toHex, fromHex, OFFICIAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kuz = api;
})(typeof self !== 'undefined' ? self : this);

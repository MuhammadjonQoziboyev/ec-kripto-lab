// SHA-256 — o'quv maqsadidagi, har bir qadamni qayd etib boradigan realizatsiya (FIPS 180-4).
// Barcha so'zlar 32 bitli, "unsigned" (>>> 0) ko'rinishida saqlanadi.

export const u32 = (x) => x >>> 0;
export const rotr = (x, n) => u32((x >>> n) | (x << (32 - n)));
export const shr = (x, n) => x >>> n;
export const hex8 = (x) => u32(x).toString(16).padStart(8, '0');
export const bin32 = (x) => u32(x).toString(2).padStart(32, '0');
export const add = (...v) => v.reduce((a, b) => u32(a + b), 0);

// ---- Mantiqiy funksiyalar ----------------------------------------------
export const Ch = (x, y, z) => u32((x & y) ^ (~x & z));
export const Maj = (x, y, z) => u32((x & y) ^ (x & z) ^ (y & z));
export const S0 = (x) => u32(rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)); // Σ0
export const S1 = (x) => u32(rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)); // Σ1
export const s0 = (x) => u32(rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3)); // σ0
export const s1 = (x) => u32(rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10)); // σ1

// ---- Konstantalar: tub sonlarning ildizlaridan olinadi -------------------
export const PRIMES = (() => {
  const p = [];
  for (let n = 2; p.length < 64; n++) if (p.every((q) => n % q)) p.push(n);
  return p;
})();

// kasr qismining birinchi 32 biti (Math.sqrt / Math.cbrt aniqligi bunga yetadi)
const fracBits = (v) => u32(Math.floor((v - Math.floor(v)) * 2 ** 32));

export const H0_INFO = PRIMES.slice(0, 8).map((p, i) => {
  const root = Math.sqrt(p);
  return { i, p, root, frac: root - Math.floor(root), word: fracBits(root) };
});
export const K_INFO = PRIMES.map((p, i) => {
  const root = Math.cbrt(p);
  return { i, p, root, frac: root - Math.floor(root), word: fracBits(root) };
});
export const H0 = H0_INFO.map((x) => x.word);
export const K = K_INFO.map((x) => x.word);

// ---- Matnni baytlarga, so'ng 512 bitli bloklarga aylantirish --------------
export function pad(bytes) {
  const len = bytes.length;
  const total = Math.ceil((len + 1 + 8) / 64) * 64;
  const out = new Uint8Array(total);
  out.set(bytes);
  out[len] = 0x80;
  const bitLen = BigInt(len) * 8n;
  new DataView(out.buffer).setBigUint64(total - 8, bitLen);
  return { padded: out, zeros: total - len - 1 - 8, bitLen: Number(bitLen), blocks: total / 64 };
}

export function toWords(block64) {
  const dv = new DataView(block64.buffer, block64.byteOffset, 64);
  return Array.from({ length: 16 }, (_, i) => dv.getUint32(i * 4));
}

// ---- To'liq hisob + izoh (trace) -----------------------------------------
export function sha256Trace(bytes) {
  const p = pad(bytes);
  const blocks = [];
  let H = H0.slice();
  for (let b = 0; b < p.blocks; b++) {
    const words = toWords(p.padded.subarray(b * 64, b * 64 + 64));
    const Hin = H.slice();

    // 1) Xabar jadvali: 16 ta so'zdan 64 tagacha
    const W = words.slice();
    const sched = [];
    for (let t = 16; t < 64; t++) {
      const a = s1(W[t - 2]), c = s0(W[t - 15]);
      const val = add(a, W[t - 7], c, W[t - 16]);
      sched.push({ t, s1: a, w7: W[t - 7], s0: c, w16: W[t - 16], w2: W[t - 2], w15: W[t - 15], val });
      W.push(val);
    }

    // 2) 64 raund
    let [a, bb, c, d, e, f, g, h] = H;
    const rounds = [];
    for (let t = 0; t < 64; t++) {
      const before = [a, bb, c, d, e, f, g, h];
      const sig1 = S1(e), ch = Ch(e, f, g);
      const T1 = add(h, sig1, ch, K[t], W[t]);
      const sig0 = S0(a), maj = Maj(a, bb, c);
      const T2 = add(sig0, maj);
      h = g; g = f; f = e; e = add(d, T1); d = c; c = bb; bb = a; a = add(T1, T2);
      rounds.push({ t, before, after: [a, bb, c, d, e, f, g, h], sig1, ch, T1, sig0, maj, T2, K: K[t], W: W[t] });
    }

    // 3) Natijani oldingi holatga qo'shish
    const work = [a, bb, c, d, e, f, g, h];
    H = Hin.map((x, i) => add(x, work[i]));
    blocks.push({ index: b, words, W, sched, rounds, Hin, work, Hout: H.slice() });
  }
  return { pad: p, blocks, digest: H, hex: H.map(hex8).join('') };
}

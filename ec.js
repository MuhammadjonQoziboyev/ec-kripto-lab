// Elliptik egri chiziq arifmetikasi (o'quv maqsadida, kichik p) — har bir amal izohi bilan
const EC = (() => {
  const mod = (a, m) => ((a % m) + m) % m;
  const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const fmtP = P => P ? `(${P[0]}, ${P[1]})` : 'O';
  const factor = n => { const f = []; for (let i = 2; i * i <= n; i++) while (n % i === 0) { f.push(i); n /= i; } if (n > 1) f.push(n); return f; };

  // Kengaytirilgan Evklid — qadamlar bilan
  function inv(a, m) {
    a = mod(a, m);
    let [r0, r1, t0, t1] = [m, a, 0, 1];
    const rows = [];
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      rows.push({ q, r0, r1, r: r0 - q * r1, t0, t1, t: t0 - q * t1 });
      [r0, r1] = [r1, r0 - q * r1];
      [t0, t1] = [t1, t0 - q * t1];
    }
    if (r0 !== 1) return { val: null, rows };
    return { val: mod(t0, m), rows };
  }

  function invHtml(a, m) {
    const { val, rows } = inv(a, m);
    let h = `<div class="sub">Teskari element: ${mod(a, m)}<sup>−1</sup> mod ${m} (kengaytirilgan Evklid algoritmi)</div>
    <table class="mini"><tr><th>q</th><th>r<sub>i-1</sub></th><th>r<sub>i</sub></th><th>r = r<sub>i-1</sub> − q·r<sub>i</sub></th><th>t = t<sub>i-1</sub> − q·t<sub>i</sub></th></tr>`;
    rows.forEach(r => h += `<tr><td>${r.q}</td><td>${r.r0}</td><td>${r.r1}</td><td>${r.r}</td><td>${r.t0} − ${r.q}·${r.t1} = ${r.t}</td></tr>`);
    h += `</table><div class="res">⇒ ${mod(a, m)}<sup>−1</sup> ≡ ${val} (mod ${m}) &nbsp; tekshiruv: ${mod(a, m)}·${val} = ${mod(a, m) * val} ≡ ${mod(mod(a, m) * val, m)}</div>`;
    return { val, html: h };
  }

  class Curve {
    constructor(a, b, p) { this.a = a; this.b = b; this.p = p; }
    rhs(x) { return mod(x * x * x + this.a * x + this.b, this.p); }
    on(P) { return !P || mod(P[1] * P[1], this.p) === this.rhs(P[0]); }
    neg(P) { return P ? [P[0], mod(-P[1], this.p)] : null; }

    // Qo'shish: natija + batafsil HTML
    add(P, Q, detail = true) {
      const p = this.p;
      if (!P) return { R: Q, html: detail ? `O + Q = Q = ${fmtP(Q)}` : '' };
      if (!Q) return { R: P, html: detail ? `P + O = P = ${fmtP(P)}` : '' };
      const [x1, y1] = P, [x2, y2] = Q;
      if (x1 === x2 && mod(y1 + y2, p) === 0)
        return { R: null, html: detail ? `<div class="sub">x₁ = x₂ = ${x1}, y₁ + y₂ = ${y1}+${y2} ≡ 0 (mod ${p}) ⇒ P = −Q</div><div class="res">P + Q = O (cheksiz uzoqlikdagi nuqta)</div>` : '' };
      return (x1 === x2 && y1 === y2) ? this.double(P, detail) : this.addDistinct(P, Q, detail);
    }

    // Ikkilantirish: 2P, λ = (3x² + a) / (2y)
    double(P, detail = true) {
      const p = this.p;
      if (!P) return { R: null, html: detail ? '2·O = O' : '' };
      const [x1, y1] = P;
      if (mod(2 * y1, p) === 0) return { R: null, html: detail ? `<div class="sub">y = ${y1} ⇒ 2y ≡ 0 (mod ${p}), teskari element mavjud emas</div><div class="res">2·${fmtP(P)} = O (urinma vertikal)</div>` : '' };
      const num = mod(3 * x1 * x1 + this.a, p), den = mod(2 * y1, p);
      const iv = detail ? invHtml(den, p) : { val: inv(den, p).val, html: '' };
      const lam = mod(num * iv.val, p);
      let h = detail ? `<div class="sub">Ikkilantirish (P = Q): λ = (3x₁² + a) / (2y₁) mod p</div>
          <div class="f">λ = (3·${x1}² + ${this.a}) / (2·${y1}) = ${3 * x1 * x1 + this.a} / ${2 * y1} ≡ ${num} · ${den}<sup>−1</sup> (mod ${p})</div>${iv.html}
          <div class="f">λ = ${num} · ${iv.val} mod ${p} = <b>${lam}</b></div>` : '';
      return this._finish(P, P, lam, h, detail);
    }

    // Ikki turli nuqtani qo'shish: λ = (y₂ − y₁) / (x₂ − x₁)
    addDistinct(P, Q, detail = true) {
      const p = this.p, [x1, y1] = P, [x2, y2] = Q;
      const num = mod(y2 - y1, p), den = mod(x2 - x1, p);
      const iv = detail ? invHtml(den, p) : { val: inv(den, p).val, html: '' };
      const lam = mod(num * iv.val, p);
      let h = detail ? `<div class="sub">Qo'shish (P ≠ Q): λ = (y₂ − y₁) / (x₂ − x₁) mod p</div>
          <div class="f">λ = (${y2} − ${y1}) / (${x2} − ${x1}) ≡ ${num} · ${den}<sup>−1</sup> (mod ${p})</div>${iv.html}
          <div class="f">λ = ${num} · ${iv.val} mod ${p} = <b>${lam}</b></div>` : '';
      return this._finish(P, Q, lam, h, detail);
    }

    _finish(P, Q, lam, h, detail) {
      const p = this.p, [x1, y1] = P, [x2] = Q;
      const x3 = mod(lam * lam - x1 - x2, p), y3 = mod(lam * (x1 - x3) - y1, p);
      if (detail) h += `<div class="f">x₃ = λ² − x₁ − x₂ = ${lam}² − ${x1} − ${x2} = ${lam * lam - x1 - x2} ≡ <b>${x3}</b> (mod ${p})</div>
        <div class="f">y₃ = λ(x₁ − x₃) − y₁ = ${lam}·(${x1} − ${x3}) − ${y1} = ${lam * (x1 - x3) - y1} ≡ <b>${y3}</b> (mod ${p})</div>
        <div class="res">${fmtP(P)} + ${fmtP(Q)} = <b>${fmtP([x3, y3])}</b></div>`;
      return { R: [x3, y3], html: h, lam };
    }

    // Egri chiziq tartibi #E(F_p) — alohida funksiya
    curveOrder() { return this.points().pts.length + 1; }
    // Nuqta tartibi ord(P) — alohida funksiya (eng kichik k: kP = O)
    pointOrder(P) { return this.order(P); }

    // Skalyar ko'paytma: "ikkilantir va qo'sh" — har qadam ochiladigan
    mul(k, P, name = 'P') {
      const bits = k.toString(2);
      let R = null, steps = [];
      let h = `<div class="sub">k = ${k} = ${bits}<sub>2</sub> — "ikkilantirish va qo'shish" algoritmi (chapdan o'ngga)</div><div class="dbl">`;
      for (let i = 0; i < bits.length; i++) {
        const before = R;
        if (R) { const d = this.add(R, R); steps.push({ t: `2·${fmtP(before)}`, html: d.html }); R = d.R; h += `<details><summary>bit ${i + 1}: ikkilantirish 2·${fmtP(before)} = <b>${fmtP(R)}</b></summary>${d.html}</details>`; }
        if (bits[i] === '1') { const before2 = R; const s = this.add(R, P); R = s.R; h += `<details><summary>bit ${i + 1} = 1: qo'shish ${fmtP(before2)} + ${name} = <b>${fmtP(R)}</b></summary>${s.html}</details>`; }
      }
      h += `</div><div class="res">${k}·${name} = <b>${fmtP(R)}</b></div>`;
      return { R, html: h };
    }
    mulQ(k, P) { let R = null, Q = P; k = Math.abs(k); while (k > 0) { if (k & 1) R = this.add(R, Q, false).R; Q = this.add(Q, Q, false).R; k >>= 1; } return R; }

    points() {
      const p = this.p, rows = [], pts = [];
      const sq = {}; for (let y = 0; y < p; y++) (sq[y * y % p] ||= []).push(y);
      for (let x = 0; x < p; x++) {
        const r = this.rhs(x), ys = sq[r] || [];
        rows.push({ x, r, ys });
        ys.forEach(y => pts.push([x, y]));
      }
      return { rows, pts };
    }
    order(P) { let R = P, k = 1; while (R) { R = this.add(R, P, false).R; k++; } return k; }
    multiplesTable(P, limit = 400) {
      const out = []; let R = P, k = 1;
      while (R && k <= limit) { out.push([k, R]); R = this.add(R, P, false).R; k++; }
      out.push([k, null]); return out;
    }
  }

  // G ni topish: barcha nuqtalar, tartib, eng katta tub tartibli nuqta — HTML bilan
  function findG(curve, preferred) {
    const { rows, pts } = curve.points();
    const N = pts.length + 1, p = curve.p;
    let h = `<div class="sub">1) Har bir x ∈ [0, ${p - 1}] uchun z = x³ + ${curve.a}x + ${curve.b} mod ${p} hisoblanadi; z kvadratik chegirma bo'lsa, y² ≡ z yechimlari topiladi.</div>
    <div class="scroll"><table class="mini pts"><tr><th>x</th><th>x³+ax+b mod p</th><th>QR?</th><th>y</th><th>Nuqtalar</th></tr>`;
    rows.forEach(r => h += `<tr class="${r.ys.length ? 'ok' : 'no'}"><td>${r.x}</td><td>${r.x}³+${curve.a}·${r.x}+${curve.b} = ${r.x ** 3 + curve.a * r.x + curve.b} ≡ ${r.r}</td><td>${r.ys.length ? '✔' : '✘'}</td><td>${r.ys.join(', ') || '—'}</td><td>${r.ys.map(y => `(${r.x},${y})`).join(' ') || ''}</td></tr>`);
    h += `</table></div>`;
    const lo = Math.ceil(p + 1 - 2 * Math.sqrt(p)), hi = Math.floor(p + 1 + 2 * Math.sqrt(p));
    const fN = factor(N), n = Math.max(...fN), hcof = N / n;
    h += `<div class="sub">2) Guruh tartibi: #E = ${pts.length} ta affin nuqta + O = <b>N = ${N}</b>. Hasse chegarasi: ${lo} ≤ N ≤ ${hi} ✔</div>
    <div class="f">N = ${N} = ${fN.join(' · ')} ⇒ eng katta tub bo'luvchi <b>n = ${n}</b>, kofaktor h = N/n = ${hcof}</div>`;
    // Nomzodlarning tartiblari
    let G = null, cand = [];
    const pref = preferred && curve.on(preferred) ? preferred : null;
    const list = pref ? [pref, ...pts.filter(P => !(P[0] === pref[0] && P[1] === pref[1]))] : pts;
    for (const P of list) {
      const Pc = hcof > 1 ? curve.mulQ(hcof, P) : P;
      const o = Pc ? curve.order(Pc) : 1;
      cand.push({ P, Pc, o });
      if (o === n && Pc) { G = Pc; break; }
    }
    h += `<div class="sub">3) Nomzod nuqtalar tekshiriladi${hcof > 1 ? ` (P' = h·P = ${hcof}·P olinadi)` : ''}: ord(P) = n bo'lgan birinchi nuqta G sifatida tanlanadi.</div>`;
    cand.forEach(c => h += `<div class="f">${hcof > 1 ? `${hcof}·${fmtP(c.P)} = ${fmtP(c.Pc)}, ` : `${fmtP(c.P)}: `}tartib = ${c.o} ${c.o === n ? '✔ <b>G topildi</b>' : '✘'}</div>`);
    const tbl = G ? curve.multiplesTable(G) : [];
    h += `<div class="sub">4) Tekshiruv: G, 2G, 3G, … ketma-ket qo'shiladi, toki nG = O bo'lguncha:</div><div class="chips">`;
    tbl.forEach(([k, R]) => h += `<span class="chip ${R ? '' : 'inf'}">${k}G = ${fmtP(R)}</span>`);
    h += `</div><div class="res">G = <b>${fmtP(G)}</b>, ord(G) = n = <b>${n}</b> (${n}·G = O)</div>`;
    if (G) {
      const s2 = curve.add(G, G);
      h += `<details><summary>Namuna: 2G qanday hisoblangan (to'liq)</summary>${s2.html}</details>`;
      const s3 = curve.add(s2.R, G);
      h += `<details><summary>Namuna: 3G = 2G + G qanday hisoblangan (to'liq)</summary>${s3.html}</details>`;
    }
    return { G, n, N, h: hcof, pts, html: h, multiples: tbl };
  }

  // O'quv xesh (soddalashtirilgan): polinomial xesh
  function toyHash(msg, mod_) {
    let h = 0, rows = [];
    for (const ch of msg) { const c = ch.codePointAt(0); const nh = (h * 31 + c) % 1000003; rows.push({ ch, c, h, nh }); h = nh; }
    return { full: h, e: h % mod_, rows };
  }
  function hashHtml(msg, n, title) {
    const t = toyHash(msg, n);
    let h = `<div class="sub">${title}</div><div class="scroll"><table class="mini"><tr><th>belgi</th><th>kod</th><th>H = (H·31 + kod) mod 1000003</th></tr>`;
    t.rows.forEach(r => h += `<tr><td>'${r.ch === ' ' ? '␣' : r.ch}'</td><td>${r.c}</td><td>${r.h}·31 + ${r.c} = ${r.nh}</td></tr>`);
    h += `</table></div><div class="f">H(M) = ${t.full}</div>`;
    return { ...t, html: h };
  }

  return { mod, inv, invHtml, isPrime, fmtP, factor, Curve, findG, hashHtml };
})();

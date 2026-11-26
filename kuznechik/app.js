/* Ilova: til, kiritish, jonli player, rasmiy test. Barcha matn i18n.js dan (t()). */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const h2 = (b) => b.toString(16).padStart(2, '0');
  const bin8 = (b) => b.toString(2).padStart(8, '0');
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');
  const xpow = (k) => (k === 0 ? '1' : k === 1 ? 'x' : 'x' + sup(k));
  function poly(b) {
    if (!b) return '0';
    const o = [];
    for (let k = 7; k >= 0; k--) if ((b >> k) & 1) o.push(xpow(k));
    return o.join(' + ');
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* yo'q */ } }
  };

  /* ------------------------------------------------------------ til */
  function applyStatic() {
    document.documentElement.lang = I18N.lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); el.title = t(el.dataset.i18nAria); });
    $$('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === I18N.lang));
    document.title = t('doc_title');
  }
  function changeLang(l) {
    I18N.setLang(l);
    store.set('kuz_lang', l);
    applyStatic();
    renderSetupInfo();
    player.render({ quiet: true });
    renderTest();
    document.dispatchEvent(new Event('langchange'));
  }

  /* ------------------------------------------------------------ kiritish */
  const OFF = Kuz.OFFICIAL;
  const input = {
    pMode: 'hex', kMode: 'hex',
    pVal: { hex: OFF.plain, text: 'Salom Kuznechik!' },
    kVal: { hex: OFF.key, text: 'parol-parol-parol-parol-12345678' },
    plain: Kuz.fromHex(OFF.plain), key: Kuz.fromHex(OFF.key), info: { p: { warns: [], err: null }, k: { warns: [], err: null } }
  };
  function parseField(mode, value, size) {
    let bytes; let err = null; const warns = [];
    if (mode === 'hex') {
      bytes = Kuz.fromHex(value);
      if (!bytes) { err = 'err_hex'; bytes = []; }
    } else {
      bytes = Array.from(new TextEncoder().encode(value));
      if (bytes.length !== Array.from(value).length) warns.push({ k: 'w_utf8' });
    }
    const n = bytes.length;
    if (n > size) { warns.push({ k: 'w_cut', p: { n, size } }); bytes = bytes.slice(0, size); }
    else if (n < size) { warns.push({ k: 'w_pad', p: { n, size, z: size - n } }); bytes = bytes.concat(new Array(size - n).fill(0)); }
    return { bytes, err, warns };
  }
  function readInputs() {
    const p = parseField(input.pMode, input.pVal[input.pMode], 16);
    const k = parseField(input.kMode, input.kVal[input.kMode], 32);
    input.draft = { plain: p.bytes, key: k.bytes };
    input.info = { p, k };
    renderSetupInfo();
  }
  function renderSetupInfo() {
    ['p', 'k'].forEach((w) => {
      const inf = input.info[w];
      const box = $('#' + w + 'Info');
      const d = input.draft || { plain: input.plain, key: input.key };
      const bytes = w === 'p' ? d.plain : d.key;
      let html = '';
      if (inf.err) html += '<div class="warn err">' + t(inf.err) + '</div>';
      inf.warns.forEach((x) => { html += '<div class="warn">' + t(x.k, x.p) + '</div>'; });
      if (!inf.err && !inf.warns.length) html += '<div class="warn okw">' + t('w_exact') + '</div>';
      html += '<div class="usedhex"><span>' + t(w === 'p' ? 'used_plain' : 'used_key') + '</span><code>' + Kuz.toHex(bytes) + '</code></div>';
      box.innerHTML = html;
    });
    $('#applyBtn').disabled = !!(input.info.p.err || input.info.k.err);
  }
  function initSetup() {
    $$('input[name=pmode]').forEach((r) => r.addEventListener('change', () => { input.pMode = r.value; syncFields(); readInputs(); }));
    $$('input[name=kmode]').forEach((r) => r.addEventListener('change', () => { input.kMode = r.value; syncFields(); readInputs(); }));
    $('#pField').addEventListener('input', (e) => { input.pVal[input.pMode] = e.target.value; readInputs(); });
    $('#kField').addEventListener('input', (e) => { input.kVal[input.kMode] = e.target.value; readInputs(); });
    $('#applyBtn').addEventListener('click', () => { applyInputs(); scrollToApp(); });
    $('#applyStay').addEventListener('click', () => { applyInputs(); });
    $('#loadOfficial').addEventListener('click', () => {
      input.pMode = 'hex'; input.kMode = 'hex'; input.pVal.hex = OFF.plain; input.kVal.hex = OFF.key;
      $('input[name=pmode][value=hex]').checked = true; $('input[name=kmode][value=hex]').checked = true;
      syncFields(); readInputs(); applyInputs();
    });
    syncFields(); readInputs();
  }
  function syncFields() {
    $('#pField').value = input.pVal[input.pMode];
    $('#kField').value = input.kVal[input.kMode];
    $('#pField').classList.toggle('mono', input.pMode === 'hex');
    $('#kField').classList.toggle('mono', input.kMode === 'hex');
  }
  function applyInputs() {
    if (input.info.p.err || input.info.k.err) return;
    input.plain = input.draft.plain; input.key = input.draft.key;
    player.load(input.plain, input.key);
  }
  function scrollToApp() { $('#app').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' }); }

  /* ------------------------------------------------------------ panel quruvchilar */
  const bl = (arr, hi) => '<span class="bl">' + arr.map((v, i) => '<b class="by' + (hi && hi.indexOf(i) >= 0 ? ' hi' : '') + '">' + h2(v) + '</b>').join('') + '</span>';
  const bits = (b) => '<span class="bits">' + bin8(b).split('').map((c) => '<i class="b' + c + '">' + c + '</i>').join('') + '</span>';
  const R_ = (html, cls) => ({ html, cls: cls || '' });
  const line = (label, arr, hi) => '<div class="lv"><span class="lk">' + label + '</span>' + bl(arr, hi) + '</div>';

  function piTable(hr, hc, first) {
    let s = '<div class="pi">';
    s += '<span class="pc corner">π</span>';
    for (let c = 0; c < 16; c++) s += '<span class="pc head' + (c === hc ? ' on' : '') + '">' + c.toString(16) + '</span>';
    for (let r = 0; r < 16; r++) {
      s += '<span class="pc head' + (r === hr ? ' on' : '') + '">' + r.toString(16) + '</span>';
      for (let c = 0; c < 16; c++) {
        const hit = r === hr && c === hc;
        s += '<span class="pc' + (hit ? ' hit' : r === hr || c === hc ? ' ln' : '') + '">' + h2(Kuz.PI[r * 16 + c]) + '</span>';
      }
    }
    return s + '</div>';
  }
  function bin9(n) { return '<span class="ov">' + ((n >> 8) & 1) + '</span>' + bin8(n & 255); }

  function termHtml(tm, idx, open) {
    const tr = Kuz.gmulTrace(tm.c, tm.b);
    let body = '';
    body += '<div class="gm-h"><span>b = ' + bits(tm.b) + ' → b(x) = <em>' + poly(tm.b) + '</em></span></div>';
    body += '<div class="gm-h"><span>c = ' + bits(tm.c) + ' → c(x) = <em>' + poly(tm.c) + '</em></span></div>';
    body += '<div class="gm-n">' + t('gm_expl') + '</div>';
    tr.rows.forEach((r) => {
      let sh = '';
      if (r.k < tr.top) {
        sh = r.overflow
          ? '<span class="gm-sh">← ' + t('gm_shift') + ' ' + bin9(r.v << 1) + ' ⊕ <span class="ov">1</span>11000011 = ' + bin8(r.next) + ' <small>' + t('gm_over') + '</small></span>'
          : '<span class="gm-sh">← ' + t('gm_shift') + ' ' + bin9(r.v << 1) + ' <small>' + t('gm_fits') + '</small></span>';
      }
      body += '<div class="gm-r' + (r.used ? ' used' : '') + '"><span class="gm-k">b·' + xpow(r.k) + '</span><span class="gm-v">' + bin8(r.v) + '</span><span class="gm-u">' + (r.used ? '✓' : '·') + '</span>' + sh + '</div>';
    });
    body += '<div class="gm-n">' + t('gm_why') + '</div>';
    body += '<div class="gm-res">' + t('gm_res') + ' ' + bits(tr.result) + ' = <b>0x' + h2(tr.result) + '</b> <em>' + poly(tr.result) + '</em></div>';
    return '<details class="term"' + (open ? ' open' : '') + '><summary><span class="ti">' + (idx + 1) + '</span><span class="tc">' + tm.c + '</span><span class="tx">×</span><b class="by">' + h2(tm.b) + '</b><span class="tx">=</span><b class="by out">' + h2(tm.p) + '</b></summary>' + body + '</details>';
  }
  function bitMatrix(terms, sum) {
    let s = '<div class="bm"><div class="bm-l bm-head"><span class="bm-i"></span>' + [7, 6, 5, 4, 3, 2, 1, 0].map((k) => '<i>' + xpow(k) + '</i>').join('') + '</div>';
    terms.forEach((tm, i) => { s += '<div class="bm-l"><span class="bm-i">' + (i + 1) + '</span>' + bits(tm.p).replace('class="bits"', 'class="bits"') + '<span class="bm-h">' + h2(tm.p) + '</span></div>'; });
    s += '<div class="bm-l bm-sum"><span class="bm-i">⊕</span>' + bits(sum) + '<span class="bm-h">' + h2(sum) + '</span></div></div>';
    return s;
  }

  const blockPair = (f, k1, k2) => R_(line(k1, f.data.a) + line(k2, f.data.k) + line('=', f.data.r));

  const BUILD = {
    start(f) {
      return [R_(t('r_start_1') + line(t('lbl_plain'), f.data.plain)), R_(t('r_start_2')),
        R_(t('r_start_key') + line('K1', f.data.key.slice(0, 16)) + line('K2', f.data.key.slice(16))), R_(t('r_start_3'))];
    },
    ks_intro() { return [R_(t('r_ksi_1')), R_(t('r_ksi_2')), R_(t('r_ksi_3'))]; },
    ks_split(f) {
      return [R_(t('r_kss_1') + line('256', f.data.key)), R_(t('r_kss_2') + line('K1', f.data.k1) + line('K2', f.data.k2)), R_(t('r_kss_3'))];
    },
    ks_group(f) {
      return [R_(t('r_ksg_1', f.p)), R_('<code class="formula">(a1, a0) ← ( L(S(a1 ⊕ C<sub>n</sub>)) ⊕ a0 , a1 )</code>'), R_(t('r_ksg_2', f.p)),
        R_(t(f.p.g === 1 ? 'r_ksg_3_first' : 'r_ksg_3', f.p))];
    },
    ks_cvec(f) {
      return [R_(t('r_cv_1', f.p)), R_(line('Vec(' + f.data.n + ')', f.data.vec)), R_(t('r_cv_2', f.p))];
    },
    ks_cdone(f) {
      return [R_(t('r_cd_1', f.p) + line('C' + f.data.n, f.data.c)), R_(t('r_cd_2', f.p))];
    },
    ks_const(f) {
      return [R_(t('r_kc_1', f.p) + line('Vec(' + f.data.n + ')', f.data.vec)), R_(t('r_kc_2') + line('C' + f.data.n, f.data.c)), R_(t('r_kc_3'))];
    },
    ks_X(f) { return [R_(t('r_kx_1', f.p)), blockPair(f, 'a1', 'C' + f.p.n), R_(t('r_blk_note'))]; },
    ks_S(f) { return [R_(t('r_ks_1', f.p)), R_(line('in', f.data.a) + line('S', f.data.r)), R_(t('r_blk_note'))]; },
    ks_L(f) { return [R_(t('r_kl_1', f.p)), R_(line('in', f.data.a) + line('L', f.data.r)), R_(t('r_blk_note'))]; },
    ks_xor(f) { return [R_(t('r_kf_1', f.p)), blockPair(f, 'L', 'a0'), R_(t('r_blk_note'))]; },
    ks_swap(f) {
      return [R_(t('r_sw_1', f.p)), R_(line('a1', f.data.newA1) + line('a0', f.data.newA0)), R_(t('r_sw_2', f.p))];
    },
    ks_pair(f) {
      return [R_(t('r_kp_1', f.p)), R_(line('K' + f.p.k1, f.data.k1) + line('K' + f.p.k2, f.data.k2)), R_(t('r_kp_2', f.p))];
    },
    X_intro(f) {
      return [R_(t('r_xi_1', f.p) + line(t('lbl_state'), f.data.state)), R_(line('K' + f.p.r, f.data.k)), R_(t('r_xi_2')), R_(t('r_xi_3'))];
    },
    S_intro(f) {
      const rows = [];
      if (f.data.first) {
        rows.push(R_(t('r_si_1')), R_(t('r_si_2')));
        rows.push(R_(piTable(-1, -1)));
        const uniq = new Set(Kuz.PI).size === 256;
        rows.push(R_(t('r_si_3') + ' <b class="okc">' + (uniq ? '✓' : '✗') + '</b>'));
        rows.push(R_(t('r_si_4')), R_(t('r_si_5')));
      } else {
        rows.push(R_(t('r_si_again')), R_(piTable(-1, -1)));
      }
      return rows;
    },
    L_intro(f) {
      const rows = [];
      if (f.data.first) {
        rows.push(R_(t('r_li_1')), R_(t('r_li_2')));
        rows.push(R_('<div class="coefs">' + Kuz.LC.map((c, i) => '<span><small>' + (i + 1) + '</small><b>' + c + '</b></span>').join('') + '</div>'));
        rows.push(R_(t('r_li_3')), R_(t('r_li_4')), R_(t('r_li_5')), R_(t('r_li_6')));
      } else {
        rows.push(R_(t('r_li_again')));
      }
      return rows;
    },
    X_byte(f) {
      const d = f.data;
      const a = d.a, k = d.k, r = d.r;
      const rows = [R_(t('r_xb_pick_' + f.ctx, f.p) + '<div class="pairrow">' + bl([a]) + '<span class="op">⊕</span>' + bl([k]) + '<span class="op">=</span>' + bl([r], [0]) + '</div>')];
      rows.push(R_(t('r_xb_bits')));
      for (let b = 7; b >= 0; b--) {
        const ab = (a >> b) & 1, kb = (k >> b) & 1;
        rows.push(R_('<span class="bx-p">' + xpow(b) + '</span><i class="b' + ab + '">' + ab + '</i><span class="op">⊕</span><i class="b' + kb + '">' + kb + '</i><span class="op">=</span><i class="b' + (ab ^ kb) + ' res">' + (ab ^ kb) + '</i>' +
          '<small class="bx-n">' + (ab === kb ? t('xb_same') : t('xb_diff')) + '</small>', 'bitrow'));
      }
      rows.push(R_('<div class="polyl"><span>a(x) = ' + poly(a) + '</span><span>k(x) = ' + poly(k) + '</span><span class="sum">a(x) + k(x) = ' + poly(r) + '</span></div>' + t('r_xb_poly')));
      rows.push(R_(t('r_xb_done', f.p) + ' <b class="by out">' + h2(r) + '</b> <small>(' + bin8(r) + ')</small>'));
      return rows;
    },
    S_byte(f) {
      const d = f.data;
      const hr = d.v >> 4, hc = d.v & 15;
      return [
        R_(t('r_sb_1', f.p) + '<div class="pairrow">' + bl([d.v]) + '<span class="op">=</span>' + bits(d.v) + '</div>'),
        R_(t('r_sb_2', { row: hr.toString(16), col: hc.toString(16) })),
        R_(piTable(hr, hc)),
        R_(t('r_sb_3', { v: h2(d.v) }) + '<div class="pairrow">' + bl([d.v]) + '<span class="op">→</span>' + bl([d.out], [0]) + '</div>')
      ];
    },
    L_step(f) {
      const d = f.data;
      const rows = [R_(t('r_ls_1', f.p) + line(t('lbl_before'), d.before)), R_(t('r_ls_2'))];
      const open = player.expandAll;
      d.terms.forEach((tm, i) => rows.push(R_(termHtml(tm, i, open || i === 0), 'termrow')));
      rows.push(R_(t('r_ls_3') + bitMatrix(d.terms, d.sum)));
      rows.push(R_(t('r_ls_4', { l: h2(d.sum), drop: h2(d.before[15]) }) + line(t('lbl_after'), d.after, [0])));
      return rows;
    },
    result(f) {
      const c = f.data.cipher;
      const rows = [R_(t('r_res_1') + line(t('lbl_cipher'), c))];
      const viaFn = Kuz.toHex(Kuz.encryptBlock(player.plain, Kuz.expandKey(player.key)));
      rows.push(R_(t('r_res_2') + ' <b class="okc">' + (viaFn === Kuz.toHex(c) ? '✓' : '✗') + '</b>'));
      const back = Kuz.decryptBlock(c, Kuz.expandKey(player.key));
      rows.push(R_(t('r_res_3') + ' <b class="okc">' + (Kuz.toHex(back) === Kuz.toHex(player.plain) ? '✓' : '✗') + '</b>'));
      const official = Kuz.toHex(player.plain) === OFF.plain && Kuz.toHex(player.key) === OFF.key;
      if (official) rows.push(R_(t('r_res_off') + '<div class="lv"><span class="lk">' + t('lbl_expected') + '</span><code>' + OFF.cipher + '</code></div><div class="lv"><span class="lk">' + t('lbl_got') + '</span><code>' + Kuz.toHex(c) + '</code></div><b class="okc big">' + (Kuz.toHex(c) === OFF.cipher ? '✓' : '✗') + '</b>', 'final'));
      else rows.push(R_(t('r_res_notoff')));
      rows.push(R_(t('r_res_end')));
      return rows;
    }
  };

  /* ------------------------------------------------------------ player */
  const SPEEDS = { slow: { dur: 760, stag: 170, auto: 3200 }, normal: { dur: 480, stag: 85, auto: 1700 }, fast: { dur: 240, stag: 30, auto: 650 } };
  const OPCOLOR = (f) => {
    const id = f.chip.id;
    if (id === 'X') return 'x';
    if (id === 'S') return 's';
    if (id === 'L') return 'l';
    if (id === 'start' || id === 'res') return 'io';
    return 'k';
  };
  const player = {
    frames: [], idx: 0, plain: null, key: null, speed: store.get('kuz_speed', 'normal'), expandAll: store.get('kuz_expand', '0') === '1',
    timer: null, playing: false, token: 0, timers: [], userScrolled: false, shownMain: [], shownAux: [],
    roundFirst: {}, chips: {},

    init() {
      const mk = (id) => {
        const g = $(id);
        g.innerHTML = '';
        const cells = [];
        for (let i = 0; i < 16; i++) {
          const c = document.createElement('div');
          c.className = 'cell';
          c.innerHTML = '<span class="ci">' + i + '</span><span class="cv">··</span>';
          g.appendChild(c); cells.push(c);
        }
        return cells;
      };
      this.cellsMain = mk('#gridMain'); this.cellsAux = mk('#gridAux');
      $('#keyStrip').innerHTML = Array.from({ length: 10 }, (_, i) => '<span class="kchip" data-k="' + (i + 1) + '">K' + (i + 1) + '</span>').join('');
      $('#nextBtn').addEventListener('click', () => this.go(1));
      $('#prevBtn').addEventListener('click', () => this.go(-1));
      $('#playBtn').addEventListener('click', () => this.togglePlay());
      $('#skipBtn').addEventListener('click', () => this.skipOp());
      $('#restartBtn').addEventListener('click', () => this.jump(0));
      $('#speedSel').value = this.speed;
      $('#speedSel').addEventListener('change', (e) => { this.speed = e.target.value; store.set('kuz_speed', this.speed); this.applySpeed(); });
      $('#expandChk').checked = this.expandAll;
      $('#expandChk').addEventListener('change', (e) => { this.expandAll = e.target.checked; store.set('kuz_expand', e.target.checked ? '1' : '0'); this.render({ quiet: true }); });
      const rows = $('#rows');
      ['wheel', 'touchmove', 'pointerdown'].forEach((ev) => rows.addEventListener(ev, () => { this.userScrolled = true; }, { passive: true }));
      const isVisible = () => { const r = $('#appBox').getBoundingClientRect(); return Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) > r.height * 0.4; };
      document.addEventListener('keydown', (e) => {
        if (!isVisible() || e.ctrlKey || e.metaKey || e.altKey) return;
        const tg = e.target.tagName;
        if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || e.target.isContentEditable) return;
        if (e.key === 'ArrowRight' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); this.go(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(-1); }
      });
      this.applySpeed();
    },
    applySpeed() {
      const s = SPEEDS[this.speed];
      const st = document.documentElement.style;
      st.setProperty('--dur', s.dur + 'ms'); st.setProperty('--stag', s.stag + 'ms');
    },
    load(plain, key) {
      this.stop();
      this.plain = plain.slice(); this.key = key.slice();
      const tr = Trace.buildTrace(this.plain, this.key);
      this.frames = tr.frames; this.idx = 0; this.shownMain = []; this.shownAux = [];
      this.roundFirst = {}; this.chips = {};
      this.frames.forEach((f, i) => {
        if (!(f.round in this.roundFirst)) this.roundFirst[f.round] = i;
        const list = this.chips[f.round] || (this.chips[f.round] = []);
        if (!list.length || list[list.length - 1].id !== f.chip.id) list.push({ id: f.chip.id, key: f.chip.key, p: f.chip.p, first: i, type: OPCOLOR(f) });
      });
      this.buildRounds();
      this.render({ first: true });
    },
    buildRounds() {
      const box = $('#rounds');
      let h = '';
      for (let r = 0; r <= 10; r++) h += '<button type="button" class="rbtn" data-r="' + r + '">' + (r === 0 ? 'K' : r) + '</button>';
      box.innerHTML = h;
      $$('.rbtn', box).forEach((b) => b.addEventListener('click', () => this.jump(this.roundFirst[+b.dataset.r])));
    },
    go(d) {
      const n = Math.max(0, Math.min(this.frames.length - 1, this.idx + d));
      if (n === this.idx) { if (this.playing) this.stop(); return; }
      this.idx = n; this.render({ dir: d });
    },
    jump(i) { this.stop(); const dir = i >= this.idx ? 1 : -1; this.idx = i; this.render({ dir }); },
    skipOp() {
      const f = this.frames[this.idx];
      let i = this.idx;
      while (i < this.frames.length && this.frames[i].round === f.round && this.frames[i].chip.id === f.chip.id) i++;
      if (i >= this.frames.length) i = this.frames.length - 1;
      this.stop(); this.idx = i; this.render({ dir: 1 });
    },
    togglePlay() { if (this.playing) this.stop(); else this.play(); },
    play() {
      if (this.idx >= this.frames.length - 1) this.idx = 0;
      this.playing = true; this.updatePlayBtn(); this.schedule();
    },
    schedule() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!this.playing) return;
        if (this.idx >= this.frames.length - 1) { this.stop(); return; }
        this.go(1);
        if (this.playing) this.schedule();
      }, SPEEDS[this.speed].auto);
    },
    stop() { this.playing = false; clearTimeout(this.timer); this.updatePlayBtn(); },
    updatePlayBtn() {
      const b = $('#playBtn');
      b.textContent = this.playing ? '❚❚ ' + t('btn_pause') : '▶ ' + t('btn_auto');
      b.classList.toggle('on', this.playing);
    },

    render(opts) {
      opts = opts || {};
      if (!this.frames.length) return;
      const f = this.frames[this.idx];
      const quiet = !!opts.quiet || reduceMotion.matches;
      this.token++;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.renderGrids(f, quiet || opts.first);
      this.renderPanel(f, quiet || opts.dir < 0 || opts.first, opts.dir);
      this.renderNav(f);
      this.updatePlayBtn();
    },
    renderGrids(f, quiet) {
      const upd = (cells, vals, shown, roles, whole) => {
        cells.forEach((c, i) => {
          const v = vals ? vals[i] : null;
          const el = c.lastChild;
          const txt = v === null ? '··' : h2(v);
          if (shown[i] !== txt) {
            el.textContent = txt;
            if (!quiet && v !== null && shown[i] !== undefined && shown[i] !== '··') {
              el.classList.remove('flip'); void el.offsetWidth;
              el.style.setProperty('--d', whole ? (i * 18) + 'ms' : '0ms');
              el.classList.add('flip');
            }
            shown[i] = txt;
          }
          c.className = 'cell' + (v === null ? ' empty' : '') + (roles[i] ? ' ' + roles[i] : '');
        });
      };
      const rm = {}; f.done.forEach((i) => { rm[i] = 'done'; }); f.cur.forEach((i) => { rm[i] = 'cur'; });
      const ra = {}; f.src.forEach((i) => { ra[i] = 'src'; });
      const whole = f.kind === 'L_step' || f.kind.indexOf('ks_') === 0;
      upd(this.cellsMain, f.main, this.shownMain, rm, whole);
      upd(this.cellsAux, f.aux, this.shownAux, ra, false);
      $('#lblMain').textContent = t(f.mainLab, f.mainP || {});
      $('#lblAux').textContent = f.aux ? t(f.auxLab, f.auxP || {}) : t('lbl_none');
      $('#hexMain').textContent = f.main.map(h2).join(' ');
      const used = {}; [f.mainLab === 'lbl_rk' ? f.mainP.k : 0, f.auxLab === 'lbl_rk' && f.aux ? f.auxP.k : 0].forEach((k) => { if (k) used[k] = 1; });
      $$('.kchip').forEach((c) => {
        const k = +c.dataset.k;
        c.classList.toggle('have', k <= f.keys); c.classList.toggle('use', !!used[k]);
      });
    },
    renderPanel(f, quiet, dir) {
      const type = OPCOLOR(f);
      const badge = $('#badge');
      badge.className = 'badge ' + type; $('#appBox').dataset.op = type;
      badge.textContent = t('badge_' + type);
      $('#pTitle').textContent = t(Trace.titleKey(f), f.p);
      $('#pLead').textContent = t(Trace.leadKey(f), f.p);
      const rowsEl = $('#rows');
      const list = BUILD[f.kind](f);
      rowsEl.classList.toggle('quiet', quiet);
      rowsEl.innerHTML = list.map((r, i) => '<div class="row ' + r.cls + '" style="--i:' + Math.min(i, 24) + '">' + r.html + '</div>').join('');
      this.userScrolled = false;
      rowsEl.scrollTop = 0;
      const st = SPEEDS[this.speed];
      if (quiet) { rowsEl.scrollTop = dir < 0 ? rowsEl.scrollHeight : 0; return; }
      list.forEach((_, i) => {
        const tm = setTimeout(() => {
          if (this.userScrolled) return;
          rowsEl.scrollTo({ top: rowsEl.scrollHeight, behavior: 'smooth' });
        }, Math.min(i, 24) * st.stag + 90);
        this.timers.push(tm);
      });
    },
    renderNav(f) {
      const N = this.frames.length;
      $('#bar').style.width = (N > 1 ? (this.idx / (N - 1)) * 100 : 0) + '%';
      $('#progText').textContent = t('prog', { i: this.idx + 1, n: N });
      $('#opText').textContent = t(f.chip.key, f.chip.p || {});
      $$('.rbtn').forEach((b) => b.classList.toggle('on', +b.dataset.r === f.round));
      const list = this.chips[f.round] || [];
      const box = $('#chips');
      box.innerHTML = list.map((c) => '<button type="button" class="chip ' + c.type + (c.id === f.chip.id ? ' on' : '') + '" data-i="' + c.first + '">' + t(c.key, c.p || {}) + '</button>').join('');
      $$('.chip', box).forEach((b) => b.addEventListener('click', () => this.jump(+b.dataset.i)));
      const on = $('.chip.on', box);
      if (on) {                                  // faqat chiplar qatorini suramiz, sahifani emas
        const l = on.offsetLeft, r = l + on.offsetWidth;
        if (l < box.scrollLeft) box.scrollLeft = l - 8; else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 8;
      }
      $('#prevBtn').disabled = this.idx === 0;
      $('#nextBtn').disabled = this.idx === N - 1;
    }
  };
  window.player = player;

  /* ------------------------------------------------------------ rasmiy test */
  let testRan = false;
  function runTest() {
    const rk = Kuz.expandKey(Kuz.fromHex(OFF.key));
    const std = ['8899aabbccddeeff0011223344556677', 'fedcba98765432100123456789abcdef', 'db31485315694343228d6aef8cc78c44',
      '3d4553d8e9cfec6815ebadc40a9ffd04', '57646468c44a5e28d3e59246f429f1ac', 'bd079435165c6432b532e82834da581b',
      '51e640757e8745de705727265a0098b1', '5a7925017b9fdd3ed72a91a22286f984', 'bb44e25378c73123a5f32f73cdb6e517', '72e9dd7416bcf45b755dbaa88e4a4043'];
    const res = [];
    const c0 = Kuz.toHex(Kuz.encryptBlock(Kuz.fromHex(OFF.plain), rk));
    res.push({ main: true, label: t('test_main'), exp: OFF.cipher, got: c0 });
    res.push({ label: t('test_keys'), exp: std.join(' '), got: rk.map(Kuz.toHex).join(' '), keys: true });
    [['00112233445566778899aabbcceeff0a', 'b429912c6e0032f9285452d76718d08b'], ['112233445566778899aabbcceeff0a00', 'f0ca33549d247ceef3f5a5313bd4b157'], ['2233445566778899aabbcceeff0a0011', 'd0b09ccde830b9eb3a02c4c5aa8ada98']]
      .forEach(([p, c], i) => res.push({ label: t('test_ecb', { n: i + 2 }), exp: c, got: Kuz.toHex(Kuz.encryptBlock(Kuz.fromHex(p), rk)) }));
    return res;
  }
  function renderTest() {
    const box = $('#testOut');
    if (!testRan) { box.innerHTML = ''; return; }
    const res = runTest();
    const allOk = res.every((r) => r.exp === r.got);
    box.innerHTML = res.map((r, i) => '<div class="trow ' + (r.exp === r.got ? 'pass' : 'fail') + '" style="--i:' + i + '"><div class="tk">' + r.label + '</div>' +
      (r.keys ? '' : '<div class="tv"><span>' + t('lbl_expected') + '</span><code>' + r.exp + '</code></div><div class="tv"><span>' + t('lbl_got') + '</span><code>' + r.got + '</code></div>') +
      (r.keys ? '<div class="tv"><span>10 / 10</span><code>' + (r.exp === r.got ? 'K1 … K10' : '≠') + '</code></div>' : '') +
      '<div class="tm">' + (r.exp === r.got ? '✓' : '✗') + '</div></div>').join('') +
      '<div class="tsum ' + (allOk ? 'pass' : 'fail') + '">' + (allOk ? '✓ ' + t('test_ok') : '✗ ' + t('test_bad')) + '</div>';
  }
  function initTest() {
    $('#testBtn').addEventListener('click', () => { testRan = true; renderTest(); });
  }

  /* ------------------------------------------------------------ boshlash */
  function init() {
    const saved = store.get('kuz_lang', 'uz');
    I18N.setLang(I18N.langs.indexOf(saved) >= 0 ? saved : 'uz');
    $$('.lang button').forEach((b) => b.addEventListener('click', () => changeLang(b.dataset.lang)));
    applyStatic();
    initSetup();
    initTest();
    player.init();
    player.load(input.plain, input.key);
    $('#toSetup').addEventListener('click', () => { $('#setup').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' }); });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
    window.__ready = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

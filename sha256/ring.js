import { hex8 } from './sha.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const enc = new TextEncoder();
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- vaqt masshtabi: --k = 1 / tezlik ---------- */
export let KS = reduce ? 0.05 : 1;
export const setKS = (v) => { KS = v; document.documentElement.style.setProperty('--k', v); };
setKS(KS);

/* ---------- ranglar ---------- */
export const REG = ['#38bdf8', '#60a5fa', '#a78bfa', '#f472b6', '#f87171', '#fb923c', '#facc15', '#4ade80'];
export const NM = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const SIG = '#e879f9', CHM = '#2dd4bf', TT = '#fcd34d', WCOL = '#ffffff', KCOL = '#a3e635';
export const wcol = (j) => `hsl(${(j * 5.6) | 0} 85% 66%)`;
export const bitsOf = (v) => v.toString(2).padStart(8, '0');

/* ================= Halqa (32 bitli son) ================= */
export function ring(val, o = {}) {
  const size = o.size || 64, c = size / 2;
  const dr = o.dot || Math.max(1.7, size / 26);
  const R = c - dr - 5;
  let s = `<svg class="ring ${o.cls || ''}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="--c:${o.color || '#fff'}">`;
  s += `<g class="rg"${o.rot != null ? ` style="transform:rotate(${o.rot}deg)"` : ''}>`;
  for (let i = 31; i >= 0; i--) {
    const a = ((31 - i) * Math.PI) / 16;
    const x = (c + R * Math.sin(a)).toFixed(2), y = (c - R * Math.cos(a)).toFixed(2);
    const b = (val >>> i) & 1;
    let cl = 'd ' + (b ? 'on' : 'off'), st = '';
    if (o.colors && o.colors[i]) st += `--c:${o.colors[i]};`;
    if (o.reveal) {
      cl += ' rv';
      st += `animation-delay:calc(${((o.base || 0) + 0.3 + (31 - i) * o.reveal).toFixed(3)}s * var(--k));`;
    }
    if (o.bitCls) { const e = o.bitCls(i); if (e) cl += ' ' + e; }
    s += `<circle class="${cl}" cx="${x}" cy="${y}" r="${dr.toFixed(2)}" data-i="${i}" style="${st}"/>`;
  }
  s += '</g>';
  s += `<path class="mk" d="M${c - 3} 0.5h6l-3 4z"/>`;
  if (size >= 80 && o.text !== false) s += `<text x="${c}" y="${c + 3.5}" text-anchor="middle" class="rt">${hex8(val)}</text>`;
  return s + '</svg>';
}

export const it = (lab, val, color, o = {}) => {
  const d = o.d || 0;
  const st = `--d:${d}` + (o.fly ? `;--fx:${o.fx ?? 0}px;--fy:${o.fy ?? -70}px` : '');
  return `<div class="it ${o.fly ? 'fly' : 'ap'}" style="${st}"><span class="lb" style="color:${color}">${lab}</span>${ring(val, { size: o.size || 58, color, reveal: o.reveal, base: d, cls: o.glow ? 'glow' : '', colors: o.colors, bitCls: o.bitCls })}<code class="cp">${hex8(val)}</code></div>`;
};
export const opx = (t, d, big) => `<span class="op ap${big ? ' big' : ''}" style="--d:${d}">${t}</span>`;


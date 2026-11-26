// Barcha sahifalarda bir xil umumiy menyu (header).
(() => {
  // /player, /player.html, / va /index.html — hammasi to'g'ri aniqlansin
  const name = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  const items = [
    ['index', 'Umumiy sxema'],
    ['learn', 'Asoslar'],
    ['player', 'Jonli xeshlash'],
  ];
  const h = document.createElement('header');
  h.className = 'gh';
  h.innerHTML = `<a class="gh-logo" href="index.html"><span>SHA-256</span></a><span class="gh-sp"></span>`
    + items.map(([id, t]) => `<a class="gh-a${name === id ? ' act' : ''}" href="${id}.html">${t}</a>`).join('');
  document.body.prepend(h);
})();

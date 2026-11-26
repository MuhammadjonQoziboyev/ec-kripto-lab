// Har bir algoritm sahifasida bosh sahifaga qaytish tugmasi.
(() => {
  const a = document.createElement('a');
  a.href = '../';
  a.textContent = '← Bosh sahifa';
  a.setAttribute('style',
    'position:fixed;left:14px;bottom:14px;z-index:99999;padding:8px 14px;border-radius:999px;' +
    'background:rgba(11,16,32,.88);color:#e6edf7;border:1px solid rgba(255,255,255,.18);' +
    'font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:none;backdrop-filter:blur(6px)');
  document.body.appendChild(a);
})();

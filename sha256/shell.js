// Qat'iy 1600×900 kanvas: umumiy header (56px) ostida, oynaga mos masshtablanadi. Scroll yo'q.
const app = document.getElementById('app');
const HDR = 56;
const fit = () => {
  const avail = innerHeight - HDR;
  const s = Math.min(innerWidth / 1600, avail / (900 - HDR));
  app.style.transform = `scale(${s})`;
  app.style.left = `${(innerWidth - 1600 * s) / 2}px`;
  app.style.top = `${HDR + (avail - (900 - HDR) * s) / 2 - HDR * s}px`;
};
addEventListener('resize', fit);
fit();

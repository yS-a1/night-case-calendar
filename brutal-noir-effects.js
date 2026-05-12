(() => {
  const light = document.getElementById('light');
  if (light) {
    let mx = innerWidth / 2, my = innerHeight / 2, lx = mx, ly = my;
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    function tick() {
      lx += (mx - lx) * 0.09;
      ly += (my - ly) * 0.09;
      light.style.left = lx + 'px';
      light.style.top = ly + 'px';
      requestAnimationFrame(tick);
    }
    tick();
  }

  const canvas = document.getElementById('rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let drops = [];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function resizeRain() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = window.innerWidth < 720 ? 45 : 100;
    drops = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: Math.random() * 16 + 6,
      speed: Math.random() * 2.5 + 1.5,
      opacity: Math.random() * 0.15 + 0.03,
      width: Math.random() * 0.5 + 0.3
    }));
  }
  resizeRain();
  window.addEventListener('resize', resizeRain, { passive: true });
  if (reduced) return;
  function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y + d.len);
      ctx.strokeStyle = `rgba(93,216,245,${d.opacity})`;
      ctx.lineWidth = d.width;
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(drawRain);
  }
  drawRain();
})();

// Live wallpaper (Canvas 2D) — lightweight, no external libraries.
// Draws softly-glowing particles in a slow flow field.

(() => {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  const canvas = document.getElementById('wallpaper-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const rand = (min, max) => min + Math.random() * (max - min);

  const colors = {
    green: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#16a34a',
    blue: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#2563eb',
  };

  const particleCount = () => {
    // Scale with area but clamp for performance
    const area = w * h;
    const base = Math.sqrt(area) / 10;
    return Math.max(40, Math.min(140, Math.floor(base)));
  };

  const particles = [];
  // Investor mode: slightly reduce intensity for smoother look on presentations.
  const presentationMode = document.body?.dataset?.presentation === 'true';


  let lastT = 0;
  let rafId = 0;
  let running = true;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Re-seed particles on resize
    particles.length = 0;
    const count = particleCount();

    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.15, 0.15),
        vy: rand(-0.15, 0.15),
        r: rand(0.8, 2.2),
        life: rand(0.3, 1),
        hueT: Math.random(),
      });
    }
  }

  function flowFieldAngle(x, y, t) {
    // Simple smooth-ish field using trig (fast, no noise lib)
    const nx = x / Math.max(1, w);
    const ny = y / Math.max(1, h);
    return (
      Math.sin((nx * 3.0 + t * 0.00012) * Math.PI * 2) +
      Math.cos((ny * 3.0 - t * 0.00010) * Math.PI * 2)
    );
  }

  function drawBackground(t) {
    // Gentle gradient wash
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(22, 163, 74, 0.10)');
    g.addColorStop(0.5, 'rgba(37, 99, 235, 0.08)');
    g.addColorStop(1, 'rgba(16, 185, 129, 0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0.00)');
    vg.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  function step(t) {
    if (!running) return;
    rafId = requestAnimationFrame(step);

    const dt = t - lastT;
    lastT = t;

    // Clear with slight alpha for motion trails
    ctx.clearRect(0, 0, w, h);
    drawBackground(t);

    const count = particles.length;
    if (!count) return;

    // One pass
    for (let i = 0; i < count; i++) {
      const p = particles[i];

      const a = flowFieldAngle(p.x, p.y, t);
      const sp = 0.12 + 0.22 * p.life;

      // Move
      p.vx += Math.cos(a * Math.PI) * sp * (dt / 16.67) * 0.02;
      p.vy += Math.sin(a * Math.PI) * sp * (dt / 16.67) * 0.02;

      // Dampen
      p.vx *= 0.985;
      p.vy *= 0.985;

      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);

      // Wrap around
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Draw particle
      const mix = p.hueT;
      const cx = p.x;
      const cy = p.y;

      const alpha = 0.10 + 0.12 * p.life;
      ctx.beginPath();
      ctx.fillStyle = mix < 0.5
        ? `rgba(22, 163, 74, ${alpha})`
        : `rgba(37, 99, 235, ${alpha})`;

      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.fillStyle = mix < 0.5
        ? `rgba(74, 222, 128, ${alpha * 0.55})`
        : `rgba(96, 165, 250, ${alpha * 0.55})`;
      ctx.arc(cx, cy, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function start() {
    if (prefersReduced?.matches) return;
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function applyMotionPreference() {
    if (prefersReduced?.matches) {
      stop();
      // draw one static frame
      ctx.clearRect(0, 0, w, h);
      drawBackground(performance.now());
    } else {
      // Ensure animation is running
      if (!running) {
        running = true;
        lastT = performance.now();
        rafId = requestAnimationFrame(step);
      }
    }
  }

  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      applyMotionPreference();
    }
  });

  // Init
  resize();
  applyMotionPreference();

  // In case viewport changes due to address bar / zoom
  window.addEventListener('orientationchange', resize, { passive: true });
})();


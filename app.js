// ========= helpers =========
const qs = (s) => document.querySelector(s);

// ========= mobile menu =========
const menuBtn = qs("#menuBtn");
const mobileMenu = qs("#mobileMenu");

menuBtn.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("show");
  menuBtn.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
});

mobileMenu.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    mobileMenu.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  });
});

// ========= footer year =========
qs("#year").textContent = new Date().getFullYear();

// ========= tilt effect =========
const card = qs("#tiltCard");
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function onMove(e){
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;

  const rotY = (px - 0.5) * 14;   // left/right
  const rotX = (0.5 - py) * 14;   // up/down
  card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}
function onLeave(){
  card.style.transform = `rotateX(0deg) rotateY(0deg)`;
}
card.addEventListener("mousemove", onMove);
card.addEventListener("mouseleave", onLeave);

// ========= 3D-ish background (particles with depth) =========
const canvas = qs("#bg");
const ctx = canvas.getContext("2d");

let W, H, DPR;
let particles = [];
let mouse = { x: 0, y: 0 };

function resize(){
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = canvas.width = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  initParticles();
}
window.addEventListener("resize", resize);

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX * DPR;
  mouse.y = e.clientY * DPR;
});

function rand(min, max){ return Math.random() * (max - min) + min; }

function initParticles(){
  const count = Math.floor((window.innerWidth * window.innerHeight) / 18000);
  particles = new Array(count).fill(0).map(() => ({
    x: rand(0, W),
    y: rand(0, H),
    z: rand(0.2, 1.0),        // depth
    vx: rand(-0.25, 0.25),
    vy: rand(-0.25, 0.25),
    r: rand(1.2, 2.4)
  }));
}

function draw(){
  ctx.clearRect(0,0,W,H);

  // subtle vignette
  const g = ctx.createRadialGradient(W*0.7, H*0.25, 0, W*0.7, H*0.25, Math.max(W,H)*0.8);
  g.addColorStop(0, "rgba(86,77,255,0.10)");
  g.addColorStop(0.55, "rgba(0,255,209,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // particles
  for (const p of particles){
    // move
    p.x += p.vx * p.z * 2;
    p.y += p.vy * p.z * 2;

    // wrap
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    if (p.y < -10) p.y = H + 10;
    if (p.y > H + 10) p.y = -10;

    // mouse parallax by depth
    const dx = (mouse.x - W/2) * 0.0008 * p.z;
    const dy = (mouse.y - H/2) * 0.0008 * p.z;

    const x = p.x + dx * W;
    const y = p.y + dy * H;

    const alpha = 0.25 + 0.55 * p.z;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(x, y, p.r * p.z * DPR, 0, Math.PI * 2);
    ctx.fill();
  }

  // connecting lines (near neighbors)
  for (let i=0;i<particles.length;i++){
    for (let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist2 = dx*dx + dy*dy;
      const max = 120 * DPR; // connection radius
      if (dist2 < max*max){
        const dist = Math.sqrt(dist2);
        const t = 1 - dist / max;
        ctx.strokeStyle = `rgba(255,255,255,${0.08 * t})`;
        ctx.lineWidth = 1 * Math.min(a.z, b.z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

resize();
draw();

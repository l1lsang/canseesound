const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
const spotlight = document.querySelector('.spotlight');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = [];
const maxParticles = 100;
let windForce = 0;

const sparks = [];
const waveRings = [];
const instruments = ["drum", "piano", "sax"];

let spotlightImpact = 0;
let waveImpact = 0;

// -------------------- Spark Class --------------------
class Spark {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    this.size = 3 + Math.random() * 3;
    this.life = 30;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    this.alpha -= 0.03;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color.replace('ALPHA', this.alpha.toFixed(2));
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// -------------------- WaveRing Class --------------------
class WaveRing {
  constructor(x, y, color, force = 5) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 10;
    this.alpha = 0.8;
    this.growth = 2;
    this.life = 30;
    this.force = force;
  }
  update() {
    this.radius += this.growth;
    this.alpha -= 0.02;
    this.life--;

    // 주변 파티클에 충격
    particles.forEach(p => {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.radius + 50) {
        const angle = Math.atan2(dy, dx);
        const pushForce = (this.force / dist) * 2;

        if (p.instrument === "drum") {
          p.x += Math.cos(angle) * pushForce * 0.8;
          p.y += Math.sin(angle) * pushForce * 0.8;
        } else if (p.instrument === "piano") {
          p.x += Math.cos(angle) * pushForce * 0.3;
          p.y += Math.sin(angle) * pushForce * 0.3;
        } else {
          p.x += Math.cos(angle) * pushForce * 0.5;
          p.y += Math.sin(angle) * pushForce * 0.5;
        }
      }
    });
  }
  draw() {
    ctx.beginPath();
    ctx.strokeStyle = this.color.replace('ALPHA', this.alpha.toFixed(2));
    ctx.lineWidth = 3;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// -------------------- Particle Class --------------------
class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.instrument = instruments[Math.floor(Math.random() * instruments.length)];
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 100;
    this.alpha = 0;
    this.baseSize = 30 + Math.random() * 50;
    this.fadeIn = true;
    this.dynamicSize = this.baseSize;
    this.angle = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 0.002;
    this.trails = [];

    if (this.instrument === "drum") {
      this.speed = 0.6 + Math.random() * 0.4;
      this.xDirection = (Math.random() - 0.5) * 1;
      this.gravity = 0.02;
      this.trailLength = 15;
    } else if (this.instrument === "piano") {
      this.speed = 0.2 + Math.random() * 0.2;
      this.xDirection = (Math.random() - 0.5) * 0.2;
      this.gravity = 0.005;
      this.trailLength = 8;
    } else if (this.instrument === "sax") {
      this.speed = 0.3 + Math.random() * 0.3;
      this.xDirection = (Math.random() - 0.5) * 0.5;
      this.gravity = 0.01;
      this.trailLength = 12;
    }
  }
  update(volume) {
    this.y -= this.speed + volume * 0.01;

    if (this.instrument === "drum") {
      this.y -= this.gravity * (1 + volume / 200);
    } else if (this.instrument === "piano") {
      this.y -= this.gravity * 0.5;
    } else if (this.instrument === "sax") {
      this.x += Math.sin(Date.now() * 0.002) * 0.5;
      this.y -= this.gravity;
    }

    this.x += this.xDirection + windForce;
    this.angle += this.rotationSpeed;

    if (this.instrument === "drum") {
      this.dynamicSize = this.baseSize * (1.2 + volume / 120);
    } else if (this.instrument === "piano") {
      this.dynamicSize = this.baseSize * (0.6 + volume / 300);
    } else if (this.instrument === "sax") {
      this.dynamicSize = this.baseSize * (0.8 + volume / 200);
    }

    this.trails.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trails.length > this.trailLength) this.trails.shift();

    if (this.fadeIn) {
      this.alpha += 0.005;
      if (this.alpha >= 0.4) this.fadeIn = false;
    } else {
      this.alpha -= 0.002;
    }

    // 충돌 감지 → Spark + WaveRing + Spotlight & WaveImpact
    if (this.y <= 0 || this.x <= 0 || this.x >= canvas.width) {
      let color;
      let force = 5;
      if (this.instrument === "drum") {
        const red = Math.min(255, 180 + volume / 2);
        color = `rgba(${red}, 50, 50, ALPHA)`;
        force = 8;
        spotlightImpact = 0.5;
        waveImpact = 20;
      } else if (this.instrument === "sax") {
        const blue = Math.min(255, 180 + volume / 2);
        color = `rgba(50, ${blue}, ${blue + 20}, ALPHA)`;
        force = 5;
        spotlightImpact = 0.3;
        waveImpact = 12;
      } else {
        const gold = Math.min(255, 180 + volume / 2);
        color = `rgba(${gold}, 215, 0, ALPHA)`;
        force = 4;
        spotlightImpact = 0.2;
        waveImpact = 8;
      }

      for (let i = 0; i < 5; i++) sparks.push(new Spark(this.x, this.y, color));
      waveRings.push(new WaveRing(this.x, this.y, color, force));
      this.reset();
    }

    if (this.alpha <= 0 || this.y + this.dynamicSize < 0) {
      this.reset();
    }
  }
  draw(volume, bass, mid, treble) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    let colorCenter;
    if (this.instrument === "drum") {
      const red = Math.min(255, 180 + bass / 2);
      colorCenter = `rgba(${red}, 50, 50, ${this.alpha})`;
    } else if (this.instrument === "sax") {
      const blue = Math.min(255, 180 + treble / 2);
      colorCenter = `rgba(50, ${blue}, ${blue + 20}, ${this.alpha})`;
    } else if (this.instrument === "piano") {
      const gold = Math.min(255, 180 + mid / 2);
      colorCenter = `rgba(${gold}, 215, 0, ${this.alpha})`;
    }

    ctx.fillStyle = colorCenter;

    if (this.instrument === "drum") {
      ctx.beginPath();
      ctx.arc(0, 0, this.dynamicSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.instrument === "piano") {
      ctx.beginPath();
      ctx.rect(-this.dynamicSize / 2, -this.dynamicSize / 2, this.dynamicSize / 2, this.dynamicSize / 2);
      ctx.fill();
    } else if (this.instrument === "sax") {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.dynamicSize * 0.7, this.dynamicSize * 0.3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Trail
    this.trails.forEach((trail, i) => {
      const trailAlpha = (i / this.trails.length) * this.alpha * 0.6;
      ctx.beginPath();
      ctx.fillStyle = colorCenter.replace(this.alpha, trailAlpha.toFixed(2));
      ctx.arc(trail.x, trail.y, this.dynamicSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// -------------------- Init Particles --------------------
for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

// -------------------- Audio --------------------
const audio = document.getElementById('jazzAudio');
const playBtn = document.getElementById('playBtn');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioContext.destination);
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    audioContext.resume();
  } else {
    audio.pause();
  }
});

// -------------------- Wind Effect --------------------
setInterval(() => {
  windForce = (Math.random() - 0.5) * 0.5;
  setTimeout(() => { windForce = 0; }, 1500);
}, 5000);

// -------------------- Multi-layer Waves --------------------
function drawMultiLayerWaves(bass, mid, treble) {
  const layers = [
    { amplitude: 25, wavelength: 140, speed: 0.0015, opacity: 0.05, color: `rgba(${180 + bass/2}, 50, 50,` },
    { amplitude: 35, wavelength: 90,  speed: 0.002,  opacity: 0.08, color: `rgba(${180 + mid/2}, 215, 0,` },
    { amplitude: 45, wavelength: 70,  speed: 0.003,  opacity: 0.12, color: `rgba(50, ${180 + treble/2}, ${200 + treble/3},` }
  ];

  layers.forEach((layer, index) => {
    ctx.save();
    ctx.beginPath();

    const amp = layer.amplitude + waveImpact + (index === 0 ? bass : index === 1 ? mid : treble) / 3;
    const speed = Date.now() * layer.speed;

    ctx.moveTo(0, canvas.height / 2);
    for (let x = 0; x <= canvas.width; x++) {
      const y = canvas.height / 2 +
        Math.sin((x + speed * 100) / layer.wavelength) * amp;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `${layer.color} ${layer.opacity})`;
    ctx.lineWidth = 2 - index * 0.5;
    ctx.stroke();
    ctx.restore();
  });

  waveImpact *= 0.9;
}

// -------------------- Animation Loop --------------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  const mid = dataArray.slice(20, 80).reduce((a, b) => a + b, 0) / 60;
  const treble = dataArray.slice(80).reduce((a, b) => a + b, 0) / (dataArray.length - 80);

  drawMultiLayerWaves(bass, mid, treble);

  const spotlightScale = 1 + volume / 300 + spotlightImpact;
  const spotlightOpacity = Math.min(0.8, 0.2 + volume / 300 + spotlightImpact);
  const r = Math.min(255, 180 + bass / 2);
  const g = Math.min(215, 180 + mid / 2);
  const b = Math.min(255, 180 + treble / 2);

  spotlight.style.background = `
    radial-gradient(circle,
      rgba(${r}, ${g}, ${b}, 0.5) 0%,
      rgba(${r}, ${g}, ${b}, 0.2) 70%,
      transparent 100%
    )
  `;
  spotlight.style.transform = `translate(-50%, -50%) scale(${spotlightScale})`;
  spotlight.style.opacity = spotlightOpacity;

  spotlightImpact *= 0.9;

  for (const p of particles) {
    p.update(volume);
    p.draw(volume, bass, mid, treble);
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update();
    sparks[i].draw();
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }

  for (let i = waveRings.length - 1; i >= 0; i--) {
    waveRings[i].update();
    waveRings[i].draw();
    if (waveRings[i].life <= 0) waveRings.splice(i, 1);
  }

  requestAnimationFrame(animate);
}

animate();

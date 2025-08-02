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

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 100;
    this.alpha = 0;
    this.size = 50 + Math.random() * 100;
    this.speed = 0.2 + Math.random() * 0.3;
    this.fadeIn = true;
    this.dynamicSize = this.size;
    this.angle = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 0.002;
    this.xDirection = (Math.random() - 0.5) * 0.3;

    // 🎨 입자별 주파수 영역 (Bass, Mid, Treble)
    const freqZones = ["bass", "mid", "treble"];
    this.freqZone = freqZones[Math.floor(Math.random() * freqZones.length)];
  }
  update(volume) {
    this.y -= this.speed + volume * 0.01;
    this.x += this.xDirection + windForce;
    this.angle += this.rotationSpeed;

    this.dynamicSize = this.size * (0.8 + volume / 200);
    if (this.fadeIn) {
      this.alpha += 0.005;
      if (this.alpha >= 0.4) this.fadeIn = false;
    } else {
      this.alpha -= 0.002;
    }
    if (this.alpha <= 0 || this.y + this.size < 0) {
      this.reset();
    }
  }
  draw(volume, bass, mid, treble) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    let colorCenter, colorEdge;

    // 🌈 음역대별 색상
    if (this.freqZone === "bass") {
      const red = Math.min(255, 180 + bass / 2);
      colorCenter = `rgba(${red}, 50, 50, ${this.alpha})`;
      colorEdge = `rgba(${red}, 50, 50, 0)`;
    } else if (this.freqZone === "treble") {
      const blue = Math.min(255, 180 + treble / 2);
      colorCenter = `rgba(50, ${blue}, ${blue + 20}, ${this.alpha})`;
      colorEdge = `rgba(50, ${blue}, ${blue + 20}, 0)`;
    } else {
      const gold = Math.min(255, 180 + mid / 2);
      colorCenter = `rgba(${gold}, 215, 0, ${this.alpha})`;
      colorEdge = `rgba(${gold}, 215, 0, 0)`;
    }

    const gradient = ctx.createRadialGradient(
      0, 0, this.dynamicSize * 0.2,
      0, 0, this.dynamicSize
    );
    gradient.addColorStop(0, colorCenter);
    gradient.addColorStop(1, colorEdge);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.dynamicSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 🌫️ 입자 생성
for (let i = 0; i < maxParticles; i++) {
  particles.push(new Particle());
}

// 🎶 오디오 분석
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

// 🌬️ 랜덤 바람 효과
setInterval(() => {
  windForce = (Math.random() - 0.5) * 0.5;
  setTimeout(() => { windForce = 0; }, 1500);
}, 5000);

// 🌊 3중 파동 (악기별 색상)
function drawMultiLayerWaves(bass, mid, treble) {
  const layers = [
    { amplitude: 25, wavelength: 140, speed: 0.0015, opacity: 0.05, color: `rgba(${180 + bass/2}, 50, 50,` }, // Bass → Red
    { amplitude: 35, wavelength: 90,  speed: 0.002,  opacity: 0.08, color: `rgba(${180 + mid/2}, 215, 0,` }, // Mid → Gold
    { amplitude: 45, wavelength: 70,  speed: 0.003,  opacity: 0.12, color: `rgba(50, ${180 + treble/2}, ${200 + treble/3},` } // Treble → Turquoise
  ];

  layers.forEach((layer, index) => {
    ctx.save();
    ctx.beginPath();

    const amp = layer.amplitude + (index === 0 ? bass : index === 1 ? mid : treble) / 3;
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
}

// 🎨 애니메이션
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  const mid = dataArray.slice(20, 80).reduce((a, b) => a + b, 0) / 60;
  const treble = dataArray.slice(80).reduce((a, b) => a + b, 0) / (dataArray.length - 80);

  // 🌊 악기별 색상 파동
  drawMultiLayerWaves(bass, mid, treble);

  // 🔆 Spotlight 색상 + 리듬 반응
  const spotlightScale = 1 + volume / 300;
  const spotlightOpacity = Math.min(0.6, 0.2 + volume / 300);
  const r = Math.min(255, 180 + bass / 2);
  const g = Math.min(215, 180 + mid / 2);
  const b = Math.min(255, 180 + treble / 2);

  spotlight.style.background = `
    radial-gradient(circle,
      rgba(${r}, ${g}, ${b}, 0.4) 0%,
      rgba(${r}, ${g}, ${b}, 0.1) 70%,
      transparent 100%
    )
  `;
  spotlight.style.transform = `translate(-50%, -50%) scale(${spotlightScale})`;
  spotlight.style.opacity = spotlightOpacity;

  // 🌫️ 연기
  for (const p of particles) {
    p.update(volume);
    p.draw(volume, bass, mid, treble);
  }
  requestAnimationFrame(animate);
}

animate();

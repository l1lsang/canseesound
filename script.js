const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = [];
const maxParticles = 100;

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
  }
  update(volume) {
    this.y -= this.speed;
    this.dynamicSize = this.size * (0.8 + volume / 255);
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
  draw(volume) {
    ctx.beginPath();

    // 🔥 황금빛 컬러 (볼륨이 클수록 더 밝게)
    const goldBrightness = Math.min(255, 180 + volume / 2);
    const colorCenter = `rgba(${goldBrightness}, 215, 0, ${this.alpha})`;
    const colorEdge = `rgba(${goldBrightness}, 215, 0, 0)`;

    const gradient = ctx.createRadialGradient(
      this.x, this.y, this.dynamicSize * 0.2,
      this.x, this.y, this.dynamicSize
    );
    gradient.addColorStop(0, colorCenter);
    gradient.addColorStop(1, colorEdge);
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.dynamicSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

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

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  analyser.getByteFrequencyData(dataArray);
  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  for (const p of particles) {
    p.update(volume);
    p.draw(volume);
  }
  requestAnimationFrame(animate);
}

animate();


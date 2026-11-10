import './style.css';

const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
}

new ResizeObserver(resizeCanvas).observe(canvas);
window.addEventListener('orientationchange', resizeCanvas);

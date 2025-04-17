// Arquivo principal do jogo Snake para WebView do VSCode
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

let snake = [{ x: 200, y: 200 }];
let direction = { x: 20, y: 0 };
let food = { x: 100, y: 100 };
let goldenFood = null;
let goldenFoodTimeout = null;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let gameSpeed = 150;
let updateInterval;
let angle = 0;
let lastMilestone = 0;
let growAmount = 0;

const boxSize = 20;
const canvasSize = 400;

let barriers = [];

function isOccupied(x, y) {
  return (
    snake.some((s) => s.x === x && s.y === y) ||
    barriers.some((b) => b.x === x && b.y === y)
  );
}

function generateFreePosition() {
  let x, y;
  do {
    x = Math.floor(Math.random() * (canvasSize / boxSize)) * boxSize;
    y = Math.floor(Math.random() * (canvasSize / boxSize)) * boxSize;
  } while (isOccupied(x, y));
  return { x, y };
}

function updateScoreDisplay() {
  document.getElementById('score').textContent = score;
  document.getElementById('record').textContent = highScore;
}

function drawBoard() {
  ctx.fillStyle = '#44475a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const b of barriers) {
    ctx.fillStyle = '#6272a4';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, boxSize, boxSize, 4);
    ctx.fill();
  }
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    const gradient = ctx.createLinearGradient(
      s.x,
      s.y,
      s.x + boxSize,
      s.y + boxSize
    );

    if (i === 0) {
      gradient.addColorStop(0, '#8be9fd');
      gradient.addColorStop(1, '#50fa7b');
      ctx.shadowColor = '#8be9fd';
    } else {
      gradient.addColorStop(0, '#50fa7b');
      gradient.addColorStop(1, '#3ad29f');
      ctx.shadowColor = '#50fa7b';
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, boxSize, boxSize, 6);
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawFood() {
  const centerX = food.x + boxSize / 2;
  const centerY = food.y + boxSize / 2;

  const pulse = Math.sin(angle * 2) * 2 + boxSize / 2;

  // Comida base
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    4,
    centerX,
    centerY,
    pulse
  );
  gradient.addColorStop(0, '#ffb6e6');
  gradient.addColorStop(1, '#FF79C6');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
  ctx.shadowColor = '#FF79C6';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Partículas
  for (let i = 0; i < 6; i++) {
    const rad = angle + (i * Math.PI) / 3;
    const x = centerX + Math.cos(rad) * 12;
    const y = centerY + Math.sin(rad) * 12;
    ctx.fillStyle = '#bd93f9';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  angle += 0.05;

  if (goldenFood) {
    const gx = goldenFood.x + boxSize / 2;
    const gy = goldenFood.y + boxSize / 2;

    const gPulse = Math.sin(angle * 3) * 2 + boxSize / 2;

    const goldenGradient = ctx.createRadialGradient(gx, gy, 4, gx, gy, gPulse);
    goldenGradient.addColorStop(0, '#fff68f');
    goldenGradient.addColorStop(1, '#f1fa8c');

    ctx.fillStyle = goldenGradient;
    ctx.beginPath();
    ctx.arc(gx, gy, gPulse, 0, Math.PI * 2);
    ctx.shadowColor = '#f1fa8c';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawScore() {
  updateScoreDisplay();
}

function showGameOver() {
  gameOverScreen.classList.remove('hidden');
}

function checkAchievements() {
  if (score >= 10 && lastMilestone < 10) {
    showAchievement('🔥 Combo 10!');
    lastMilestone = 10;
  }
  if (score >= 20 && lastMilestone < 20) {
    showAchievement('🐍 Você é lendário!');
    lastMilestone = 20;
  }
}

function showAchievement(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'absolute';
  toast.style.bottom = '40px';
  toast.style.padding = '10px 20px';
  toast.style.background = '#ff79c6';
  toast.style.color = '#282a36';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 0 12px #ff79c6';
  toast.style.fontWeight = 'bold';
  toast.style.transition = 'all 0.5s';
  toast.style.zIndex = 999;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

function update() {
  if (!gameStarted) {
    return;
  }
  if (gameOver) {
    showGameOver();
    return;
  }

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Colisão com parede
  if (
    head.x < 0 ||
    head.x >= canvasSize ||
    head.y < 0 ||
    head.y >= canvasSize
  ) {
    gameOver = true;
    return;
  }

  // Colisão com si mesmo
  for (const segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOver = true;
      return;
    }
  }

  // Colisão com obstáculos
  for (const b of barriers) {
    if (head.x === b.x && head.y === b.y) {
      gameOver = true;
      return;
    }
  }

  snake.unshift(head); // adiciona nova cabeça

  // Comer comida normal
  if (head.x === food.x && head.y === food.y) {
    score++;
    growAmount += 0; 
    if (score % 5 === 0 && gameSpeed > 60) {
      gameSpeed -= 10;
      startGameLoop();
    }
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
    }
    food = generateFreePosition();
    if (Math.random() < 0.2) {
      spawnGoldenFood();
    }
    checkAchievements();

    // Comer golden food
  } else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
    score += 3;
    growAmount += 2;
    goldenFood = null;
    clearTimeout(goldenFoodTimeout);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
    }
    checkAchievements();
  } else {
    // Se não comeu nada, remover cauda
    if (growAmount > 0) {
      growAmount--;
    } else {
      snake.pop();
    }
  }

  drawBoard();
  drawSnake();
  drawFood();
  drawScore();
}

function startGameLoop() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  updateInterval = setInterval(update, gameSpeed);
}

window.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowUp: { x: 0, y: -boxSize },
    ArrowDown: { x: 0, y: boxSize },
    ArrowLeft: { x: -boxSize, y: 0 },
    ArrowRight: { x: boxSize, y: 0 },
  };
  if (keyMap[e.key]) {
    direction = keyMap[e.key];
  }
  if (gameOver && e.key.toLowerCase() === 'r') {
    resetGame();
  }
});

function startGame() {
  spawnGoldenFood();

  startScreen.classList.add('hidden');
  gameStarted = true;
  score = 0;
  gameOver = false;
  snake = [{ x: 200, y: 200 }];
  direction = { x: boxSize, y: 0 };
  food = generateFreePosition();
  barriers = Array.from({ length: 6 }, () => generateFreePosition());
  startGameLoop();
}

function resetGame() {
  spawnGoldenFood();

  snake = [{ x: 200, y: 200 }];
  direction = { x: boxSize, y: 0 };
  score = 0;
  gameOver = false;
  goldenFood = null;
  gameSpeed = 150;
  lastMilestone = 0;
  food = generateFreePosition();
  barriers = Array.from({ length: 6 }, () => generateFreePosition());
  gameOverScreen.classList.add('hidden');
  startGameLoop();
}

function spawnGoldenFood() {
  goldenFood = generateFreePosition();

  if (goldenFoodTimeout) {
    clearTimeout(goldenFoodTimeout);
  }

  goldenFoodTimeout = setTimeout(() => {
    goldenFood = null;
  }, 3000);
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) {
    r = w / 2;
  }
  if (h < 2 * r) {
    r = h / 2;
  }
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

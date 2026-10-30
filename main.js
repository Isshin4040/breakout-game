const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const PADDLE_W = 90;
const PADDLE_H = 12;
const PADDLE_SPEED = 7;
const BALL_R = 7;

const ROWS = 6;
const COLS = 8;
const BRICK_H = 22;
const BRICK_GAP = 4;
const BRICK_TOP = 60;
const BRICK_W = (W - BRICK_GAP * (COLS + 1)) / COLS;
const ROW_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let paddle, ball, bricks, score, lives, state;
// state: "ready" | "playing" | "gameover" | "clear"

const keys = { left: false, right: false };

function createBricks() {
  const list = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      list.push({
        x: BRICK_GAP + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        color: ROW_COLORS[r],
        alive: true,
      });
    }
  }
  return list;
}

function resetBall() {
  ball = {
    x: paddle.x + PADDLE_W / 2,
    y: H - 40 - BALL_R,
    vx: 0,
    vy: 0,
  };
}

function init() {
  paddle = { x: (W - PADDLE_W) / 2 };
  bricks = createBricks();
  score = 0;
  lives = 3;
  state = "ready";
  resetBall();
}

function launch() {
  const angle = (Math.random() * 60 - 30) * Math.PI / 180;
  const speed = 7;
  ball.vx = speed * Math.sin(angle);
  ball.vy = -speed * Math.cos(angle);
  state = "playing";
}

function update() {
  if (keys.left) paddle.x -= PADDLE_SPEED;
  if (keys.right) paddle.x += PADDLE_SPEED;
  paddle.x = Math.max(0, Math.min(W - PADDLE_W, paddle.x));

  if (state === "ready") {
    ball.x = paddle.x + PADDLE_W / 2;
    return;
  }
  if (state !== "playing") return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // 壁との衝突
  if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx *= -1; }
  if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx *= -1; }
  if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy *= -1; }

  // パドルとの衝突
  const paddleY = H - 30;
  if (
    ball.vy > 0 &&
    ball.y + BALL_R >= paddleY &&
    ball.y + BALL_R <= paddleY + PADDLE_H + ball.vy &&
    ball.x >= paddle.x - BALL_R &&
    ball.x <= paddle.x + PADDLE_W + BALL_R
  ) {
    const hit = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2); // -1..1
    const speed = Math.min(11, Math.hypot(ball.vx, ball.vy) * 1.01);
    const angle = hit * 65 * Math.PI / 180;
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);
    ball.y = paddleY - BALL_R;
  }

  // ブロックとの衝突
  for (const b of bricks) {
    if (!b.alive) continue;
    if (
      ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + BRICK_W &&
      ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + BRICK_H
    ) {
      b.alive = false;
      score += 10;
      // めり込みが浅い軸で反射方向を決める
      const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + BRICK_W - (ball.x - BALL_R));
      const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + BRICK_H - (ball.y - BALL_R));
      if (overlapX < overlapY) ball.vx *= -1;
      else ball.vy *= -1;
      break;
    }
  }

  if (bricks.every((b) => !b.alive)) {
    state = "clear";
    return;
  }

  // ミス
  if (ball.y - BALL_R > H) {
    lives--;
    if (lives <= 0) {
      state = "gameover";
    } else {
      state = "ready";
      resetBall();
    }
  }
}

function drawText(text, x, y, size, align = "center") {
  ctx.fillStyle = "#fff";
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
  }

  ctx.fillStyle = "#ecf0f1";
  ctx.fillRect(paddle.x, H - 30, PADDLE_W, PADDLE_H);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = "#ff1493";
  ctx.fill();

  drawText(`SCORE: ${score}`, 10, 30, 18, "left");
  drawText(`LIVES: ${lives}`, W - 10, 30, 18, "right");

  if (state === "ready") {
    drawText("スペースキー / クリックでスタート", W / 2, H / 2 + 60, 20);
  } else if (state === "gameover") {
    drawText("GAME OVER", W / 2, H / 2, 40);
    drawText("スペースキーでリトライ", W / 2, H / 2 + 40, 20);
  } else if (state === "clear") {
    drawText("CLEAR!", W / 2, H / 2, 40);
    drawText("スペースキーでもう一度", W / 2, H / 2 + 40, 20);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function action() {
  if (state === "ready") launch();
  else if (state === "gameover" || state === "clear") init();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.code === "Space") {
    e.preventDefault();
    action();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  paddle.x = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
});

canvas.addEventListener("click", action);

init();
loop();

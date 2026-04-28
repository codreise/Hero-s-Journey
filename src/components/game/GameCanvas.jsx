import React, { useRef, useEffect, useCallback, useState } from "react";

const GRID = 20;
const BG_COLOR = "#1a1040";
const GRID_COLOR = "#251660";

// Draw beautiful sprites
function drawPlayer(ctx, x, y, size, invincible, timestamp) {
  const blink = invincible > 0 && Math.floor(timestamp / 80) % 2 === 0;
  if (blink) return;

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Glow effect
  ctx.shadowColor = "#60E0FF";
  ctx.shadowBlur = 15;
  
  // Main body gradient
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, size / 2.2);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.4, "#00FFFF");
  grad.addColorStop(1, "#60E0FF");
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - black
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pupils - bright
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 4, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoin(ctx, x, y, size, timestamp) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const pulse = Math.sin(timestamp * 0.006) * 1.5;
  const radius = size / 2.2 + pulse;

  // Gold gradient
  const grad = ctx.createRadialGradient(
    cx - 3, cy - 3, 1,
    cx, cy, radius
  );
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.3, "#FFFF99");
  grad.addColorStop(0.7, "#FFD700");
  grad.addColorStop(1, "#AA8800");

  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 12 + Math.abs(pulse);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner light
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 255, 200, 0.8)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Shine spot
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.arc(cx - radius * 0.35, cy - radius * 0.35, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacle(ctx, x, y, size, timestamp) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const angle = (timestamp * 0.0004) % (Math.PI * 2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Crystal top - bright red
  ctx.fillStyle = "#FF6688";
  ctx.shadowColor = "#FF4466";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.45);
  ctx.lineTo(size * 0.4, -size * 0.12);
  ctx.lineTo(size * 0.35, size * 0.25);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(-size * 0.35, size * 0.25);
  ctx.lineTo(-size * 0.4, -size * 0.12);
  ctx.closePath();
  ctx.fill();

  // Crystal bottom - dark red
  ctx.fillStyle = "#DD3355";
  ctx.beginPath();
  ctx.moveTo(size * 0.4, -size * 0.12);
  ctx.lineTo(size * 0.55, size * 0.35);
  ctx.lineTo(0, size * 0.48);
  ctx.lineTo(-size * 0.55, size * 0.35);
  ctx.lineTo(-size * 0.4, -size * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function randomPos(cols, rows, exclude = []) {
  let pos;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    attempts++;
    if (attempts > 200) break;
  } while (exclude.some((p) => p.x === pos.x && p.y === pos.y));
  return pos;
}

function generateCoins(count, cols, rows, exclude) {
  const coins = [];
  for (let i = 0; i < count; i++) {
    coins.push(randomPos(cols, rows, [...exclude, ...coins]));
  }
  return coins;
}

function generateObstacles(count, cols, rows, exclude) {
  const obs = [];
  for (let i = 0; i < count; i++) {
    obs.push(randomPos(cols, rows, [...exclude, ...obs]));
  }
  return obs;
}

export default function GameCanvas({ onScoreChange, onLivesChange, onGameOver, gameKey, directionRef }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState(400);

  const getGridDimensions = useCallback((size) => {
    const cols = Math.floor(size / GRID);
    const rows = Math.floor(size / GRID);
    return { cols, rows };
  }, []);

  const initGame = useCallback((size) => {
    const { cols, rows } = getGridDimensions(size);
    const player = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
    const coins = generateCoins(5, cols, rows, [player]);
    const obstacles = generateObstacles(8, cols, rows, [player, ...coins]);

    stateRef.current = {
      player,
      coins,
      obstacles,
      score: 0,
      lives: 3,
      gameOver: false,
      direction: null,
      cols,
      rows,
      particles: [],
      invincible: 0,
    };
    lastMoveTimeRef.current = 0;
    onScoreChange(0);
    onLivesChange(3);
    onGameOver(false);
  }, [getGridDimensions, onScoreChange, onLivesChange, onGameOver]);

  useEffect(() => {
    const updateSize = () => {
      const maxSize = Math.min(window.innerWidth - 32, 480);
      const snapped = Math.floor(maxSize / GRID) * GRID;
      setCanvasSize(snapped);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    initGame(canvasSize);
  }, [gameKey, canvasSize, initGame]);

  const movePlayer = useCallback((dir) => {
    const state = stateRef.current;
    if (!state || state.gameOver) return;

    const now = performance.now();
    if (now - lastMoveTimeRef.current < 100) return;
    lastMoveTimeRef.current = now;

    const prev = { ...state.player };
    if (dir === "up")    state.player.y = Math.max(0, state.player.y - 1);
    if (dir === "down")  state.player.y = Math.min(state.rows - 1, state.player.y + 1);
    if (dir === "left")  state.player.x = Math.max(0, state.player.x - 1);
    if (dir === "right") state.player.x = Math.min(state.cols - 1, state.player.x + 1);

    const coinIdx = state.coins.findIndex((c) => c.x === state.player.x && c.y === state.player.y);
    if (coinIdx >= 0) {
      state.coins.splice(coinIdx, 1);
      state.score += 10;
      onScoreChange(state.score);
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: state.player.x * GRID + GRID / 2,
          y: state.player.y * GRID + GRID / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          color: "#FFD700",
        });
      }
      state.coins.push(randomPos(state.cols, state.rows, [state.player, ...state.coins, ...state.obstacles]));
      if (state.score % 50 === 0) {
        state.obstacles.push(randomPos(state.cols, state.rows, [state.player, ...state.coins, ...state.obstacles]));
      }
    }

    if (state.invincible <= 0) {
      const hitObs = state.obstacles.some((o) => o.x === state.player.x && o.y === state.player.y);
      if (hitObs) {
        state.lives -= 1;
        state.invincible = 15;
        onLivesChange(state.lives);
        for (let i = 0; i < 8; i++) {
          state.particles.push({
            x: state.player.x * GRID + GRID / 2,
            y: state.player.y * GRID + GRID / 2,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: "#FF4466",
          });
        }
        if (state.lives <= 0) {
          state.gameOver = true;
          onGameOver(true);
        }
        state.player.x = prev.x;
        state.player.y = prev.y;
      }
    } else {
      state.invincible -= 1;
    }
  }, [onScoreChange, onLivesChange, onGameOver]);

  useEffect(() => {
    const handleKey = (e) => {
      const map = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        movePlayer(map[e.key]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [movePlayer]);

  useEffect(() => {
    if (!directionRef) return;
    const interval = setInterval(() => {
      if (directionRef.current) {
        movePlayer(directionRef.current);
        directionRef.current = null;
      }
    }, 50);
    return () => clearInterval(interval);
  }, [directionRef, movePlayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderLoop = (timestamp) => {
      const state = stateRef.current;
      if (!state) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        return p.life > 0;
      });

      const s = canvasSize;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, s, s);

      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= state.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID, 0);
        ctx.lineTo(i * GRID, s);
        ctx.stroke();
      }
      for (let j = 0; j <= state.rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * GRID);
        ctx.lineTo(s, j * GRID);
        ctx.stroke();
      }

      // Draw obstacles
      state.obstacles.forEach((o) => {
        drawObstacle(ctx, o.x * GRID, o.y * GRID, GRID, timestamp);
      });

      // Draw coins
      state.coins.forEach((c) => {
        drawCoin(ctx, c.x * GRID, c.y * GRID, GRID, timestamp);
      });

      // Draw player
      drawPlayer(ctx, state.player.x * GRID, state.player.y * GRID, GRID, state.invincible, timestamp);

      // Draw particles
      state.particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasSize, gameKey]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="rounded-xl border-2 border-border/50 shadow-lg shadow-primary/10 mx-auto block"
      tabIndex={0}
    />
  );
}

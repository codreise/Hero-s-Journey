import React, { useRef, useEffect, useCallback, useState } from "react";

const GRID = 20;
const PLAYER_COLOR = "#60E0FF";
const COIN_COLOR = "#FFD700";
const OBSTACLE_COLOR = "#FF4466";
const BG_COLOR = "#1a1040";
const GRID_COLOR = "#251660";

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

  // Calculate canvas size
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

  // Init game when gameKey or size changes
  useEffect(() => {
    initGame(canvasSize);
  }, [gameKey, canvasSize, initGame]);

  // Move player function — called directly on keydown & touch
  const movePlayer = useCallback((dir) => {
    const state = stateRef.current;
    if (!state || state.gameOver) return;

    const now = performance.now();
    if (now - lastMoveTimeRef.current < 100) return; // throttle 100ms
    lastMoveTimeRef.current = now;

    const prev = { ...state.player };
    if (dir === "up")    state.player.y = Math.max(0, state.player.y - 1);
    if (dir === "down")  state.player.y = Math.min(state.rows - 1, state.player.y + 1);
    if (dir === "left")  state.player.x = Math.max(0, state.player.x - 1);
    if (dir === "right") state.player.x = Math.min(state.cols - 1, state.player.x + 1);

    // Check coin collision
    const coinIdx = state.coins.findIndex(
      (c) => c.x === state.player.x && c.y === state.player.y
    );
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
          color: COIN_COLOR,
        });
      }
      state.coins.push(
        randomPos(state.cols, state.rows, [state.player, ...state.coins, ...state.obstacles])
      );
      if (state.score % 50 === 0) {
        state.obstacles.push(
          randomPos(state.cols, state.rows, [state.player, ...state.coins, ...state.obstacles])
        );
      }
    }

    // Check obstacle collision
    if (state.invincible <= 0) {
      const hitObs = state.obstacles.some(
        (o) => o.x === state.player.x && o.y === state.player.y
      );
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
            color: OBSTACLE_COLOR,
          });
        }
        if (state.lives <= 0) {
          state.gameOver = true;
          onGameOver(true);
        }
        // Push player back
        state.player.x = prev.x;
        state.player.y = prev.y;
      }
    } else {
      state.invincible -= 1;
    }
  }, [onScoreChange, onLivesChange, onGameOver]);

  // Keyboard input — direct call to movePlayer
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

  // Mobile direction via ref polling
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

  // Render loop (animation only — no move logic here)
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

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        return p.life > 0;
      });

      // Decay invincible frames over time
      if (state.invincible > 0 && Math.floor(timestamp / 80) % 2 === 0) {
        // just used for blinking visual
      }

      const s = canvasSize;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, s, s);

      // Grid lines
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

      // Obstacles
      state.obstacles.forEach((o) => {
        ctx.fillStyle = OBSTACLE_COLOR;
        ctx.shadowColor = OBSTACLE_COLOR;
        ctx.shadowBlur = 6;
        ctx.fillRect(o.x * GRID + 2, o.y * GRID + 2, GRID - 4, GRID - 4);
        ctx.shadowBlur = 0;
      });

      // Coins (pulsing)
      const pulse = Math.sin(timestamp * 0.005) * 2;
      state.coins.forEach((c) => {
        ctx.fillStyle = COIN_COLOR;
        ctx.shadowColor = COIN_COLOR;
        ctx.shadowBlur = 8 + pulse;
        ctx.beginPath();
        ctx.arc(c.x * GRID + GRID / 2, c.y * GRID + GRID / 2, GRID / 2 - 3 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Player (blink when invincible)
      const blink = state.invincible > 0 && Math.floor(timestamp / 80) % 2 === 0;
      if (!blink) {
        ctx.fillStyle = PLAYER_COLOR;
        ctx.shadowColor = PLAYER_COLOR;
        ctx.shadowBlur = 12;
        const px = state.player.x * GRID + 2;
        const py = state.player.y * GRID + 2;
        const ps = GRID - 4;
        ctx.beginPath();
        ctx.roundRect(px, py, ps, ps, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#1a1040";
        ctx.fillRect(px + 4, py + 5, 3, 3);
        ctx.fillRect(px + ps - 7, py + 5, 3, 3);
        ctx.fillRect(px + 4, py + ps - 7, ps - 8, 2);
      }

      // Particles
      state.particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
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
      style={{ imageRendering: "pixelated" }}
      tabIndex={0}
    />
  );
}
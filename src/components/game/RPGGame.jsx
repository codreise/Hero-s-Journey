import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  applyRewardChoice,
  awardExperience,
  COLS,
  createBossPreview,
  createGameState,
  createSaveSnapshot,
  generateRewardChoices,
  getScaledCoinAmount,
  GRID,
  isBossWave,
  isWall,
  MAX_LEVEL,
  ROWS,
  spawnWaveEnemies,
  TILE,
  xpToNextLevel,
} from "./useRPGState";
import GameUI from "./GameUI";
import MobileRPGControls from "./MobileRPGControls";
import { useTelegramMiniApp } from "../../lib/telegram-mini-app";

const FLOOR_COLOR = "#1a1040";
const WALL_COLOR = "#3a2870";
const WALL_TOP = "#5540a0";
const GRID_COLOR = "#221550";
const MOVE_DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

function createBossProjectile(enemy, player) {
  const sourceX = enemy.x * GRID + GRID / 2;
  const sourceY = enemy.y * GRID + GRID / 2;
  const targetX = player.x * GRID + GRID / 2;
  const targetY = player.y * GRID + GRID / 2;
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const speed = enemy.projectileSpeed || 2.8;

  return {
    id: `${enemy.id}-${Date.now()}-${Math.random()}`,
    x: sourceX,
    y: sourceY,
    vx: (deltaX / distance) * speed,
    vy: (deltaY / distance) * speed,
    color: enemy.projectileColor || enemy.color || "#ff7a18",
    damage: enemy.projectileDamage || Math.max(1, enemy.atk - 1),
    life: Math.max(GRID * 6, (enemy.projectileRange || 8) * GRID),
  };
}

function drawBoss(ctx, enemy) {
  const ex = enemy.x * GRID + GRID / 2;
  const ey = enemy.y * GRID + GRID / 2;
  const auraColor = enemy.projectileColor || enemy.color || "#ff7a18";

  ctx.save();
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(ex, enemy.y * GRID + GRID - 1, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = auraColor;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(ex, ey, GRID * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = enemy.color || "#bb55ff";
  ctx.beginPath();
  ctx.arc(ex, ey + 1, GRID * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#180d2b";
  ctx.beginPath();
  ctx.arc(ex - 4, ey - 1, 2.1, 0, Math.PI * 2);
  ctx.arc(ex + 4, ey - 1, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.moveTo(ex - 8, ey - 7);
  ctx.lineTo(ex - 3, ey - 13);
  ctx.lineTo(ex, ey - 8);
  ctx.lineTo(ex + 3, ey - 13);
  ctx.lineTo(ex + 8, ey - 7);
  ctx.lineTo(ex + 5, ey - 3);
  ctx.lineTo(ex - 5, ey - 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(ex, ey + 6, 4, 0, Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawProjectile(ctx, projectile) {
  ctx.save();
  ctx.shadowColor = projectile.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = projectile.color;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(projectile.x - 1.3, projectile.y - 1.3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pickEnemyStep(enemy, state) {
  const { map, player, enemies } = state;
  const currentDistance = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  const candidates = MOVE_DIRECTIONS
    .map((direction) => ({
      ...direction,
      nx: enemy.x + direction.dx,
      ny: enemy.y + direction.dy,
    }))
    .filter(({ nx, ny }) => (
      !isWall(map, nx, ny)
      && !enemies.some((other) => other.id !== enemy.id && other.x === nx && other.y === ny)
      && !(nx === player.x && ny === player.y)
    ))
    .map((candidate) => ({
      ...candidate,
      dist: Math.abs(candidate.nx - player.x) + Math.abs(candidate.ny - player.y),
    }));

  if (candidates.length === 0) {
    return null;
  }

  const nearest = [...candidates].sort((a, b) => a.dist - b.dist)[0];
  const farthest = [...candidates].sort((a, b) => b.dist - a.dist)[0];
  const randomStep = candidates[Math.floor(Math.random() * candidates.length)];

  switch (enemy.behavior) {
    case "hunter":
      return nearest;
    case "skirmisher":
      if (currentDistance <= 2) {
        return farthest;
      }
      return currentDistance <= enemy.aggroRange ? nearest : randomStep;
    case "brute":
      if (currentDistance > enemy.aggroRange && Math.random() < 0.45) {
        return null;
      }
      return nearest;
    case "erratic":
      return Math.random() < 0.55 ? randomStep : nearest;
    case "wander":
    default:
      return currentDistance <= enemy.aggroRange ? nearest : randomStep;
  }
}

export default function RPGGame({
  initialState,
  onClearSave,
  onHome,
  onRestart,
  onRunComplete,
  onSaveState,
  profile,
}) {
  const {
    hapticImpact,
    hapticNotification,
    hapticSelection,
    isTelegram,
  } = useTelegramMiniApp();
  const canvasRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastMoveRef = useRef(0);
  const projectilesRef = useRef([]);
  const floatTimeoutsRef = useRef([]);
  const countdownIntervalRef = useRef(null);
  const runCompleteRef = useRef(false);

  const [uiState, setUiState] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [floats, setFloats] = useState([]);
  const [rewardSelectedId, setRewardSelectedId] = useState("");
  const [countdownValue, setCountdownValue] = useState(0);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ w: COLS * GRID, h: ROWS * GRID });

  const canvasSize = { w: COLS * GRID, h: ROWS * GRID };
  const currentPhase = stateRef.current?.phase || "playing";
  const isCountdownActive = countdownValue > 0;
  const effectivePhase = isCountdownActive ? "countdown" : currentPhase;
  const hasScreenOverlay = currentPhase === "reward" || currentPhase === "bossIntro";
  const canvasAspectRatio = canvasSize.w / canvasSize.h;

  const syncUI = useCallback((sourceState = stateRef.current) => {
    const currentState = sourceState;
    if (!currentState) {
      return;
    }

    setUiState({
      hp: currentState.player.hp,
      maxHp: currentState.player.maxHp,
      xp: currentState.player.xp,
      level: currentState.player.level,
      coins: currentState.player.coins,
      inventory: [...currentState.player.inventory],
      wave: currentState.wave,
      bossName: currentState.bossPreview?.name || currentState.enemies.find((enemy) => enemy.isBoss)?.name || "",
      bossSubtitle: currentState.bossPreview?.subtitle || "",
      xpNeeded: xpToNextLevel(currentState.player.level),
    });
  }, []);

  const persistState = useCallback((sourceState = stateRef.current) => {
    if (!sourceState) {
      return;
    }

    onSaveState?.(createSaveSnapshot(sourceState));
  }, [onSaveState]);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((seconds = 3) => {
    clearCountdown();
    setCountdownValue(seconds);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownValue((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  useEffect(() => {
    const nextState = createGameState(initialState, profile);
    stateRef.current = nextState;
    runCompleteRef.current = false;
    setGameOver(false);
    setIsPaused(false);
    setLevelUp(false);
    setFloats([]);
    setRewardSelectedId(nextState.rewardOptions[0]?.id || "");
    setCountdownValue(0);
    projectilesRef.current = [];
    syncUI(nextState);
    persistState(nextState);
    if (nextState.phase === "playing") {
      startCountdown(3);
    }
  }, [initialState, persistState, profile, startCountdown, syncUI]);

  function addFloat(text, color, x, y) {
    const id = Date.now() + Math.random();
    setFloats((currentFloats) => [...currentFloats, { id, text, color, x, y }]);
    const timeoutId = window.setTimeout(() => {
      setFloats((currentFloats) => currentFloats.filter((floatValue) => floatValue.id !== id));
    }, 1200);
    floatTimeoutsRef.current.push(timeoutId);
  }

  useEffect(() => () => {
    floatTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    floatTimeoutsRef.current = [];
  }, []);

  useEffect(() => () => {
    clearCountdown();
  }, [clearCountdown]);

  useEffect(() => {
    const viewportElement = canvasViewportRef.current;
    if (!viewportElement) {
      return undefined;
    }

    let frameId = 0;

    const updateCanvasDisplaySize = () => {
      frameId = 0;

      const nextWidth = viewportElement.clientWidth;
      const nextHeight = viewportElement.clientHeight;
      if (!nextWidth || !nextHeight) {
        return;
      }

      const fittedWidth = Math.min(nextWidth, nextHeight * canvasAspectRatio, canvasSize.w);
      const fittedHeight = fittedWidth / canvasAspectRatio;
      const roundedWidth = Math.max(1, Math.floor(fittedWidth));
      const roundedHeight = Math.max(1, Math.floor(fittedHeight));

      setCanvasDisplaySize((currentSize) => {
        if (currentSize.w === roundedWidth && currentSize.h === roundedHeight) {
          return currentSize;
        }

        return { w: roundedWidth, h: roundedHeight };
      });
    };

    const scheduleUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateCanvasDisplaySize);
      }
    };

    scheduleUpdate();

    const resizeObserver = new ResizeObserver(() => {
      scheduleUpdate();
    });
    resizeObserver.observe(viewportElement);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    return () => {
      resizeObserver.disconnect();
      visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [canvasAspectRatio, canvasSize.h, canvasSize.w, hasScreenOverlay]);

  const consumeHealingPotion = useCallback((sourceState, options = {}) => {
    const currentState = sourceState;
    if (!currentState) {
      return false;
    }

    const potion = currentState.player.inventory.find((item) => item.id === "potion");
    if (!potion || potion.count <= 0) {
      return false;
    }

    potion.count -= 1;
    currentState.player.hp = Math.min(currentState.player.hp + potion.heal, currentState.player.maxHp);
    addFloat(`+${potion.heal}❤️`, "#44ff88", currentState.player.x, currentState.player.y);

    if (isTelegram) {
      hapticNotification(options.auto ? "warning" : "success");
    }

    return true;
  }, [hapticNotification, isTelegram]);

  const shouldAutoHeal = useCallback((player) => {
    const potion = player.inventory.find((item) => item.id === "potion");
    if (!potion || potion.count <= 0) {
      return false;
    }

    return player.hp > 0 && player.hp <= Math.ceil(player.maxHp * 0.35);
  }, []);

  const movePlayer = useCallback((dir) => {
    const currentState = stateRef.current;
    if (!currentState || gameOver || isPaused || isCountdownActive || currentState.phase !== "playing") {
      return;
    }

    const now = performance.now();
    if (now - lastMoveRef.current < 130) {
      return;
    }

    lastMoveRef.current = now;

    const { player, map, enemies } = currentState;
    let nx = player.x;
    let ny = player.y;
    if (dir === "up") ny -= 1;
    if (dir === "down") ny += 1;
    if (dir === "left") nx -= 1;
    if (dir === "right") nx += 1;

    if (!isWall(map, nx, ny) && !enemies.some((enemy) => enemy.x === nx && enemy.y === ny)) {
      player.x = nx;
      player.y = ny;
      if (isTelegram) {
        hapticImpact("light");
      }
      persistState();
    }
    syncUI();
  }, [gameOver, hapticImpact, isCountdownActive, isPaused, isTelegram, persistState, syncUI]);

  const attack = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState || gameOver || isPaused || isCountdownActive || currentState.phase !== "playing") {
      return;
    }

    const { player, enemies } = currentState;
    const adjacent = enemies.filter((enemy) => Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y) <= 1);
    if (adjacent.length === 0) {
      return;
    }

    const target = adjacent[0];
    const dmg = player.atk + Math.floor(Math.random() * 3);
    target.hp -= dmg;
    addFloat(`-${dmg}`, "#ff4466", target.x, target.y);
    if (isTelegram) {
      hapticImpact(target.hp <= 0 ? "heavy" : "medium");
    }

    if (target.hp <= 0) {
      const goldEarned = getScaledCoinAmount(target.coinDrop, player);
      player.coins += goldEarned;
      const didLevelUp = awardExperience(player, target.xp);
      currentState.stats.enemiesDefeated += 1;
      if (target.isBoss) {
        currentState.stats.bossesDefeated += 1;
      }
      addFloat(`+${goldEarned}✦`, "#ffd700", target.x, target.y - 1);
      addFloat(`+${target.xp}XP`, "#88ffcc", target.x, target.y + 1);

      currentState.enemies = enemies.filter((enemy) => enemy.id !== target.id);

      if (didLevelUp) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 2000);
        if (isTelegram) {
          hapticNotification("success");
        }
        const potion = player.inventory.find((item) => item.id === "potion");
        if (potion) {
          potion.count += 1;
        }
      }

      if (currentState.enemies.length === 0) {
        currentState.phase = "reward";
        currentState.bossPreview = null;
        currentState.rewardOptions = generateRewardChoices(player, currentState.wave + 1);
        setRewardSelectedId(currentState.rewardOptions[0]?.id || "");
      }

      if (player.level >= MAX_LEVEL) {
        addFloat("MAX", "#60e0ff", player.x, player.y - 1);
      }
    }

    persistState();
    syncUI();
  }, [gameOver, hapticImpact, hapticNotification, isCountdownActive, isPaused, isTelegram, persistState, syncUI]);

  const useItem = useCallback((itemId) => {
    const currentState = stateRef.current;
    if (!currentState || gameOver || isPaused || isCountdownActive || currentState.phase !== "playing") {
      return;
    }

    if (itemId === "potion") {
      if (consumeHealingPotion(currentState)) {
        persistState();
        syncUI();
      }
      return;
    }

    const item = currentState.player.inventory.find((inventoryItem) => inventoryItem.id === itemId);
    if (!item || item.count <= 0) {
      return;
    }

    item.count -= 1;
    currentState.player.hp = Math.min(currentState.player.hp + item.heal, currentState.player.maxHp);
    addFloat(`+${item.heal}❤️`, "#44ff88", currentState.player.x, currentState.player.y);
    persistState();
    syncUI();
  }, [consumeHealingPotion, gameOver, isCountdownActive, isPaused, persistState, syncUI]);

  const chooseReward = useCallback((rewardId) => {
    setRewardSelectedId(rewardId);
    if (isTelegram) {
      hapticSelection();
    }
  }, [hapticSelection, isTelegram]);

  const claimReward = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState || currentState.phase !== "reward") {
      return;
    }

    const selectedReward = rewardSelectedId || currentState.rewardOptions[0]?.id;
    if (!selectedReward) {
      return;
    }

    const reward = applyRewardChoice(currentState.player, selectedReward, currentState.wave + 1);
    currentState.wave += 1;
    currentState.stats.rewardsClaimed += 1;
    currentState.rewardOptions = [];
    currentState.bossPreview = isBossWave(currentState.wave) ? createBossPreview(currentState.wave) : null;
    currentState.phase = currentState.bossPreview ? "bossIntro" : "playing";
    projectilesRef.current = [];
    currentState.enemies = currentState.phase === "bossIntro"
      ? []
      : spawnWaveEnemies(currentState.map, currentState.player, currentState.wave);
    setRewardSelectedId("");

    if (reward) {
      addFloat(`${reward.emoji} ${reward.title}`, "#f4e6a1", currentState.player.x, currentState.player.y - 1);
      if (isTelegram) {
        hapticNotification("success");
      }
    }

    persistState(currentState);
    syncUI(currentState);
    if (currentState.phase === "playing") {
      startCountdown(3);
    }
  }, [hapticNotification, isTelegram, persistState, rewardSelectedId, startCountdown, syncUI]);

  const startBossBattle = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState || currentState.phase !== "bossIntro") {
      return;
    }

    currentState.phase = "playing";
    currentState.bossPreview = null;
    projectilesRef.current = [];
    currentState.enemies = spawnWaveEnemies(currentState.map, currentState.player, currentState.wave);
    if (isTelegram) {
      hapticNotification("warning");
    }
    persistState(currentState);
    syncUI(currentState);
    startCountdown(3);
  }, [hapticNotification, isTelegram, persistState, startCountdown, syncUI]);

  const togglePause = useCallback(() => {
    if (gameOver || effectivePhase !== "playing") {
      return;
    }

    setIsPaused((currentValue) => {
      const nextValue = !currentValue;
      if (currentValue && !nextValue) {
        startCountdown(3);
      }
      return nextValue;
    });
  }, [effectivePhase, gameOver, startCountdown]);

  const handleHome = useCallback(() => {
    if (!gameOver) {
      persistState();
    }
    onHome?.();
  }, [gameOver, onHome, persistState]);

  useEffect(() => {
    const movementMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };

    const handler = (e) => {
      const normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (normalizedKey === "Escape" || normalizedKey === "p") {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused) {
        return;
      }

      if (movementMap[normalizedKey]) {
        e.preventDefault();
        movePlayer(movementMap[normalizedKey]);
      }
      if (normalizedKey === " " || normalizedKey === "z") {
        e.preventDefault();
        attack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attack, isPaused, movePlayer, togglePause]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    const render = () => {
      const currentState = stateRef.current;
      if (!currentState) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      if (!gameOver && !isPaused && !isCountdownActive && currentState.phase === "playing") {
        let didStateChange = false;
        let shouldPersistAfterProjectiles = false;

        currentState.enemies.forEach((enemy) => {
          enemy.moveTimer += 1;
          if (enemy.isBoss && enemy.projectileInterval) {
            enemy.projectileTimer = (enemy.projectileTimer || 0) + 1;
            const distanceToPlayer = Math.abs(enemy.x - currentState.player.x) + Math.abs(enemy.y - currentState.player.y);

            if (distanceToPlayer <= (enemy.projectileRange || 8) && enemy.projectileTimer >= enemy.projectileInterval) {
              enemy.projectileTimer = 0;
              projectilesRef.current.push(createBossProjectile(enemy, currentState.player));
            }
          }

          if (enemy.moveTimer >= enemy.moveInterval) {
            enemy.moveTimer = 0;
            const chosen = pickEnemyStep(enemy, currentState);
            if (chosen) {
              enemy.x = chosen.nx;
              enemy.y = chosen.ny;
              didStateChange = true;
            }

            if (Math.abs(enemy.x - currentState.player.x) + Math.abs(enemy.y - currentState.player.y) === 1) {
              const dmg = enemy.atk + Math.floor(Math.random() * 2);
              currentState.player.hp -= dmg;
              addFloat(`-${dmg}`, "#ff8844", currentState.player.x, currentState.player.y);
              if (isTelegram) {
                hapticImpact(currentState.player.hp <= 0 ? "heavy" : "medium");
              }

              if (shouldAutoHeal(currentState.player)) {
                consumeHealingPotion(currentState, { auto: true });
              }

              didStateChange = true;

              if (currentState.player.hp <= 0) {
                currentState.player.hp = 0;
                if (!runCompleteRef.current) {
                  runCompleteRef.current = true;
                  onRunComplete?.(createSaveSnapshot(currentState));
                }
                setGameOver(true);
                onClearSave?.();
              }
            }
          }
        });

        if (projectilesRef.current.length > 0) {
          const playerCenterX = currentState.player.x * GRID + GRID / 2;
          const playerCenterY = currentState.player.y * GRID + GRID / 2;

          projectilesRef.current = projectilesRef.current.filter((projectile) => {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
            projectile.life -= Math.hypot(projectile.vx, projectile.vy);

            const tileX = Math.floor(projectile.x / GRID);
            const tileY = Math.floor(projectile.y / GRID);
            if (projectile.life <= 0 || isWall(currentState.map, tileX, tileY)) {
              return false;
            }

            const playerDistance = Math.hypot(projectile.x - playerCenterX, projectile.y - playerCenterY);
            if (playerDistance <= GRID * 0.33) {
              currentState.player.hp -= projectile.damage;
              addFloat(`-${projectile.damage}`, projectile.color, currentState.player.x, currentState.player.y - 0.35);
              if (isTelegram) {
                hapticImpact(currentState.player.hp <= 0 ? "heavy" : "medium");
              }

              if (shouldAutoHeal(currentState.player)) {
                consumeHealingPotion(currentState, { auto: true });
              }

              didStateChange = true;
              shouldPersistAfterProjectiles = true;

              if (currentState.player.hp <= 0) {
                currentState.player.hp = 0;
                if (!runCompleteRef.current) {
                  runCompleteRef.current = true;
                  onRunComplete?.(createSaveSnapshot(currentState));
                }
                setGameOver(true);
                onClearSave?.();
              }

              return false;
            }

            return true;
          });
        }

        if (didStateChange) {
          syncUI();
          if (currentState.player.hp > 0 || shouldPersistAfterProjectiles) {
            persistState(currentState);
          }
        }
      }

      ctx.fillStyle = FLOOR_COLOR;
      ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const x = c * GRID;
          const y = r * GRID;
          if (currentState.map[r][c] === TILE.WALL) {
            ctx.fillStyle = WALL_COLOR;
            ctx.fillRect(x, y, GRID, GRID);
            ctx.fillStyle = WALL_TOP;
            ctx.fillRect(x, y, GRID, 4);
          } else {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 0.4;
            ctx.strokeRect(x, y, GRID, GRID);
          }
        }
      }

      currentState.enemies.forEach((enemy) => {
        const ex = enemy.x * GRID + GRID / 2;
        const ey = enemy.y * GRID + GRID / 2;
        if (enemy.isBoss) {
          drawBoss(ctx, enemy);
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(ex, enemy.y * GRID + GRID - 2, 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = `${GRID - 4}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(enemy.emoji, ex, ey);
        }
        const bw = GRID - 2;
        const bh = 3;
        const bx = enemy.x * GRID + 1;
        const by = enemy.y * GRID - 5;
        ctx.fillStyle = "#333";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? "#44ff88" : enemy.hp / enemy.maxHp > 0.25 ? "#ffcc00" : "#ff4444";
        ctx.fillRect(bx, by, Math.max(0, bw * (enemy.hp / enemy.maxHp)), bh);
      });

      projectilesRef.current.forEach((projectile) => {
        drawProjectile(ctx, projectile);
      });

      const px = currentState.player.x * GRID + GRID / 2;
      const py = currentState.player.y * GRID + GRID / 2;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(px, currentState.player.y * GRID + GRID - 2, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "#60e0ff";
      ctx.shadowBlur = 10;
      ctx.font = `${GRID - 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🧙", px, py);
      ctx.shadowBlur = 0;

      if (isCountdownActive && !gameOver) {
        ctx.fillStyle = "rgba(10, 8, 25, 0.72)";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
        ctx.fillStyle = "#f4e6a1";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText(String(countdownValue), canvasSize.w / 2, canvasSize.h / 2 - 10);
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("Підготуйтеся до бою", canvasSize.w / 2, canvasSize.h / 2 + 24);
      } else if (isPaused && !gameOver) {
        ctx.fillStyle = "rgba(10, 8, 25, 0.62)";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
        ctx.fillStyle = "#f4e6a1";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("Пауза", canvasSize.w / 2, canvasSize.h / 2);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [canvasSize.h, canvasSize.w, consumeHealingPotion, gameOver, hapticImpact, isCountdownActive, isPaused, isTelegram, onClearSave, onRunComplete, persistState, shouldAutoHeal, syncUI]);

  return (
    <div className="flex h-full min-h-0 w-full max-w-[560px] flex-col gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
      {uiState && (
        <GameUI
          {...uiState}
          gameOver={gameOver}
          isPaused={isPaused}
          levelUp={levelUp}
          phase={effectivePhase}
          onAttack={attack}
          onTogglePause={togglePause}
          onUseItem={useItem}
          onRestart={onRestart}
          onHome={handleHome}
        />
      )}

      <div className="w-full flex-1 min-h-0 rounded-2xl border border-border bg-card/40 p-2 shadow-xl shadow-black/20 sm:p-3">
        <div ref={canvasViewportRef} className="flex h-full min-h-0 items-center justify-center">
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              width: `${canvasDisplaySize.w}px`,
              height: `${canvasDisplaySize.h}px`,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              className="block h-full w-full rounded-xl border-2 border-border bg-[#140b34] touch-none"
              style={{ imageRendering: "pixelated" }}
            />
            {floats.map((floatValue) => (
              <div
                key={floatValue.id}
                className="absolute pointer-events-none animate-float font-pixel text-[10px]"
                style={{
                  left: `${((floatValue.x + 0.5) / COLS) * 100}%`,
                  top: `${((floatValue.y + 0.35) / ROWS) * 100}%`,
                  color: floatValue.color,
                  textShadow: "0 1px 4px #000",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                {floatValue.text}
              </div>
            ))}

            {currentPhase === "reward" && stateRef.current?.rewardOptions?.length > 0 && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(10,8,25,0.86)] p-3 backdrop-blur-[2px] sm:p-4">
                <div className="max-h-full w-full max-w-[380px] overflow-y-auto rounded-[24px] border border-primary/30 bg-[linear-gradient(180deg,rgba(63,45,19,0.96),rgba(28,20,52,0.96))] p-3 shadow-2xl shadow-black/50 sm:p-4">
                  <div className="mb-3 text-center">
                    <p className="font-pixel text-xs text-primary drop-shadow-[0_0_10px_rgba(255,208,74,0.35)]">НАГОРОДА ЗА ХВИЛЮ</p>
                    <p className="mt-2 font-pixel text-[10px] leading-5 text-muted-foreground">
                      Оберіть бонус перед хвилею {uiState ? uiState.wave + 1 : 2}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {stateRef.current.rewardOptions.map((reward) => {
                      const isSelected = rewardSelectedId === reward.id;
                      return (
                        <button
                          key={reward.id}
                          onClick={() => chooseReward(reward.id)}
                          className={`rounded-xl border px-3 py-3 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/18 shadow-md shadow-primary/20"
                              : "border-border bg-background/35 hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{reward.emoji}</span>
                            <span className="font-pixel text-[10px] text-foreground sm:text-xs">{reward.title}</span>
                          </div>
                          <p className="mt-3 font-pixel text-[10px] leading-5 text-muted-foreground">
                            {reward.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 space-y-3">
                    <p className="text-center font-pixel text-[10px] leading-5 text-muted-foreground">
                      Виберіть нагороду і натисніть кнопку нижче.
                    </p>
                    <button
                      onClick={claimReward}
                      disabled={!rewardSelectedId}
                      className="w-full rounded-xl bg-primary px-4 py-3 font-pixel text-[10px] text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                    >
                      ЗАБРАТИ НАГОРОДУ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentPhase === "bossIntro" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(10,8,25,0.86)] p-4 backdrop-blur-[2px]">
                <div className="w-full max-w-[360px] rounded-[24px] border border-destructive/30 bg-[linear-gradient(180deg,rgba(66,18,18,0.96),rgba(28,20,52,0.96))] p-4 text-center shadow-2xl shadow-black/50">
                  <p className="font-pixel text-xs text-destructive">БИТВА З БОСОМ</p>
                  <p className="mt-3 font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs">
                    Хвиля {uiState?.wave}. {uiState?.bossName || "Попереду сильний ворог"}.
                  </p>
                  <p className="mt-2 font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs">
                    {uiState?.bossSubtitle || "У боса підвищені HP, урон і нагорода."}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3 text-2xl">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(0,0,0,0)_55%),linear-gradient(180deg,rgba(255,122,24,0.35),rgba(96,18,18,0.72))] shadow-[0_0_24px_rgba(255,122,24,0.32)]"
                      style={{ color: stateRef.current?.bossPreview?.projectileColor || stateRef.current?.bossPreview?.color || "#ff7a18" }}
                    >
                      <span className="text-3xl">♛</span>
                    </span>
                    <span>⚔️</span>
                    <span>🧙</span>
                  </div>
                  <button
                    onClick={startBossBattle}
                    className="mt-4 w-full rounded-xl bg-destructive px-5 py-3 font-pixel text-[10px] text-destructive-foreground transition-all hover:opacity-90 active:scale-95 sm:text-xs"
                  >
                    РОЗПОЧАТИ БІЙ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileRPGControls
        disabled={gameOver || isPaused || effectivePhase !== "playing"}
        hidden={hasScreenOverlay || gameOver}
        healingItem={uiState?.inventory?.find((item) => item.id === "potion") || null}
        onMove={movePlayer}
        onAttack={attack}
        onUseHeal={() => useItem("potion")}
      />

      <p className={`px-2 text-center font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs ${hasScreenOverlay ? "opacity-0 pointer-events-none" : ""}`}>
        Стрілки/WASD = рух · Пробіл/Z = удар · Esc/P = пауза
      </p>
    </div>
  );
}

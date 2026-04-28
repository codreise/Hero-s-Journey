import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  applyRewardChoice,
  awardExperience,
  COLS,
  createBossPreview,
  createGameState,
  createSaveSnapshot,
  generateRewardChoices,
  getRunEssenceReward,
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
const EMOJI_FONT_STACK = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const MOBILE_AUTO_ATTACK_DELAY_MS = 35;
const emojiSpriteCache = new Map();
const MOVE_DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

function interpolatePosition(currentValue, targetValue, smoothing = 0.24) {
  if (Math.abs(targetValue - currentValue) < 0.001) {
    return targetValue;
  }

  return currentValue + (targetValue - currentValue) * smoothing;
}

function createSpriteFromSvg(key, svg) {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  emojiSpriteCache.set(key, image);
  return image;
}

function getEmojiSprite(emoji) {
  if (!emoji) {
    return null;
  }

  if (emojiSpriteCache.has(emoji)) {
    return emojiSpriteCache.get(emoji);
  }

  if (emoji === "🐀") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M47 36 C56 39, 60 45, 55 51" fill="none" stroke="#f59eaf" stroke-width="3.2" stroke-linecap="round"/>
        <ellipse cx="31" cy="35" rx="16" ry="10.5" fill="#9ca3af" filter="url(#glow)"/>
        <ellipse cx="20" cy="31" rx="8.5" ry="7" fill="#9ca3af"/>
        <circle cx="17" cy="24" r="3.5" fill="#cbd5e1"/>
        <circle cx="24" cy="23" r="3" fill="#cbd5e1"/>
        <circle cx="18.5" cy="31" r="1.5" fill="#111827"/>
        <circle cx="12.5" cy="34" r="1.8" fill="#fda4af"/>
      </svg>
    `);
  }

  if (emoji === "☠️") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="28" r="15" fill="#f3f4f6"/>
        <rect x="22" y="39" width="20" height="11" rx="4" fill="#f3f4f6"/>
        <circle cx="26" cy="28" r="4.2" fill="#111827"/>
        <circle cx="38" cy="28" r="4.2" fill="#111827"/>
        <path d="M32 30 L28.5 36 H35.5 Z" fill="#4b5563"/>
        <path d="M22 44 H42" stroke="#9ca3af" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M26 44 V49 M32 44 V50 M38 44 V49" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }

  if (emoji === "🐺") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <path d="M18 42 L16 24 L26 18 L32 22 L39 18 L48 24 L46 42 Z" fill="#64748b"/>
        <path d="M22 18 L27 8 L31 20 Z M42 18 L37 8 L33 20 Z" fill="#94a3b8"/>
        <circle cx="27" cy="31" r="2.2" fill="#111827"/>
        <circle cx="37" cy="31" r="2.2" fill="#111827"/>
        <path d="M32 34 L28 39 H36 Z" fill="#1f2937"/>
        <path d="M28 40 Q32 44 36 40" stroke="#cbd5e1" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `);
  }

  if (emoji === "🧙") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <path d="M32 10 L46 27 H36 L43 48 H21 L28 27 H18 Z" fill="#22c55e"/>
        <circle cx="32" cy="28" r="8.5" fill="#f5d0a9"/>
        <path d="M24 24 Q32 17 40 24" stroke="#166534" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="29" cy="29" r="1.7" fill="#111827"/>
        <circle cx="35" cy="29" r="1.7" fill="#111827"/>
        <circle cx="46" cy="18" r="4" fill="#86efac" opacity="0.9"/>
      </svg>
    `);
  }

  if (emoji === "🗿") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect x="18" y="12" width="28" height="40" rx="8" fill="#a16207"/>
        <rect x="22" y="18" width="20" height="26" rx="6" fill="#ca8a04"/>
        <path d="M26 27 H30 M34 27 H38" stroke="#451a03" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M32 28 V38" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
        <path d="M26 42 Q32 45 38 42" stroke="#451a03" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </svg>
    `);
  }

  if (emoji === "🦇") {
    return createSpriteFromSvg(emoji, `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <path d="M10 34 Q18 20 28 28 Q32 16 36 28 Q46 20 54 34 Q45 32 40 40 Q36 34 32 42 Q28 34 24 40 Q18 32 10 34 Z" fill="#a855f7"/>
        <circle cx="32" cy="31" r="5" fill="#7e22ce"/>
        <circle cx="29.5" cy="31" r="1.2" fill="#f8fafc"/>
        <circle cx="34.5" cy="31" r="1.2" fill="#f8fafc"/>
      </svg>
    `);
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="48" font-family=${JSON.stringify(EMOJI_FONT_STACK)}>
        ${emoji}
      </text>
    </svg>
  `;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  emojiSpriteCache.set(emoji, image);
  return image;
}

function getEnemyRenderStyle(enemy) {
  const glowColor = enemy.color || "#ffffff";

  switch (enemy.archetypeId) {
    case "rat":
      return { glowColor, shadowBlur: 7, auraFill: "rgba(148, 163, 184, 0.08)", outlineColor: "rgba(226, 232, 240, 0.24)", radius: 8, fontSize: GRID - 7, emojiOffsetY: 0.5 };
    case "skeleton":
      return { glowColor, shadowBlur: 10, auraFill: "rgba(229, 231, 235, 0.14)", outlineColor: "rgba(255, 255, 255, 0.52)", radius: 9, fontSize: GRID - 5, emojiOffsetY: 0 };
    case "wolf":
      return { glowColor, shadowBlur: 12, auraFill: "rgba(100, 116, 139, 0.14)", outlineColor: "rgba(191, 219, 254, 0.4)", radius: 9, fontSize: GRID - 4, emojiOffsetY: 0.5 };
    case "shaman":
      return { glowColor, shadowBlur: 14, auraFill: "rgba(34, 197, 94, 0.16)", outlineColor: "rgba(187, 247, 208, 0.46)", radius: 9, fontSize: GRID - 5, emojiOffsetY: -0.5 };
    case "brute":
      return { glowColor, shadowBlur: 9, auraFill: "rgba(161, 98, 7, 0.18)", outlineColor: "rgba(253, 224, 71, 0.4)", radius: 10, fontSize: GRID - 3, emojiOffsetY: 0 };
    case "bat":
      return { glowColor, shadowBlur: 13, auraFill: "rgba(168, 85, 247, 0.15)", outlineColor: "rgba(233, 213, 255, 0.42)", radius: 8.5, fontSize: GRID - 6, emojiOffsetY: -0.5 };
    default:
      return { glowColor, shadowBlur: 9, auraFill: "rgba(255, 255, 255, 0.12)", outlineColor: "rgba(255, 255, 255, 0.32)", radius: 8.5, fontSize: GRID - 5, emojiOffsetY: 0 };
  }
}

function getBossShotPlan(enemy, player) {
  const deltaX = player.x - enemy.x;
  const deltaY = player.y - enemy.y;
  const useHorizontalAxis = Math.abs(deltaX) >= Math.abs(deltaY);

  return {
    axis: useHorizontalAxis ? "horizontal" : "vertical",
    direction: useHorizontalAxis ? Math.sign(deltaX || 1) : Math.sign(deltaY || 1),
  };
}

function createBossProjectile(enemy, player, shotPlan = null) {
  const sourceX = enemy.x * GRID + GRID / 2;
  const sourceY = enemy.y * GRID + GRID / 2;
  const resolvedShotPlan = shotPlan || getBossShotPlan(enemy, player);
  const axisSpeed = enemy.projectileSpeed || 2.8;
  const deltaX = resolvedShotPlan.axis === "horizontal" ? resolvedShotPlan.direction * axisSpeed : 0;
  const deltaY = resolvedShotPlan.axis === "vertical" ? resolvedShotPlan.direction * axisSpeed : 0;
  const distance = Math.hypot(deltaX, deltaY) || 1;

  return {
    id: `${enemy.id}-${Date.now()}-${Math.random()}`,
    x: sourceX,
    y: sourceY,
    vx: deltaX / distance * axisSpeed,
    vy: deltaY / distance * axisSpeed,
    color: enemy.projectileColor || enemy.color || "#ff7a18",
    damage: enemy.projectileDamage || Math.max(1, enemy.atk - 1),
    life: Math.max(GRID * 6, (enemy.projectileRange || 8) * GRID),
  };
}

function drawBossTelegraph(ctx, enemy, map, renderX = enemy.x, renderY = enemy.y) {
  const shotPlan = enemy.projectileCharge;
  if (!shotPlan) {
    return;
  }

  const startX = renderX * GRID + GRID / 2;
  const startY = renderY * GRID + GRID / 2;
  let endX = startX;
  let endY = startY;

  if (shotPlan.axis === "horizontal") {
    let nextX = enemy.x;
    while (!isWall(map, nextX + shotPlan.direction, enemy.y)) {
      nextX += shotPlan.direction;
    }
    endX = nextX * GRID + GRID / 2;
  } else {
    let nextY = enemy.y;
    while (!isWall(map, enemy.x, nextY + shotPlan.direction)) {
      nextY += shotPlan.direction;
    }
    endY = nextY * GRID + GRID / 2;
  }

  const pulse = 0.45 + ((shotPlan.framesLeft % 10) / 18);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 140, 60, ${pulse})`;
  ctx.lineWidth = 5;
  ctx.shadowColor = enemy.projectileColor || enemy.color || "#ff7a18";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

function drawBoss(ctx, enemy, renderX = enemy.x, renderY = enemy.y) {
  const ex = renderX * GRID + GRID / 2;
  const ey = renderY * GRID + GRID / 2;
  const auraColor = enemy.projectileColor || enemy.color || "#ff7a18";
  const bossColor = enemy.color || "#bb55ff";

  ctx.save();
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(ex, renderY * GRID + GRID - 1, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = auraColor;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(ex, ey, GRID * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = bossColor;
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

  if (enemy.bossId === "ogre_chief") {
    ctx.fillStyle = bossColor;
    ctx.beginPath();
    ctx.moveTo(ex - 10, ey - 6);
    ctx.lineTo(ex - 15, ey - 14);
    ctx.lineTo(ex - 7, ey - 10);
    ctx.closePath();
    ctx.moveTo(ex + 10, ey - 6);
    ctx.lineTo(ex + 15, ey - 14);
    ctx.lineTo(ex + 7, ey - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.roundRect(ex - 5, ey + 4, 10, 6, 2);
    ctx.fill();
  } else if (enemy.bossId === "wyrm") {
    ctx.strokeStyle = bossColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ex - 11, ey + 5);
    ctx.quadraticCurveTo(ex - 2, ey + 12, ex + 8, ey + 8);
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(ex - 4, ey - 1, 1.1, 0, Math.PI * 2);
    ctx.arc(ex + 4, ey - 1, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.bossId === "lich") {
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.beginPath();
    ctx.moveTo(ex - 9, ey - 6);
    ctx.lineTo(ex - 6, ey - 14);
    ctx.lineTo(ex - 1, ey - 8);
    ctx.lineTo(ex + 2, ey - 15);
    ctx.lineTo(ex + 6, ey - 8);
    ctx.lineTo(ex + 10, ey - 13);
    ctx.lineTo(ex + 9, ey - 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 8, ey + 4);
    ctx.lineTo(ex - 4, ey + 11);
    ctx.moveTo(ex, ey + 5);
    ctx.lineTo(ex, ey + 12);
    ctx.moveTo(ex + 8, ey + 4);
    ctx.lineTo(ex + 4, ey + 11);
    ctx.stroke();
  } else {
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(ex, ey + 6, 4, 0, Math.PI);
    ctx.fill();
  }
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

function buildMapLayer(map) {
  if (typeof document === "undefined") {
    return null;
  }

  const layer = document.createElement("canvas");
  layer.width = COLS * GRID;
  layer.height = ROWS * GRID;
  const ctx = layer.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, 0, layer.width, layer.height);

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const x = c * GRID;
      const y = r * GRID;
      if (map[r][c] === TILE.WALL) {
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

  return layer;
}

function getEnemyMoveCandidates(enemy, state) {
  const { map, player, enemies } = state;
  return MOVE_DIRECTIONS
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
}

function findPathStepToPlayer(enemy, state, candidates) {
  const { map, player, enemies } = state;
  if (candidates.length === 0) {
    return null;
  }

  const occupiedTiles = new Set(
    enemies
      .filter((other) => other.id !== enemy.id)
      .map((other) => `${other.x}:${other.y}`)
  );

  const goalTiles = new Set(
    MOVE_DIRECTIONS
      .map((direction) => ({
        x: player.x + direction.dx,
        y: player.y + direction.dy,
      }))
      .filter(({ x, y }) => !isWall(map, x, y) && !occupiedTiles.has(`${x}:${y}`))
      .map(({ x, y }) => `${x}:${y}`)
  );

  if (goalTiles.size === 0) {
    return null;
  }

  const startKey = `${enemy.x}:${enemy.y}`;
  const queue = [{ x: enemy.x, y: enemy.y }];
  const visited = new Set([startKey]);
  const parents = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.x}:${current.y}`;

    if (currentKey !== startKey && goalTiles.has(currentKey)) {
      let walkKey = currentKey;
      while (parents.get(walkKey) && parents.get(walkKey) !== startKey) {
        walkKey = parents.get(walkKey);
      }

      const [targetX, targetY] = walkKey.split(":").map(Number);
      return candidates.find((candidate) => candidate.nx === targetX && candidate.ny === targetY) || null;
    }

    const sortedDirections = [...MOVE_DIRECTIONS].sort((left, right) => {
      const leftDistance = Math.abs(current.x + left.dx - player.x) + Math.abs(current.y + left.dy - player.y);
      const rightDistance = Math.abs(current.x + right.dx - player.x) + Math.abs(current.y + right.dy - player.y);
      return leftDistance - rightDistance;
    });

    sortedDirections.forEach((direction) => {
      const nextX = current.x + direction.dx;
      const nextY = current.y + direction.dy;
      const nextKey = `${nextX}:${nextY}`;

      if (visited.has(nextKey) || isWall(map, nextX, nextY) || occupiedTiles.has(nextKey) || (nextX === player.x && nextY === player.y)) {
        return;
      }

      visited.add(nextKey);
      parents.set(nextKey, currentKey);
      queue.push({ x: nextX, y: nextY });
    });
  }

  return null;
}

function pickScoredCandidate(candidates, getScore) {
  return [...candidates].sort((left, right) => getScore(right) - getScore(left))[0] || null;
}

function countNearbyAllies(enemy, state, x, y, radius = 2) {
  return state.enemies.filter((other) => (
    other.id !== enemy.id
    && !other.isBoss
    && other.archetypeId === enemy.archetypeId
    && Math.abs(other.x - x) + Math.abs(other.y - y) <= radius
  )).length;
}

function pickPackStep(enemy, state, candidates, pathStep, nearest, randomStep, currentDistance) {
  const localAllies = countNearbyAllies(enemy, state, enemy.x, enemy.y, 3);
  if (currentDistance > enemy.aggroRange + 2 && localAllies === 0) {
    return Math.random() < 0.45 ? randomStep : nearest;
  }

  return pickScoredCandidate(candidates, (candidate) => {
    const support = countNearbyAllies(enemy, state, candidate.nx, candidate.ny, 3);
    const closesGap = currentDistance - candidate.dist;
    const attackPressure = candidate.dist === 1 ? 5 : 0;
    const pathBonus = pathStep && candidate.nx === pathStep.nx && candidate.ny === pathStep.ny ? 3 : 0;

    return support * 7 + closesGap * 6 - candidate.dist * 2 + attackPressure + pathBonus;
  }) || pathStep || nearest;
}

function pickFlankerStep(enemy, state, candidates, pathStep, nearest, randomStep, currentDistance) {
  const { player } = state;
  if (currentDistance <= 2) {
    return nearest;
  }

  if (currentDistance > enemy.aggroRange + 1 && Math.random() < 0.35) {
    return randomStep;
  }

  return pickScoredCandidate(candidates, (candidate) => {
    const xGap = Math.abs(candidate.nx - player.x);
    const yGap = Math.abs(candidate.ny - player.y);
    const sideAngle = candidate.nx !== player.x && candidate.ny !== player.y ? 7 : 0;
    const balancedAngle = -Math.abs(xGap - yGap) * 3;
    const closesGap = Math.max(-1, currentDistance - candidate.dist) * 4;
    const strikeSetup = candidate.dist <= 2 ? 5 : 0;
    const directPathPenalty = pathStep && candidate.nx === pathStep.nx && candidate.ny === pathStep.ny ? -2 : 0;

    return sideAngle + balancedAngle + closesGap + strikeSetup + directPathPenalty - candidate.dist;
  }) || pathStep || nearest;
}

function pickTacticianStep(enemy, candidates, pathStep, nearest, farthest, randomStep, currentDistance) {
  const preferredMin = 3;
  const preferredMax = 4;

  if (currentDistance <= 2) {
    return Math.random() < 0.85 ? farthest : nearest;
  }

  if (currentDistance > preferredMax) {
    return currentDistance <= enemy.aggroRange + 2 ? (pathStep || nearest) : randomStep;
  }

  if (Math.random() < 0.22) {
    return nearest;
  }

  return pickScoredCandidate(candidates, (candidate) => {
    const preferredDistance = candidate.dist >= preferredMin && candidate.dist <= preferredMax ? 8 : 0;
    const distancePenalty = Math.abs(candidate.dist - preferredMax) * 4;
    const avoidMelee = candidate.dist === 1 ? -8 : 0;

    return preferredDistance - distancePenalty + avoidMelee;
  }) || randomStep;
}

function pickEnemyStep(enemy, state) {
  const { player } = state;
  const currentDistance = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  const candidates = getEnemyMoveCandidates(enemy, state);

  if (candidates.length === 0) {
    return null;
  }

  const pathStep = findPathStepToPlayer(enemy, state, candidates);
  const nearest = [...candidates].sort((a, b) => a.dist - b.dist)[0];
  const farthest = [...candidates].sort((a, b) => b.dist - a.dist)[0];
  const randomStep = candidates[Math.floor(Math.random() * candidates.length)];

  switch (enemy.behavior) {
    case "pack":
      return pickPackStep(enemy, state, candidates, pathStep, nearest, randomStep, currentDistance);
    case "flanker":
      return pickFlankerStep(enemy, state, candidates, pathStep, nearest, randomStep, currentDistance);
    case "tactician":
      return pickTacticianStep(enemy, candidates, pathStep, nearest, farthest, randomStep, currentDistance);
    case "hunter":
      return pathStep || nearest;
    case "skirmisher":
      if (currentDistance <= 2) {
        return farthest;
      }
      return currentDistance <= enemy.aggroRange + 1 ? (pathStep || nearest) : randomStep;
    case "brute":
      if (currentDistance > enemy.aggroRange + 2 && Math.random() < 0.25) {
        return null;
      }
      return pathStep || nearest;
    case "erratic":
      if (currentDistance <= enemy.aggroRange) {
        return Math.random() < 0.25 ? randomStep : (pathStep || nearest);
      }
      return randomStep;
    case "wander":
    default:
      if (currentDistance <= enemy.aggroRange + 1) {
        return pathStep || nearest;
      }
      return Math.random() < 0.35 ? nearest : randomStep;
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
  const countdownValueRef = useRef(0);
  const renderPositionsRef = useRef({ player: { x: 2, y: 2 }, enemies: new Map() });
  const mapLayerRef = useRef(null);
  const screenShakeRef = useRef({ intensity: 0, expiresAt: 0 });
  const attackCooldownUntilRef = useRef(0);
  const mobileAutoAttackTimeoutRef = useRef(null);
  const damageCooldownUntilRef = useRef(0);
  const playerFlashUntilRef = useRef(0);
  const attackPulseRef = useRef(null);
  const floatTimeoutsRef = useRef([]);
  const countdownIntervalRef = useRef(null);
  const runCompleteRef = useRef(false);

  const [runProfile] = useState(profile);
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

    const bossEnemy = currentState.enemies.find((enemy) => enemy.isBoss) || null;

    setUiState({
      hp: currentState.player.hp,
      maxHp: currentState.player.maxHp,
      xp: currentState.player.xp,
      level: currentState.player.level,
      attack: currentState.player.atk,
      coins: currentState.player.coins,
      inventory: [...currentState.player.inventory],
      wave: currentState.wave,
      enemiesLeft: currentState.enemies.length,
      bossName: currentState.bossPreview?.name || bossEnemy?.name || "",
      bossSubtitle: currentState.bossPreview?.subtitle || "",
      bossHp: bossEnemy?.hp || 0,
      bossMaxHp: bossEnemy?.maxHp || 0,
      stats: { ...currentState.stats },
      essenceReward: getRunEssenceReward(currentState),
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
    countdownValueRef.current = seconds;
    setCountdownValue(seconds);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownValue((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          countdownValueRef.current = 0;
          return 0;
        }

        const nextValue = currentValue - 1;
        countdownValueRef.current = nextValue;
        return nextValue;
      });
    }, 1000);
  }, [clearCountdown]);

  useEffect(() => {
    const nextState = createGameState(initialState, runProfile);
    stateRef.current = nextState;
    runCompleteRef.current = false;
    setGameOver(false);
    setIsPaused(false);
    setLevelUp(false);
    setFloats([]);
    setRewardSelectedId(nextState.rewardOptions[0]?.id || "");
    countdownValueRef.current = 0;
    attackCooldownUntilRef.current = 0;
    if (mobileAutoAttackTimeoutRef.current) {
      window.clearTimeout(mobileAutoAttackTimeoutRef.current);
      mobileAutoAttackTimeoutRef.current = null;
    }
    damageCooldownUntilRef.current = 0;
    playerFlashUntilRef.current = 0;
    attackPulseRef.current = null;
    screenShakeRef.current = { intensity: 0, expiresAt: 0 };
    renderPositionsRef.current = {
      player: { x: nextState.player.x, y: nextState.player.y },
      enemies: new Map(nextState.enemies.map((enemy) => [enemy.id, { x: enemy.x, y: enemy.y }])),
    };
    mapLayerRef.current = buildMapLayer(nextState.map);
    setCountdownValue(0);
    projectilesRef.current = [];
    syncUI(nextState);
    persistState(nextState);
    if (nextState.phase === "playing") {
      startCountdown(3);
    }
  }, [initialState, persistState, runProfile, startCountdown, syncUI]);

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
    countdownValueRef.current = 0;
    attackPulseRef.current = null;
    if (mobileAutoAttackTimeoutRef.current) {
      window.clearTimeout(mobileAutoAttackTimeoutRef.current);
      mobileAutoAttackTimeoutRef.current = null;
    }
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

      const fittedWidth = Math.min(nextWidth, nextHeight * canvasAspectRatio);
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

  const triggerScreenShake = useCallback((intensity = 4, duration = 110) => {
    screenShakeRef.current = {
      intensity,
      expiresAt: performance.now() + duration,
    };
  }, []);

  const applyDamageToPlayer = useCallback((currentState, damage, color, yOffset = 0) => {
    const now = performance.now();
    if (now < damageCooldownUntilRef.current) {
      return false;
    }

    currentState.player.hp -= damage;
    damageCooldownUntilRef.current = now + 480;
    playerFlashUntilRef.current = now + 220;
    triggerScreenShake(Math.min(8, 3 + damage * 0.35), 120);
    addFloat(`-${damage}`, color, currentState.player.x, currentState.player.y + yOffset);

    if (isTelegram) {
      hapticImpact(currentState.player.hp <= 0 ? "heavy" : "medium");
    }

    if (shouldAutoHeal(currentState.player)) {
      consumeHealingPotion(currentState, { auto: true });
    }

    if (currentState.player.hp <= 0) {
      currentState.player.hp = 0;
      if (!runCompleteRef.current) {
        runCompleteRef.current = true;
        onRunComplete?.(createSaveSnapshot(currentState));
      }
      setGameOver(true);
      onClearSave?.();
    }

    return true;
  }, [consumeHealingPotion, hapticImpact, isTelegram, onClearSave, onRunComplete, shouldAutoHeal, triggerScreenShake]);

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
      return false;
    }

    const now = performance.now();
    if (now < attackCooldownUntilRef.current) {
      return false;
    }

    const { player, enemies } = currentState;
    const adjacent = enemies.filter((enemy) => Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y) <= 1);
    if (adjacent.length === 0) {
      return false;
    }

    attackCooldownUntilRef.current = now + 220;

    const target = adjacent.sort((left, right) => {
      if (left.isBoss !== right.isBoss) {
        return Number(right.isBoss) - Number(left.isBoss);
      }
      return left.hp - right.hp;
    })[0];
    const isCritical = Math.random() < 0.18;
    const dmg = player.atk + Math.floor(Math.random() * 3) + (isCritical ? 2 : 0);
    target.hp -= dmg;
    attackPulseRef.current = {
      x: target.x,
      y: target.y,
      critical: isCritical,
      defeated: target.hp <= 0,
      expiresAt: now + 140,
    };
    triggerScreenShake(isCritical ? 5 : 3, isCritical ? 110 : 80);
    addFloat(isCritical ? `КРИТ -${dmg}` : `-${dmg}`, isCritical ? "#ffd166" : "#ff4466", target.x, target.y);
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
      triggerScreenShake(target.isBoss ? 8 : 4, target.isBoss ? 150 : 100);

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
    return true;
  }, [gameOver, hapticImpact, hapticNotification, isCountdownActive, isPaused, isTelegram, persistState, syncUI, triggerScreenShake]);

  const movePlayerWithAutoAttack = useCallback((direction) => {
    movePlayer(direction);

    if (mobileAutoAttackTimeoutRef.current) {
      window.clearTimeout(mobileAutoAttackTimeoutRef.current);
    }

    mobileAutoAttackTimeoutRef.current = window.setTimeout(() => {
      attack();
      mobileAutoAttackTimeoutRef.current = null;
    }, MOBILE_AUTO_ATTACK_DELAY_MS);
  }, [attack, movePlayer]);

  const handleUseItem = useCallback((itemId) => {
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

      const now = performance.now();

      if (!gameOver && !isPaused && !isCountdownActive && currentState.phase === "playing") {
        let didStateChange = false;
        let shouldPersistAfterProjectiles = false;

        currentState.enemies.forEach((enemy) => {
          enemy.moveTimer += 1;
          if (enemy.isBoss && enemy.projectileInterval) {
            const distanceToPlayer = Math.abs(enemy.x - currentState.player.x) + Math.abs(enemy.y - currentState.player.y);

            if (enemy.projectileCharge) {
              enemy.projectileCharge.framesLeft -= 1;
              if (enemy.projectileCharge.framesLeft <= 0) {
                projectilesRef.current.push(createBossProjectile(enemy, currentState.player, enemy.projectileCharge));
                enemy.projectileCharge = null;
              }
            } else {
              enemy.projectileTimer = (enemy.projectileTimer || 0) + 1;
              if (distanceToPlayer <= (enemy.projectileRange || 8) && enemy.projectileTimer >= enemy.projectileInterval) {
                enemy.projectileTimer = 0;
                enemy.projectileCharge = {
                  ...getBossShotPlan(enemy, currentState.player),
                  framesLeft: 22,
                };
              }
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
              didStateChange = applyDamageToPlayer(currentState, dmg, "#ff8844") || didStateChange;
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
              didStateChange = applyDamageToPlayer(currentState, projectile.damage, projectile.color, -0.35) || didStateChange;
              shouldPersistAfterProjectiles = true;

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

      const activeShake = screenShakeRef.current.expiresAt > now ? screenShakeRef.current : null;
      const shakeX = activeShake ? (Math.random() - 0.5) * activeShake.intensity : 0;
      const shakeY = activeShake ? (Math.random() - 0.5) * activeShake.intensity : 0;
      if (activeShake && activeShake.expiresAt <= now) {
        screenShakeRef.current = { intensity: 0, expiresAt: 0 };
      }

      ctx.save();
      if (activeShake) {
        ctx.translate(shakeX, shakeY);
      }

      if (mapLayerRef.current) {
        ctx.drawImage(mapLayerRef.current, 0, 0, canvasSize.w, canvasSize.h);
      } else {
        ctx.fillStyle = FLOOR_COLOR;
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
      }

      const renderPositions = renderPositionsRef.current;
      renderPositions.player.x = interpolatePosition(renderPositions.player.x, currentState.player.x, 0.28);
      renderPositions.player.y = interpolatePosition(renderPositions.player.y, currentState.player.y, 0.28);

      const activeEnemyIds = new Set();
      currentState.enemies.forEach((enemy) => {
        activeEnemyIds.add(enemy.id);
        const currentRenderPosition = renderPositions.enemies.get(enemy.id) || { x: enemy.x, y: enemy.y };
        const smoothing = enemy.isBoss ? 0.18 : 0.24;
        currentRenderPosition.x = interpolatePosition(currentRenderPosition.x, enemy.x, smoothing);
        currentRenderPosition.y = interpolatePosition(currentRenderPosition.y, enemy.y, smoothing);
        renderPositions.enemies.set(enemy.id, currentRenderPosition);
      });

      Array.from(renderPositions.enemies.keys()).forEach((enemyId) => {
        if (!activeEnemyIds.has(enemyId)) {
          renderPositions.enemies.delete(enemyId);
        }
      });

      currentState.enemies.forEach((enemy) => {
        if (enemy.isBoss && enemy.projectileCharge) {
          const renderEnemy = renderPositions.enemies.get(enemy.id) || { x: enemy.x, y: enemy.y };
          drawBossTelegraph(ctx, enemy, currentState.map, renderEnemy.x, renderEnemy.y);
        }
      });

      currentState.enemies.forEach((enemy) => {
        const renderEnemy = renderPositions.enemies.get(enemy.id) || { x: enemy.x, y: enemy.y };
        const ex = renderEnemy.x * GRID + GRID / 2;
        const ey = renderEnemy.y * GRID + GRID / 2;
        if (enemy.isBoss) {
          drawBoss(ctx, enemy, renderEnemy.x, renderEnemy.y);
        } else {
          const renderStyle = getEnemyRenderStyle(enemy);

          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(ex, renderEnemy.y * GRID + GRID - 2, 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = renderStyle.auraFill;
          ctx.strokeStyle = renderStyle.outlineColor;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = renderStyle.glowColor;
          ctx.shadowBlur = renderStyle.shadowBlur;
          ctx.beginPath();
          ctx.arc(ex, ey, renderStyle.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const emojiSprite = getEmojiSprite(enemy.emoji);
          // Increase sprite size for clearer visuals and enable image smoothing
          const spriteSize = Math.round((renderStyle.fontSize + 6) * 1.6);
          const emojiY = ey + (renderStyle.emojiOffsetY || 0) - 2;

          if (emojiSprite?.complete && emojiSprite.naturalWidth > 0) {
            ctx.imageSmoothingEnabled = true;
            try { ctx.imageSmoothingQuality = 'high'; } catch (e) {}
            ctx.drawImage(emojiSprite, ex - spriteSize / 2, emojiY - spriteSize / 2, spriteSize, spriteSize);
          } else {
            ctx.font = `${Math.round(renderStyle.fontSize * 1.2)}px ${EMOJI_FONT_STACK}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(enemy.emoji, ex, emojiY);
          }
          ctx.restore();
        }
        const bw = GRID - 2;
        const bh = 3;
        const bx = renderEnemy.x * GRID + 1;
        const by = renderEnemy.y * GRID - 5;
        ctx.fillStyle = "#333";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? "#44ff88" : enemy.hp / enemy.maxHp > 0.25 ? "#ffcc00" : "#ff4444";
        ctx.fillRect(bx, by, Math.max(0, bw * (enemy.hp / enemy.maxHp)), bh);
      });

      projectilesRef.current.forEach((projectile) => {
        drawProjectile(ctx, projectile);
      });

      const attackPulse = attackPulseRef.current;
      if (attackPulse && attackPulse.expiresAt > now) {
        const pulseX = attackPulse.x * GRID + GRID / 2;
        const pulseY = attackPulse.y * GRID + GRID / 2;
        ctx.save();
        ctx.strokeStyle = attackPulse.defeated ? "#9cff57" : attackPulse.critical ? "#ffd166" : "#ff6b6b";
        ctx.lineWidth = attackPulse.critical ? 4 : 3;
        ctx.shadowColor = attackPulse.defeated ? "#9cff57" : attackPulse.critical ? "#ffd166" : "#ff6b6b";
        ctx.shadowBlur = attackPulse.defeated ? 18 : 14;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, attackPulse.defeated ? 18 : attackPulse.critical ? 15 : 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (attackPulse) {
        attackPulseRef.current = null;
      }

      const px = renderPositions.player.x * GRID + GRID / 2;
      const py = renderPositions.player.y * GRID + GRID / 2;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(px, renderPositions.player.y * GRID + GRID - 2, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      const isPlayerFlashing = playerFlashUntilRef.current > now;
      ctx.shadowColor = isPlayerFlashing ? "#ff8a65" : "#60e0ff";
      ctx.shadowBlur = isPlayerFlashing ? 18 : 10;
      if (isPlayerFlashing) {
        ctx.globalAlpha = 0.72;
      }
      ctx.font = `${GRID - 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🧙", px, py);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (isCountdownActive && !gameOver) {
        const visibleCountdownValue = countdownValueRef.current || countdownValue;
        ctx.fillStyle = "rgba(10, 8, 25, 0.56)";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
        ctx.fillStyle = "#f4e6a1";
        ctx.font = "bold 34px sans-serif";
        ctx.fillText(String(visibleCountdownValue), canvasSize.w / 2, canvasSize.h / 2 - 10);
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("Підготуйтеся до бою", canvasSize.w / 2, canvasSize.h / 2 + 24);
      } else if (isPaused && !gameOver) {
        ctx.fillStyle = "rgba(10, 8, 25, 0.46)";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
        ctx.fillStyle = "#f4e6a1";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("Пауза", canvasSize.w / 2, canvasSize.h / 2);
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [applyDamageToPlayer, canvasSize.h, canvasSize.w, gameOver, isCountdownActive, isPaused, persistState, syncUI]);

  return (
    <div className="flex h-full min-h-0 w-full max-w-[920px] flex-col gap-0.5 pb-[calc(env(safe-area-inset-bottom,0px)+1px)] sm:gap-2.5 lg:max-w-[1040px]">
      {uiState && (
        <GameUI
          {...uiState}
          gameOver={gameOver}
          isPaused={isPaused}
          levelUp={levelUp}
          phase={effectivePhase}
          onAttack={attack}
          onTogglePause={togglePause}
          onUseItem={handleUseItem}
          onRestart={onRestart}
          onHome={handleHome}
        />
      )}

      <div className="w-full flex-1 min-h-0 rounded-2xl border border-border bg-card/40 p-0 shadow-xl shadow-black/20 sm:p-2.5 lg:p-3">
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

            {levelUp && uiState && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 animate-float">
                <div className="rounded-full border border-primary/50 bg-[linear-gradient(180deg,rgba(95,71,17,0.78),rgba(34,24,60,0.9))] px-3 py-1.5 text-center shadow-lg shadow-primary/15 backdrop-blur-sm">
                  <span className="font-pixel text-[10px] text-primary sm:text-xs">⭐ РІВЕНЬ {uiState.level}! ⭐</span>
                </div>
              </div>
            )}

            {uiState?.bossMaxHp > 0 && effectivePhase === "playing" && !gameOver && (
              <div className="pointer-events-none absolute left-3 right-3 top-3 z-20">
                <div className="rounded-full border border-destructive/30 bg-[linear-gradient(180deg,rgba(63,24,24,0.7),rgba(24,20,42,0.82))] px-3 py-2 shadow-lg shadow-destructive/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[10px] text-destructive sm:text-xs">БОС</span>
                    <span className="truncate font-pixel text-[10px] text-foreground sm:text-xs">{uiState.bossName}</span>
                    <span className="ml-auto font-pixel text-[10px] text-muted-foreground sm:text-xs">{uiState.bossHp}/{uiState.bossMaxHp}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full border border-black/20 bg-background/45">
                    <div
                      className="h-full rounded-full bg-destructive transition-all"
                      style={{ width: `${Math.max(0, (uiState.bossHp / uiState.bossMaxHp) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {uiState && uiState.hp / uiState.maxHp <= 0.3 && effectivePhase === "playing" && !gameOver && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 px-3">
                <div className="rounded-full border border-destructive/40 bg-[linear-gradient(180deg,rgba(73,25,25,0.82),rgba(35,23,46,0.9))] px-3 py-1.5 text-center shadow-lg shadow-destructive/10 backdrop-blur-sm">
                  <span className="font-pixel text-[10px] text-destructive sm:text-xs">
                    {(uiState.inventory.find((item) => item.id === "potion")?.count || 0) <= 0 ? "КРИТИЧНЕ HP" : "ЛІКУЙСЯ"}
                  </span>
                </div>
              </div>
            )}

            {currentPhase === "reward" && stateRef.current?.rewardOptions?.length > 0 && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(10,8,25,0.8)] p-3 backdrop-blur-[1.5px] sm:p-4">
                <div className="max-h-full w-full max-w-[360px] overflow-y-auto rounded-[24px] border border-primary/30 bg-[linear-gradient(180deg,rgba(63,45,19,0.94),rgba(28,20,52,0.94))] p-3 shadow-2xl shadow-black/50 sm:p-4">
                  <div className="mb-3 text-center">
                    <p className="font-pixel text-xs text-primary drop-shadow-[0_0_10px_rgba(255,208,74,0.35)]">НАГОРОДА ЗА РАУНД</p>
                    <p className="mt-2 font-pixel text-[10px] leading-5 text-muted-foreground">Оберіть бонус перед раундом {uiState ? uiState.wave + 1 : 2}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full border border-border/80 bg-background/40 px-3 py-1 font-pixel text-[9px] text-muted-foreground sm:text-[10px]">
                        Далі: раунд {uiState ? uiState.wave + 1 : 2}
                      </span>
                      {isBossWave((uiState ? uiState.wave : 1) + 1) && (
                        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 font-pixel text-[9px] text-destructive sm:text-[10px]">
                          Наступний бій з босом
                        </span>
                      )}
                    </div>
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
                            {isSelected && (
                              <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-pixel text-[8px] text-primary sm:text-[9px]">
                                ВИБРАНО
                              </span>
                            )}
                          </div>
                          <p className="mt-3 font-pixel text-[10px] leading-5 text-muted-foreground">
                            {reward.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 space-y-3">
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
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(10,8,25,0.8)] p-4 backdrop-blur-[1.5px]">
                <div className="w-full max-w-[340px] rounded-[24px] border border-destructive/30 bg-[linear-gradient(180deg,rgba(66,18,18,0.94),rgba(28,20,52,0.94))] p-4 text-center shadow-2xl shadow-black/50">
                  <p className="font-pixel text-xs text-destructive">БИТВА З БОСОМ</p>
                  <p className="mt-2 font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs">
                    {uiState?.bossName || "Попереду сильний ворог"}
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
        utilityItems={uiState?.inventory?.filter((item) => item.id !== "potion") || []}
        onMove={movePlayerWithAutoAttack}
        onAttack={attack}
        onUseHeal={() => handleUseItem("potion")}
        onUseItem={handleUseItem}
      />
    </div>
  );
}

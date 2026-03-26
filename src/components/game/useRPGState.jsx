// Pure game logic — no React here, just state helpers and mutations

export const GRID = 24;
export const COLS = 18;
export const ROWS = 14;
export const MAX_LEVEL = 5;

export const TILE = {
  FLOOR: 0,
  WALL: 1,
};

export const XP_PER_LEVEL = [0, 30, 80, 160, 280, 450];

export const META_UPGRADES = {
  vitality: {
    id: "vitality",
    title: "Міцність",
    description: "+4 до стартового max HP",
    maxLevel: 5,
  },
  power: {
    id: "power",
    title: "Сила",
    description: "+1 до стартової атаки",
    maxLevel: 5,
  },
  alchemy: {
    id: "alchemy",
    title: "Алхімія",
    description: "+1 стартове зілля",
    maxLevel: 4,
  },
  prosperity: {
    id: "prosperity",
    title: "Добробут",
    description: "+10% золота за ворогів і нагороди",
    maxLevel: 4,
  },
};

const ENEMY_ARCHETYPES = {
  slime: {
    id: "slime",
    name: "Слиз",
    emoji: "🟢",
    color: "#44ff88",
    hp: 8,
    atk: 2,
    xp: 10,
    coins: 3,
    behavior: "wander",
    aggroRange: 3,
    moveInterval: [50, 66],
    unlockWave: 1,
  },
  skeleton: {
    id: "skeleton",
    name: "Скелет",
    emoji: "💀",
    color: "#cccccc",
    hp: 13,
    atk: 4,
    xp: 18,
    coins: 5,
    behavior: "hunter",
    aggroRange: 6,
    moveInterval: [38, 52],
    unlockWave: 2,
  },
  wolf: {
    id: "wolf",
    name: "Тіньовий вовк",
    emoji: "🐺",
    color: "#9ca3af",
    hp: 11,
    atk: 5,
    xp: 20,
    coins: 6,
    behavior: "hunter",
    aggroRange: 7,
    moveInterval: [28, 38],
    unlockWave: 4,
  },
  shaman: {
    id: "shaman",
    name: "Болотний шаман",
    emoji: "🧟",
    color: "#7dd3fc",
    hp: 10,
    atk: 6,
    xp: 24,
    coins: 7,
    behavior: "skirmisher",
    aggroRange: 6,
    moveInterval: [34, 44],
    unlockWave: 6,
  },
  brute: {
    id: "brute",
    name: "Кам'яний громила",
    emoji: "🪨",
    color: "#c084fc",
    hp: 22,
    atk: 7,
    xp: 30,
    coins: 9,
    behavior: "brute",
    aggroRange: 5,
    moveInterval: [54, 68],
    unlockWave: 8,
  },
  bat: {
    id: "bat",
    name: "Печерний нетопир",
    emoji: "🦇",
    color: "#f9a8d4",
    hp: 9,
    atk: 5,
    xp: 21,
    coins: 6,
    behavior: "erratic",
    aggroRange: 7,
    moveInterval: [24, 34],
    unlockWave: 10,
  },
};

const BOSS_ARCHETYPES = [
  {
    id: "ogre_chief",
    minWave: 5,
    name: "Вождь печерних огрів",
    emoji: "👹",
    color: "#bb55ff",
    hp: 54,
    atk: 9,
    xp: 90,
    coins: 26,
    behavior: "brute",
    aggroRange: 7,
    moveInterval: [28, 34],
    projectileColor: "#ff7a18",
    projectileSpeed: 2.6,
    projectileDamage: 7,
    projectileRange: 8,
    projectileInterval: [58, 72],
    subtitle: "Повільний, але дуже витривалий бос з важкими ударами і вогняними ядрами.",
  },
  {
    id: "wyrm",
    minWave: 10,
    name: "Пекельний змій",
    emoji: "🐉",
    color: "#ff6633",
    hp: 72,
    atk: 12,
    xp: 130,
    coins: 38,
    behavior: "hunter",
    aggroRange: 9,
    moveInterval: [20, 28],
    projectileColor: "#ff4d6d",
    projectileSpeed: 3.4,
    projectileDamage: 9,
    projectileRange: 10,
    projectileInterval: [42, 54],
    subtitle: "Швидко скорочує дистанцію, плюється полум'ям і карає за паузу.",
  },
  {
    id: "lich",
    minWave: 15,
    name: "Ліч безодні",
    emoji: "☠️",
    color: "#60e0ff",
    hp: 82,
    atk: 14,
    xp: 165,
    coins: 48,
    behavior: "skirmisher",
    aggroRange: 9,
    moveInterval: [18, 26],
    projectileColor: "#60e0ff",
    projectileSpeed: 3,
    projectileDamage: 10,
    projectileRange: 11,
    projectileInterval: [36, 48],
    subtitle: "Тримає дистанцію, засипає арену магічними снарядами і б'є болючіше за звичайних босів.",
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toPositiveInt(value, fallback) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return fallback;
  }
  return Math.max(0, Math.floor(nextValue));
}

function randomInRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(values) {
  const nextValues = [...values];
  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextValues[index], nextValues[swapIndex]] = [nextValues[swapIndex], nextValues[index]];
  }
  return nextValues;
}

function cloneInventory(inventory) {
  return inventory.map((item) => ({ ...item }));
}

function cloneRewardOptions(rewardOptions) {
  return rewardOptions.map((reward) => ({ ...reward }));
}

function isValidMap(map) {
  return Array.isArray(map)
    && map.length === ROWS
    && map.every((row) => Array.isArray(row) && row.length === COLS);
}

function createDefaultStats() {
  return {
    enemiesDefeated: 0,
    bossesDefeated: 0,
    rewardsClaimed: 0,
  };
}

function createPotionItem(count) {
  return { id: "potion", name: "Зілля", emoji: "💊", count, heal: 10 };
}

function getCoinMultiplier(player) {
  return Math.max(1, Number(player?.bonuses?.coinMultiplier) || 1);
}

function getAvailableEnemyArchetypes(wave) {
  return Object.values(ENEMY_ARCHETYPES).filter((archetype) => wave >= archetype.unlockWave);
}

function pickEnemyArchetype(wave, spawnIndex = 0) {
  const availableArchetypes = getAvailableEnemyArchetypes(wave);
  const weightedPool = availableArchetypes.flatMap((archetype) => {
    const rarityPenalty = Math.max(0, wave - archetype.unlockWave);
    const weight = Math.max(1, 4 - Math.floor(rarityPenalty / 3));
    return Array.from({ length: weight }, () => archetype);
  });

  if (spawnIndex < availableArchetypes.length) {
    return availableArchetypes[Math.min(spawnIndex, availableArchetypes.length - 1)];
  }

  return weightedPool[Math.floor(Math.random() * weightedPool.length)] || ENEMY_ARCHETYPES.slime;
}

function getBossArchetype(wave) {
  return [...BOSS_ARCHETYPES].reverse().find((boss) => wave >= boss.minWave) || BOSS_ARCHETYPES[0];
}

function buildReward(rewardId, player, wave) {
  const rewardFactories = {
    heal_small: () => {
      const amount = Math.max(8, 6 + wave * 2);
      return {
        id: "heal_small",
        title: "Відновлення",
        description: `+${amount} HP зараз`,
        emoji: "❤️",
        apply(targetPlayer) {
          targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + amount);
        },
      };
    },
    heal_full: () => ({
      id: "heal_full",
      title: "Повне лікування",
      description: "HP до максимуму",
      emoji: "✨",
      apply(targetPlayer) {
        targetPlayer.hp = targetPlayer.maxHp;
      },
    }),
    attack_boost: () => {
      const amount = wave >= 8 ? 2 : 1;
      return {
        id: "attack_boost",
        title: "Сила удару",
        description: `+${amount} до атаки`,
        emoji: "🗡️",
        apply(targetPlayer) {
          targetPlayer.atk += amount;
        },
      };
    },
    max_hp: () => {
      const amount = wave >= 7 ? 6 : 4;
      return {
        id: "max_hp",
        title: "Живучість",
        description: `+${amount} до max HP`,
        emoji: "🛡️",
        apply(targetPlayer) {
          targetPlayer.maxHp += amount;
          targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + amount);
        },
      };
    },
    potion: () => {
      const amount = wave >= 6 ? 2 : 1;
      return {
        id: "potion",
        title: "Запас зіль",
        description: `+${amount} зілля`,
        emoji: "💊",
        apply(targetPlayer) {
          const potion = targetPlayer.inventory.find((item) => item.id === "potion");
          if (potion) {
            potion.count += amount;
          }
        },
      };
    },
    coins: () => {
      const amount = getScaledCoinAmount(12 + wave * 4, player);
      return {
        id: "coins",
        title: "Золото",
        description: `+${amount} золота`,
        emoji: "💰",
        apply(targetPlayer) {
          targetPlayer.coins += amount;
        },
      };
    },
    xp_burst: () => {
      const amount = Math.max(14, 10 + wave * 5);
      return {
        id: "xp_burst",
        title: "Спогад битви",
        description: `+${amount} XP`,
        emoji: "⭐",
        apply(targetPlayer) {
          awardExperience(targetPlayer, amount);
        },
      };
    },
  };

  const rewardFactory = rewardFactories[rewardId];
  return rewardFactory ? rewardFactory() : null;
}

export function xpToNextLevel(level) {
  return XP_PER_LEVEL[Math.min(level, XP_PER_LEVEL.length - 1)] || 999;
}

export function getMetaUpgradeCost(upgradeId, level) {
  const upgrade = META_UPGRADES[upgradeId];
  if (!upgrade) {
    return Number.POSITIVE_INFINITY;
  }

  return level + 1;
}

export function createMetaProfile() {
  return {
    essence: 0,
    totalGold: 0,
    bestWave: 1,
    runsPlayed: 0,
    bossesDefeated: 0,
    upgrades: {
      vitality: 0,
      power: 0,
      alchemy: 0,
      prosperity: 0,
    },
  };
}

export function sanitizeMetaProfile(savedProfile = {}) {
  const baseProfile = createMetaProfile();
  const upgrades = { ...baseProfile.upgrades };

  Object.values(META_UPGRADES).forEach((upgrade) => {
    upgrades[upgrade.id] = clamp(
      toPositiveInt(savedProfile?.upgrades?.[upgrade.id], baseProfile.upgrades[upgrade.id]),
      0,
      upgrade.maxLevel
    );
  });

  return {
    essence: Math.max(0, toPositiveInt(savedProfile.essence, baseProfile.essence)),
    totalGold: Math.max(0, toPositiveInt(savedProfile.totalGold, baseProfile.totalGold)),
    bestWave: Math.max(1, toPositiveInt(savedProfile.bestWave, baseProfile.bestWave)),
    runsPlayed: Math.max(0, toPositiveInt(savedProfile.runsPlayed, baseProfile.runsPlayed)),
    bossesDefeated: Math.max(0, toPositiveInt(savedProfile.bossesDefeated, baseProfile.bossesDefeated)),
    upgrades,
  };
}

export function upgradeMetaProfile(profile, upgradeId) {
  const nextProfile = sanitizeMetaProfile(profile);
  const upgrade = META_UPGRADES[upgradeId];
  if (!upgrade) {
    return nextProfile;
  }

  const currentLevel = nextProfile.upgrades[upgradeId] || 0;
  const upgradeCost = getMetaUpgradeCost(upgradeId, currentLevel);
  if (currentLevel >= upgrade.maxLevel || nextProfile.essence < upgradeCost) {
    return nextProfile;
  }

  return {
    ...nextProfile,
    essence: nextProfile.essence - upgradeCost,
    upgrades: {
      ...nextProfile.upgrades,
      [upgradeId]: currentLevel + 1,
    },
  };
}

export function applyRunResultsToProfile(profile, runState) {
  const nextProfile = sanitizeMetaProfile(profile);
  const wave = Math.max(1, toPositiveInt(runState?.wave, 1));
  const coins = Math.max(0, toPositiveInt(runState?.player?.coins, 0));
  const bossesDefeated = Math.max(0, toPositiveInt(runState?.stats?.bossesDefeated, 0));
  const enemiesDefeated = Math.max(0, toPositiveInt(runState?.stats?.enemiesDefeated, 0));
  const essenceEarned = Math.max(1, Math.floor(coins / 18) + Math.floor(wave / 2) + bossesDefeated + Math.floor(enemiesDefeated / 12));

  return {
    ...nextProfile,
    essence: nextProfile.essence + essenceEarned,
    totalGold: nextProfile.totalGold + coins,
    bestWave: Math.max(nextProfile.bestWave, wave),
    runsPlayed: nextProfile.runsPlayed + 1,
    bossesDefeated: nextProfile.bossesDefeated + bossesDefeated,
  };
}

export function getScaledCoinAmount(baseAmount, player) {
  return Math.max(1, Math.round(baseAmount * getCoinMultiplier(player)));
}

export function createPlayer(profile = null) {
  const safeProfile = sanitizeMetaProfile(profile);
  const vitalityLevel = safeProfile.upgrades.vitality;
  const powerLevel = safeProfile.upgrades.power;
  const alchemyLevel = safeProfile.upgrades.alchemy;
  const prosperityLevel = safeProfile.upgrades.prosperity;
  const maxHp = 20 + vitalityLevel * 4;

  return {
    x: 2,
    y: 2,
    hp: maxHp,
    maxHp,
    atk: 4 + powerLevel,
    xp: 0,
    level: 1,
    coins: 0,
    bonuses: {
      coinMultiplier: 1 + prosperityLevel * 0.1,
    },
    inventory: [createPotionItem(2 + alchemyLevel)],
  };
}

export function createBossPreview(wave) {
  const boss = getBossArchetype(wave);
  return {
    id: boss.id,
    name: boss.name,
    emoji: boss.emoji,
    color: boss.color,
    projectileColor: boss.projectileColor,
    subtitle: boss.subtitle,
  };
}

export function createEnemy(id, x, y, wave = 1, forcedArchetypeId = null) {
  const archetype = forcedArchetypeId && ENEMY_ARCHETYPES[forcedArchetypeId]
    ? ENEMY_ARCHETYPES[forcedArchetypeId]
    : pickEnemyArchetype(wave, id);
  const scale = 1 + (wave - 1) * 0.16;

  return {
    id,
    x,
    y,
    archetypeId: archetype.id,
    behavior: archetype.behavior,
    aggroRange: archetype.aggroRange,
    hp: Math.floor(archetype.hp * scale),
    maxHp: Math.floor(archetype.hp * scale),
    atk: Math.max(1, Math.floor(archetype.atk * (1 + (wave - 1) * 0.12))),
    xp: Math.max(1, Math.floor(archetype.xp * (1 + (wave - 1) * 0.08))),
    coinDrop: Math.max(1, Math.floor(archetype.coins * (1 + (wave - 1) * 0.1))),
    name: archetype.name,
    emoji: archetype.emoji,
    color: archetype.color,
    moveTimer: 0,
    moveInterval: randomInRange(archetype.moveInterval[0], archetype.moveInterval[1]),
    isBoss: false,
    bossId: null,
  };
}

export function isBossWave(wave) {
  return wave > 0 && wave % 5 === 0;
}

export function createBossEnemy(id, player, wave) {
  const boss = getBossArchetype(wave);
  const scale = 1 + (wave - boss.minWave) * 0.12;
  const nextBoss = {
    id,
    x: COLS - 4,
    y: ROWS - 4,
    archetypeId: "boss",
    behavior: boss.behavior,
    aggroRange: boss.aggroRange,
    hp: Math.floor(boss.hp * scale),
    maxHp: Math.floor(boss.hp * scale),
    atk: Math.max(1, Math.floor(boss.atk * (1 + (wave - boss.minWave) * 0.08))),
    xp: Math.floor(boss.xp * scale),
    coinDrop: Math.floor(boss.coins * scale),
    name: boss.name,
    emoji: boss.emoji,
    color: boss.color,
    moveTimer: 0,
    moveInterval: randomInRange(boss.moveInterval[0], boss.moveInterval[1]),
    projectileTimer: 0,
    projectileInterval: randomInRange(boss.projectileInterval[0], boss.projectileInterval[1]),
    projectileSpeed: boss.projectileSpeed,
    projectileDamage: Math.max(1, Math.floor(boss.projectileDamage * (1 + (wave - boss.minWave) * 0.06))),
    projectileRange: boss.projectileRange,
    projectileColor: boss.projectileColor,
    isBoss: true,
    bossId: boss.id,
  };

  if (Math.abs(nextBoss.x - player.x) + Math.abs(nextBoss.y - player.y) <= 4) {
    nextBoss.x = COLS - 5;
    nextBoss.y = 2;
  }

  return nextBoss;
}

export function spawnWaveEnemies(map, player, wave) {
  if (isBossWave(wave)) {
    return [createBossEnemy(0, player, wave)];
  }

  return spawnEnemies(map, player, Math.min(5 + wave, 12), wave);
}

export function generateMap() {
  const map = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? TILE.WALL : TILE.FLOOR
    )
  );

  const wallSeeds = [
    [3, 3], [3, 4], [4, 3], [8, 2], [8, 3], [8, 4],
    [12, 5], [13, 5], [14, 5], [5, 8], [5, 9], [5, 10],
    [10, 9], [10, 10], [14, 9], [14, 10], [14, 11],
    [6, 6], [7, 6], [3, 11], [4, 11], [16, 3], [16, 4],
  ];

  wallSeeds.forEach(([row, col]) => {
    if (map[row] && map[row][col] !== undefined) {
      map[row][col] = TILE.WALL;
    }
  });

  return map;
}

export function isWall(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) {
    return true;
  }
  return map[y][x] === TILE.WALL;
}

export function spawnEnemies(map, player, count = 5, wave = 1) {
  const enemies = [];
  let id = 0;
  let attempts = 0;
  const maxAttempts = Math.max(200, count * 50);

  while (enemies.length < count && attempts < maxAttempts) {
    attempts += 1;
    const x = 3 + Math.floor(Math.random() * (COLS - 6));
    const y = 3 + Math.floor(Math.random() * (ROWS - 6));
    const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
    const occupied = enemies.some((enemy) => enemy.x === x && enemy.y === y);

    if (!isWall(map, x, y) && dist > 4 && !occupied) {
      enemies.push(createEnemy(id, x, y, wave));
      id += 1;
    }
  }

  return enemies;
}

export function awardExperience(player, amount) {
  let leveledUp = false;
  player.xp += Math.max(0, amount);

  while (player.level < MAX_LEVEL && player.xp >= xpToNextLevel(player.level)) {
    player.xp -= xpToNextLevel(player.level);
    player.level += 1;
    player.maxHp += 5;
    player.hp = Math.min(player.hp + 5, player.maxHp);
    player.atk += 1;
    leveledUp = true;
  }

  if (player.level >= MAX_LEVEL) {
    player.xp = Math.min(player.xp, xpToNextLevel(MAX_LEVEL));
  }

  return leveledUp;
}

export function generateRewardChoices(player, wave) {
  const rewardPool = ["attack_boost", "max_hp", "coins", "xp_burst", "potion", "heal_small"];
  const guaranteedRewards = [];

  if (player.hp <= Math.ceil(player.maxHp * 0.4)) {
    guaranteedRewards.push("heal_full");
  } else if (player.hp <= Math.ceil(player.maxHp * 0.65)) {
    guaranteedRewards.push("heal_small");
  }

  if ((player.inventory.find((item) => item.id === "potion")?.count || 0) === 0) {
    guaranteedRewards.push("potion");
  }

  if (wave >= 5) {
    rewardPool.push("coins", "attack_boost", "xp_burst");
  }
  if (wave >= 8) {
    rewardPool.push("max_hp", "potion");
  }

  const selectedIds = [];

  guaranteedRewards.forEach((rewardId) => {
    if (!selectedIds.includes(rewardId)) {
      selectedIds.push(rewardId);
    }
  });

  shuffle(rewardPool).forEach((rewardId) => {
    if (!selectedIds.includes(rewardId) && selectedIds.length < 3) {
      selectedIds.push(rewardId);
    }
  });

  return selectedIds
    .slice(0, 3)
    .map((rewardId) => buildReward(rewardId, player, wave))
    .filter(Boolean)
    .map((reward) => ({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      emoji: reward.emoji,
    }));
}

export function applyRewardChoice(player, rewardId, wave = 1) {
  const reward = buildReward(rewardId, player, wave);
  if (!reward) {
    return null;
  }

  reward.apply(player);
  return {
    id: reward.id,
    title: reward.title,
    description: reward.description,
    emoji: reward.emoji,
  };
}

function sanitizeRewardOptions(savedRewardOptions, player, wave) {
  if (!Array.isArray(savedRewardOptions) || savedRewardOptions.length === 0) {
    return generateRewardChoices(player, wave);
  }

  return savedRewardOptions
    .filter((reward) => reward && typeof reward.id === "string" && buildReward(reward.id, player, wave))
    .slice(0, 3)
    .map((reward) => {
      const normalizedReward = buildReward(reward.id, player, wave);
      return {
        id: reward.id,
        title: reward.title || normalizedReward.title,
        description: reward.description || normalizedReward.description,
        emoji: reward.emoji || normalizedReward.emoji,
      };
    });
}

function sanitizePlayer(savedPlayer = {}, profile = null) {
  const basePlayer = createPlayer(profile);
  const level = clamp(toPositiveInt(savedPlayer.level, basePlayer.level), 1, MAX_LEVEL);
  const maxHp = Math.max(basePlayer.maxHp, toPositiveInt(savedPlayer.maxHp, basePlayer.maxHp));
  const nextPlayer = {
    ...basePlayer,
    x: clamp(toPositiveInt(savedPlayer.x, basePlayer.x), 1, COLS - 2),
    y: clamp(toPositiveInt(savedPlayer.y, basePlayer.y), 1, ROWS - 2),
    level,
    maxHp,
    hp: clamp(toPositiveInt(savedPlayer.hp, basePlayer.hp), 0, maxHp),
    atk: Math.max(basePlayer.atk, toPositiveInt(savedPlayer.atk, basePlayer.atk)),
    xp: Math.max(0, toPositiveInt(savedPlayer.xp, basePlayer.xp)),
    coins: Math.max(0, toPositiveInt(savedPlayer.coins, basePlayer.coins)),
    bonuses: {
      coinMultiplier: Math.max(basePlayer.bonuses.coinMultiplier, Number(savedPlayer?.bonuses?.coinMultiplier) || basePlayer.bonuses.coinMultiplier),
    },
    inventory: cloneInventory(basePlayer.inventory),
  };

  if (Array.isArray(savedPlayer.inventory)) {
    nextPlayer.inventory = nextPlayer.inventory.map((baseItem) => {
      const savedItem = savedPlayer.inventory.find((item) => item?.id === baseItem.id);
      if (!savedItem) {
        return baseItem;
      }

      return {
        ...baseItem,
        count: Math.max(0, toPositiveInt(savedItem.count, baseItem.count)),
      };
    });
  }

  if (nextPlayer.level >= MAX_LEVEL) {
    nextPlayer.xp = Math.min(nextPlayer.xp, xpToNextLevel(MAX_LEVEL));
  }

  return nextPlayer;
}

function sanitizeStats(savedStats) {
  const baseStats = createDefaultStats();
  return {
    enemiesDefeated: Math.max(0, toPositiveInt(savedStats?.enemiesDefeated, baseStats.enemiesDefeated)),
    bossesDefeated: Math.max(0, toPositiveInt(savedStats?.bossesDefeated, baseStats.bossesDefeated)),
    rewardsClaimed: Math.max(0, toPositiveInt(savedStats?.rewardsClaimed, baseStats.rewardsClaimed)),
  };
}

function sanitizeBossPreview(savedBossPreview, wave) {
  const fallbackBossPreview = createBossPreview(wave);
  if (!savedBossPreview || typeof savedBossPreview !== "object") {
    return fallbackBossPreview;
  }

  return {
    id: savedBossPreview.id || fallbackBossPreview.id,
    name: savedBossPreview.name || fallbackBossPreview.name,
    emoji: savedBossPreview.emoji || fallbackBossPreview.emoji,
    color: savedBossPreview.color || fallbackBossPreview.color,
    projectileColor: savedBossPreview.projectileColor || fallbackBossPreview.projectileColor,
    subtitle: savedBossPreview.subtitle || fallbackBossPreview.subtitle,
  };
}

function sanitizeEnemies(savedEnemies, map, player, wave) {
  if (!Array.isArray(savedEnemies) || savedEnemies.length === 0) {
    return spawnWaveEnemies(map, player, wave);
  }

  const usedPositions = new Set();
  const enemies = savedEnemies
    .map((savedEnemy, index) => {
      const x = clamp(toPositiveInt(savedEnemy?.x, 1), 1, COLS - 2);
      const y = clamp(toPositiveInt(savedEnemy?.y, 1), 1, ROWS - 2);
      const positionKey = `${x}:${y}`;

      if (isWall(map, x, y) || (x === player.x && y === player.y) || usedPositions.has(positionKey)) {
        return null;
      }

      usedPositions.add(positionKey);

      const enemy = savedEnemy?.isBoss
        ? createBossEnemy(index, player, wave)
        : createEnemy(index, x, y, wave, savedEnemy?.archetypeId);

      enemy.x = x;
      enemy.y = y;
      enemy.maxHp = Math.max(enemy.maxHp, toPositiveInt(savedEnemy?.maxHp, enemy.maxHp));
      enemy.hp = clamp(toPositiveInt(savedEnemy?.hp, enemy.hp), 0, enemy.maxHp);
      enemy.atk = Math.max(1, toPositiveInt(savedEnemy?.atk, enemy.atk));
      enemy.xp = Math.max(1, toPositiveInt(savedEnemy?.xp, enemy.xp));
      enemy.coinDrop = Math.max(1, toPositiveInt(savedEnemy?.coinDrop, enemy.coinDrop));
      enemy.name = savedEnemy?.name || enemy.name;
      enemy.emoji = savedEnemy?.emoji || enemy.emoji;
      enemy.color = savedEnemy?.color || enemy.color;
      enemy.behavior = savedEnemy?.behavior || enemy.behavior;
      enemy.aggroRange = Math.max(2, toPositiveInt(savedEnemy?.aggroRange, enemy.aggroRange));
      enemy.moveTimer = 0;
      enemy.moveInterval = Math.max(18, toPositiveInt(savedEnemy?.moveInterval, enemy.moveInterval));
      enemy.projectileTimer = 0;
      enemy.projectileInterval = Math.max(24, toPositiveInt(savedEnemy?.projectileInterval, enemy.projectileInterval || 0));
      enemy.projectileSpeed = Math.max(1.6, Number(savedEnemy?.projectileSpeed) || enemy.projectileSpeed || 0);
      enemy.projectileDamage = Math.max(1, toPositiveInt(savedEnemy?.projectileDamage, enemy.projectileDamage || 0));
      enemy.projectileRange = Math.max(4, toPositiveInt(savedEnemy?.projectileRange, enemy.projectileRange || 0));
      enemy.projectileColor = savedEnemy?.projectileColor || enemy.projectileColor || enemy.color;
      enemy.isBoss = Boolean(savedEnemy?.isBoss || enemy.isBoss);
      enemy.bossId = savedEnemy?.bossId || enemy.bossId;
      return enemy;
    })
    .filter(Boolean);

  return enemies.length > 0 ? enemies : spawnWaveEnemies(map, player, wave);
}

export function createGameState(savedState = null, profile = null) {
  const map = isValidMap(savedState?.map) ? savedState.map : generateMap();
  const player = sanitizePlayer(savedState?.player, profile);
  const phase = ["reward", "bossIntro"].includes(savedState?.phase) ? savedState.phase : "playing";

  if (isWall(map, player.x, player.y)) {
    player.x = 2;
    player.y = 2;
  }

  const wave = Math.max(1, toPositiveInt(savedState?.wave, 1));
  const enemies = phase === "playing"
    ? sanitizeEnemies(savedState?.enemies, map, player, wave)
    : [];
  const rewardOptions = phase === "reward"
    ? sanitizeRewardOptions(savedState?.rewardOptions, player, wave)
    : [];

  return {
    map,
    player,
    enemies,
    phase,
    rewardOptions,
    bossPreview: phase === "bossIntro" ? sanitizeBossPreview(savedState?.bossPreview, wave) : null,
    stats: sanitizeStats(savedState?.stats),
    wave,
  };
}

export function createSaveSnapshot(state) {
  return {
    map: state.map.map((row) => [...row]),
    player: {
      ...state.player,
      bonuses: { ...state.player.bonuses },
      inventory: cloneInventory(state.player.inventory),
    },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    phase: state.phase || "playing",
    rewardOptions: cloneRewardOptions(state.rewardOptions || []),
    bossPreview: state.bossPreview ? { ...state.bossPreview } : null,
    stats: { ...sanitizeStats(state.stats) },
    wave: state.wave,
  };
}

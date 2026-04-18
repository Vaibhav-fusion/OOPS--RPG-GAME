// Game Engine for Dungeonsweeper
// Advanced algorithmic implementation for board generation, danger calculation, and reveal logic

const TILE_TYPES = {
  EMPTY: "empty",
  ENEMY: "enemy",
  TRAP: "trap",
  TREASURE: "treasure",
};

const ENEMY_TYPES = {
  RAT: { name: "rat", value: 1 },
  BAT: { name: "bat", value: 2 },
  SKELETON: { name: "skeleton", value: 3 },
  PLANT: { name: "plant", value: 4 },
  SLIME: { name: "slime", value: 5 },
  BOSS: { name: "boss", value: 10 },
};

const TRAP_TYPES = {
  BOMB: { name: "bomb", value: 100 },
};

const TREASURE_TYPES = {
  GOLD: { name: "gold", value: 10 },
  GEM: { name: "gem", value: 25 },
  ARTIFACT: { name: "artifact", value: 50 },
};

/**
 * Generates a game board with tiles based on difficulty and player level
 * @param {number} gridSize - Size of the grid (e.g., 10 for 10x10)
 * @param {string} difficulty - "easy", "medium", "hard"
 * @param {number} playerLevel - Player's current level for scaling
 * @param {number} seed - Optional seed for deterministic generation
 * @returns {Array} 2D array of tile objects
 */
export const generateBoard = (
  gridSize,
  difficulty = "medium",
  playerLevel = 1,
  seed = null,
) => {
  // Initialize random number generator with seed if provided
  const rng = seed ? seededRandom(seed) : Math.random;

  const board = [];
  for (let i = 0; i < gridSize; i++) {
    board[i] = [];
    for (let j = 0; j < gridSize; j++) {
      board[i][j] = {
        type: TILE_TYPES.EMPTY,
        value: 0,
        danger: 0,
        revealed: false,
        enemyType: null,
        trapType: null,
        treasureType: null,
      };
    }
  }

  // Ensure starting tile (0,0) is always safe
  board[0][0].type = TILE_TYPES.EMPTY;

  // Calculate distribution based on difficulty
  const distribution = getDifficultyDistribution(difficulty, playerLevel);

  // Place enemies
  placeEnemies(board, distribution.enemyCount, gridSize, playerLevel, rng);

  // Place traps
  placeTraps(board, distribution.trapCount, gridSize, playerLevel, rng);

  // Place treasures
  placeTreasures(board, distribution.treasureCount, gridSize, rng);

  // Calculate danger values for all tiles
  calculateDanger(board, gridSize);

  return board;
};

/**
 * Calculates danger values for all tiles based on adjacent enemies/traps
 * @param {Array} board - 2D array of tiles
 * @param {number} gridSize - Size of the grid
 */
export const calculateDanger = (board, gridSize) => {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j].type !== TILE_TYPES.EMPTY) continue;

      let danger = 0;
      // Check all 8 adjacent tiles
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;

          const ni = i + di;
          const nj = j + dj;

          if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
            const neighbor = board[ni][nj];
            if (
              neighbor.type === TILE_TYPES.ENEMY ||
              neighbor.type === TILE_TYPES.TRAP
            ) {
              danger += neighbor.value;
            }
          }
        }
      }
      board[i][j].danger = danger;
    }
  }
};

/**
 * Reveals a tile and handles game logic
 * @param {Object} gameSession - The game session object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object} Result of the reveal action
 */
export const revealTile = (gameSession, x, y) => {
  const { board, gridSize, playerStats } = gameSession;

  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
    throw new Error("Invalid coordinates");
  }

  const tile = board[x][y];

  if (tile.revealed) {
    return { action: "already_revealed" };
  }

  tile.revealed = true;
  const revealedCells = [[x, y]];

  let action = "revealed";
  let damage = 0;
  let xpGain = 0;

  switch (tile.type) {
    case TILE_TYPES.EMPTY:
      if (tile.danger === 0) {
        // Flood fill for safe empty tiles
        const floodRevealed = floodFill(board, x, y, gridSize);
        revealedCells.push(...floodRevealed);
        action = "flood_fill";
      }
      break;

    case TILE_TYPES.ENEMY:
      damage = tile.value;
      playerStats.hp -= damage;
      action = "enemy_encounter";
      break;

    case TILE_TYPES.TRAP:
      damage = tile.value;
      playerStats.hp -= damage;
      action = "trap_triggered";
      break;

    case TILE_TYPES.TREASURE:
      xpGain = tile.value;
      playerStats.xp += xpGain;
      playerStats.level = Math.floor(playerStats.xp / 100) + 1;
      action = "treasure_found";
      break;
  }

  return {
    action,
    revealedCells,
    damage,
    xpGain,
    playerStats,
  };
};

/**
 * Performs flood fill to reveal connected empty tiles with danger = 0
 * @param {Array} board - 2D array of tiles
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {number} gridSize - Size of the grid
 * @returns {Array} Array of [x,y] coordinates that were revealed
 */
const floodFill = (board, startX, startY, gridSize) => {
  const revealed = [];
  const queue = [[startX, startY]];
  const visited = new Set();

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const tile = board[x][y];

    if (tile.revealed || tile.type !== TILE_TYPES.EMPTY || tile.danger !== 0)
      continue;

    tile.revealed = true;
    revealed.push([x, y]);

    // Add adjacent tiles to queue
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          queue.push([nx, ny]);
        }
      }
    }
  }

  return revealed;
};

/**
 * Checks the current game status
 * @param {Object} gameSession - The game session object
 * @returns {string} "ongoing", "won", or "lost"
 */
export const checkGameStatus = (gameSession) => {
  const { board, gridSize, playerStats } = gameSession;

  // Check if player is dead
  if (playerStats.hp <= 0) {
    return "lost";
  }

  // Check if all treasures are revealed
  let allTreasuresRevealed = true;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const tile = board[i][j];
      if (tile.type === TILE_TYPES.TREASURE && !tile.revealed) {
        allTreasuresRevealed = false;
        break;
      }
    }
    if (!allTreasuresRevealed) break;
  }

  if (allTreasuresRevealed) {
    return "won";
  }

  return "ongoing";
};

// Helper functions

const getDifficultyDistribution = (difficulty, playerLevel) => {
  const baseMultiplier = Math.min(playerLevel * 0.1 + 1, 2); // Max 2x at level 10+

  let enemyRatio, trapRatio, treasureRatio;

  switch (difficulty) {
    case "easy":
      enemyRatio = 0.15;
      trapRatio = 0.05;
      treasureRatio = 0.15;
      break;
    case "hard":
      enemyRatio = 0.25;
      trapRatio = 0.15;
      treasureRatio = 0.08;
      break;
    default: // medium
      enemyRatio = 0.2;
      trapRatio = 0.1;
      treasureRatio = 0.1;
  }

  return {
    enemyCount: Math.floor(100 * enemyRatio * baseMultiplier),
    trapCount: Math.floor(100 * trapRatio * baseMultiplier),
    treasureCount: Math.floor(100 * treasureRatio),
  };
};

const placeEnemies = (board, count, gridSize, playerLevel, rng) => {
  const enemyPool = getEnemyPool(playerLevel);
  let placed = 0;

  while (placed < count) {
    const x = Math.floor(rng() * gridSize);
    const y = Math.floor(rng() * gridSize);

    if (board[x][y].type !== TILE_TYPES.EMPTY || (x === 0 && y === 0)) continue;

    const enemy = enemyPool[Math.floor(rng() * enemyPool.length)];
    board[x][y] = {
      ...board[x][y],
      type: TILE_TYPES.ENEMY,
      value: enemy.value,
      enemyType: enemy.name,
    };
    placed++;
  }
};

const placeTraps = (board, count, gridSize, playerLevel, rng) => {
  let placed = 0;

  while (placed < count) {
    const x = Math.floor(rng() * gridSize);
    const y = Math.floor(rng() * gridSize);

    if (board[x][y].type !== TILE_TYPES.EMPTY || (x === 0 && y === 0)) continue;

    board[x][y] = {
      ...board[x][y],
      type: TILE_TYPES.TRAP,
      value: TRAP_TYPES.BOMB.value,
      trapType: TRAP_TYPES.BOMB.name,
    };
    placed++;
  }
};

const placeTreasures = (board, count, gridSize, rng) => {
  const treasurePool = [
    TREASURE_TYPES.GOLD,
    TREASURE_TYPES.GEM,
    TREASURE_TYPES.ARTIFACT,
  ];
  let placed = 0;

  while (placed < count) {
    const x = Math.floor(rng() * gridSize);
    const y = Math.floor(rng() * gridSize);

    if (board[x][y].type !== TILE_TYPES.EMPTY || (x === 0 && y === 0)) continue;

    const treasure = treasurePool[Math.floor(rng() * treasurePool.length)];
    board[x][y] = {
      ...board[x][y],
      type: TILE_TYPES.TREASURE,
      value: treasure.value,
      treasureType: treasure.name,
    };
    placed++;
  }
};

const getEnemyPool = (playerLevel) => {
  const pool = [];

  if (playerLevel >= 1) pool.push(ENEMY_TYPES.RAT, ENEMY_TYPES.BAT);
  if (playerLevel >= 3) pool.push(ENEMY_TYPES.SKELETON);
  if (playerLevel >= 5) pool.push(ENEMY_TYPES.PLANT, ENEMY_TYPES.SLIME);
  if (playerLevel >= 8) pool.push(ENEMY_TYPES.BOSS);

  return pool;
};

// Seeded random number generator for deterministic board generation
const seededRandom = (seed) => {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
};

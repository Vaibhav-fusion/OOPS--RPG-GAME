const GRID_SIZE = 11;
const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const ENEMIES = {
  bat: 1,
  rat: 1,
  wolf: 2,
  skeleton: 3,
  goblin: 4,
  slime: 5,
  orge: 6,
  bombslime: 8,
  "rat master": 5,
  "free elf": -1,
};

const DRAGON_DAMAGE = { easy: 5, medium: 6, hard: 8 };

const tile = (name, type, value = 0, extra = {}, revealed = false) => ({
  name,
  type,
  value,
  danger: 0,
  revealed,
  extra,
});

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const inBounds = (board, x, y) =>
  x >= 0 && x < board.length && y >= 0 && y < board.length;

const chooseHiddenCells = (board, count, avoidSet = new Set()) => {
  const cells = [];
  for (let i = 0; i < board.length; i += 1) {
    for (let j = 0; j < board[i].length; j += 1) {
      if (!avoidSet.has(`${i},${j}`)) cells.push([i, j]);
    }
  }
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count);
};

const enemyCatalog = ["bat", "rat", "wolf", "skeleton", "goblin", "slime", "orge"];

const spawnTiles = (board, specs, avoidSet) => {
  const cells = chooseHiddenCells(
    board,
    specs.reduce((sum, spec) => sum + spec.count, 0),
    avoidSet,
  );
  let cursor = 0;
  specs.forEach((spec) => {
    for (let i = 0; i < spec.count; i += 1) {
      const [x, y] = cells[cursor];
      cursor += 1;
      board[x][y] = spec.create();
    }
  });
};

const enemyTile = (name) => tile(name, "enemy", ENEMIES[name]);

const recalcDanger = (board) => {
  for (let i = 0; i < board.length; i += 1) {
    for (let j = 0; j < board[i].length; j += 1) {
      const current = board[i][j];
      if (current.type !== "empty" && current.type !== "boss" && current.type !== "orb") {
        continue;
      }
      let danger = 0;
      DIRECTIONS.forEach(([dx, dy]) => {
        const nx = i + dx;
        const ny = j + dy;
        if (!inBounds(board, nx, ny)) return;
        const neighbor = board[nx][ny];
        if (neighbor.type === "enemy" || neighbor.type === "trap" || neighbor.type === "boss") {
          danger += Math.max(0, neighbor.value > 0 ? 1 : 0);
        }
      });
      current.danger = danger;
    }
  }
};

const applyDamage = (gameSession, amount) => {
  gameSession.playerStats.hp -= amount;
  if (gameSession.playerStats.hp < 0) gameSession.playerStats.hp = 0;
};

const addXp = (gameSession, amount) => {
  gameSession.playerStats.xp += amount;
};

const clearToEmpty = (board, row, col, revealed = true) => {
  board[row][col] = tile("empty", "empty", 0, {}, revealed);
};

const revealBombslimeBlast = (board, row, col) => {
  const revealedCells = [];
  DIRECTIONS.forEach(([dx, dy]) => {
    const nx = row + dx;
    const ny = col + dy;
    if (!inBounds(board, nx, ny)) return;
    board[nx][ny].revealed = true;
    clearToEmpty(board, nx, ny, true);
    revealedCells.push([nx, ny]);
  });
  return revealedCells;
};

const revealNearby = (board, row, col, maxTiles) => {
  const nearby = [];
  for (let i = row - 3; i <= row + 3; i += 1) {
    for (let j = col - 3; j <= col + 3; j += 1) {
      if (!inBounds(board, i, j)) continue;
      if (!board[i][j].revealed && !(i === row && j === col)) {
        nearby.push([i, j]);
      }
    }
  }
  for (let i = nearby.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nearby[i], nearby[j]] = [nearby[j], nearby[i]];
  }
  return nearby.slice(0, maxTiles);
};

export const generateBoard = async (_rawSize, difficulty = "medium") => {
  const board = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => tile("empty", "empty")),
  );

  const center = Math.floor(GRID_SIZE / 2);
  board[center][center] = tile(
    "centre dragon",
    "boss",
    DRAGON_DAMAGE[difficulty] || DRAGON_DAMAGE.medium,
    {},
    true,
  );
  board[0][0] = tile("blue orb", "orb", 0, { used: false }, true);

  const avoid = new Set([`${center},${center}`, "0,0"]);
  spawnTiles(
    board,
    [
      { count: 20, create: () => enemyTile(randomFrom(enemyCatalog)) },
      { count: 3, create: () => enemyTile("bombslime") },
      { count: 2, create: () => enemyTile("rat master") },
      { count: 4, create: () => enemyTile("free elf") },
      { count: 4, create: () => tile("bomb", "trap", 100) },
      { count: 6, create: () => tile("trapchest", "trap", 1) },
      { count: 10, create: () => tile("chest", "support", 0) },
      { count: 8, create: () => tile("question", "mystery", 0) },
    ],
    avoid,
  );

  recalcDanger(board);
  return board;
};

export const revealTile = (gameSession, row, col) => {
  const { board } = gameSession;
  if (!inBounds(board, row, col)) {
    const error = new Error("Invalid coordinates");
    error.status = 400;
    throw error;
  }

  const current = board[row][col];
  const canReuseVisibleTile =
    current.type === "boss" ||
    current.type === "enemy" ||
    current.type === "trap" ||
    current.type === "support" ||
    current.type === "mystery" ||
    (current.name === "blue orb" && !current.extra?.used);
  if (current.revealed && !canReuseVisibleTile) {
    const error = new Error("Tile already revealed.");
    error.status = 400;
    throw error;
  }

  current.revealed = true;
  const result = {
    action: "revealed",
    revealedCells: [[row, col]],
    damage: 0,
    xpGain: 0,
  };

  if (current.type === "boss") {
    applyDamage(gameSession, current.value);
    addXp(gameSession, current.value);
    result.action = "slay_dragon";
    result.damage = current.value;
    result.xpGain = current.value;
    clearToEmpty(board, row, col, true);
  } else if (current.type === "enemy") {
    const damage = Math.max(0, current.value);
    const xp = Math.max(0, current.value);
    applyDamage(gameSession, damage);
    addXp(gameSession, xp);
    result.action = `enemy_${current.name}`;
    result.damage = damage;
    result.xpGain = xp;

    if (current.name === "bombslime") {
      const blast = revealBombslimeBlast(board, row, col);
      result.revealedCells.push(...blast);
      result.action = "bombslime_blast";
    }
    if (current.name === "rat master") {
      for (let i = 0; i < board.length; i += 1) {
        for (let j = 0; j < board[i].length; j += 1) {
          if (!board[i][j].revealed && board[i][j].name === "rat") {
            board[i][j].revealed = true;
            result.revealedCells.push([i, j]);
          }
        }
      }
      result.action = "rat_master";
    }
    clearToEmpty(board, row, col, true);
  } else if (current.name === "blue orb") {
    current.extra = { ...(current.extra || {}), used: true };
    const revealed = revealNearby(board, row, col, 12);
    revealed.forEach(([x, y]) => {
      board[x][y].revealed = true;
      result.revealedCells.push([x, y]);
    });
    result.action = "blue_orb";
  } else if (current.name === "trapchest") {
    const isBomb = Math.random() < 0.1;
    const damage = isBomb ? 100 : 1;
    applyDamage(gameSession, damage);
    result.action = isBomb ? "trapchest_bomb" : "trapchest";
    result.damage = damage;
    clearToEmpty(board, row, col, true);
  } else if (current.name === "bomb") {
    applyDamage(gameSession, 100);
    result.action = "bomb_exploded";
    result.damage = 100;
    clearToEmpty(board, row, col, true);
  } else if (current.name === "chest") {
    const fullHeal = Math.random() < 0.65;
    if (fullHeal) {
      gameSession.playerStats.hp = gameSession.playerStats.maxHp;
      result.action = "chest_full_heal";
    } else {
      const xp = 4 + Math.floor(Math.random() * 5);
      addXp(gameSession, xp);
      result.action = "chest_xp";
      result.xpGain = xp;
    }
    clearToEmpty(board, row, col, true);
  } else if (current.name === "question") {
    result.action = "question";
    clearToEmpty(board, row, col, true);
  }

  recalcDanger(board);
  return result;
};

export const levelUpPlayer = (gameSession) => {
  const cost = Math.max(1, gameSession.playerStats.hp);
  if (gameSession.playerStats.xp < cost) {
    const error = new Error("Not enough XP to level up.");
    error.status = 400;
    throw error;
  }
  gameSession.playerStats.xp -= cost;
  gameSession.playerStats.level += 1;
  gameSession.playerStats.maxHp += 1;
  gameSession.playerStats.hp = gameSession.playerStats.maxHp;
};

export const checkGameStatus = (gameSession) => {
  if (gameSession.playerStats.hp <= 0) return "lost";
  const center = Math.floor(gameSession.board.length / 2);
  const centerTile = gameSession.board[center][center];
  if (centerTile.type === "empty" && centerTile.revealed) return "won";
  return "ongoing";
};

export const isWinPossible = () => true;
export const normalizeGridSize = () => GRID_SIZE;

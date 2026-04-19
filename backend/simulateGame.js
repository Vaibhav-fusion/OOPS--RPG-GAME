import { spawn } from "child_process";
import mongoose from "mongoose";
import GameSession from "./src/models/gameSession.model.js";

const SERVER_PORT = 4005;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const MONGO_URI = "mongodb://127.0.0.1:27017/game-jus-auth";

const waitForServer = (serverProcess) =>
  new Promise((resolve, reject) => {
    let started = false;
    serverProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Server listening on port")) {
        started = true;
        resolve();
      }
    });
    setTimeout(() => {
      if (!started) reject(new Error("Server start timeout"));
    }, 15000);
  });

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
};

const runSimulations = async () => {
  const serverProcess = spawn("node", ["app.js"], {
    env: { ...process.env, PORT: String(SERVER_PORT), MONGO_URI },
    cwd: process.cwd(),
  });

  try {
    await waitForServer(serverProcess);
    await mongoose.connect(MONGO_URI);

    const userEmail = `sim_${Date.now()}@test.com`;
    const userPass = "Password123!";
    const userName = `sim_${Date.now().toString().slice(-6)}`;

    console.log("--> Registering user...");
    const regRes = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userName, email: userEmail, password: userPass })
    });
    console.log("Register res:", regRes.body);

    console.log("--> Logging in...");
    const loginRes = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPass })
    });
    console.log("Login res:", loginRes.body);
    const token = loginRes.body.accessToken;

    const playToWin = async () => {
      console.log("\n=== Playing to WIN ===");
      const startRes = await fetchJson(`${BASE_URL}/api/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gridSize: 7, difficulty: "easy", forceNew: true })
      });
      
      console.log("Start res:", startRes.body);
      
      let gameSession = await GameSession.findById(startRes.body.gameId);
      const board = gameSession.board;
      const gridSize = gameSession.gridSize;
      const center = Math.floor(gridSize / 2);

      // Find path avoiding bombs using BFS
      const queue = [{ x: 0, y: 0, path: [] }];
      const visited = new Set(["0,0"]);
      let winningPath = [];

      while (queue.length > 0) {
        const { x, y, path } = queue.shift();
        
        if (x === center && y === center) {
          winningPath = path;
          break;
        }

        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
              visited.add(key);
              if (board[nx][ny].name !== "bomb") {
                queue.push({ x: nx, y: ny, path: [...path, [nx, ny]] });
              }
            }
          }
        }
      }

      console.log(`Found path of length ${winningPath.length} to the center.`);
      
      for (const [r, c] of winningPath) {
        if (r === 0 && c === 0) continue; // Skip starting tile
        const res = await fetchJson(`${BASE_URL}/api/game/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ row: r, col: c })
        });
        
        if (res.status !== 200) {
          console.error(`Reveal failed at ${r},${c}:`, res.body);
          continue;
        }

        if (res.body.game?.gameStatus === "won") {
          console.log(`🏆 Game WON! Revealed center dragon at (${r},${c}). Final HP: ${res.body.game.playerStats.hp}`);
          return;
        } else if (res.body.game?.gameStatus === "lost") {
          console.log("💀 Oops, lost while trying to win.");
          return;
        }
      }
    };

    const playToLose = async () => {
      console.log("\n=== Playing to LOSE ===");
      const startRes = await fetchJson(`${BASE_URL}/api/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gridSize: 7, difficulty: "easy", forceNew: true })
      });

      let gameSession = await GameSession.findById(startRes.body.gameId);
      const board = gameSession.board;
      const gridSize = gameSession.gridSize;

      // Just click adjacent tiles until we die
      const queue = [[0,0]];
      const visited = new Set(["0,0"]);
      
      while(queue.length > 0) {
        const [x, y] = queue.shift();
        
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push([nx, ny]);
              
              if (nx === 0 && ny === 0) continue;
              const res = await fetchJson(`${BASE_URL}/api/game/reveal`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ row: nx, col: ny })
              });

              if (res.status !== 200) {
                 continue;
              }

              if (res.body.game?.gameStatus === "lost") {
                console.log(`💀 Game LOST! Stepped on ${board[nx][ny].name} at (${nx},${ny}).`);
                return;
              } else if (res.body.game?.gameStatus === "won") {
                 console.log("🏆 Won while trying to lose.");
                 return;
              }
            }
          }
        }
      }
    };

    await playToWin();
    await playToLose();

    console.log("\n✅ All simulations finished successfully.");

  } catch (err) {
    console.error("Simulation failed:", err);
  } finally {
    serverProcess.kill();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runSimulations();

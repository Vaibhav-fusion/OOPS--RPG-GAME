import { spawn } from "child_process";

const SERVER_PORT = 4002;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const SERVER_READY_MESSAGE = "Server listening on port";
const SERVER_START_TIMEOUT_MS = 15000;

const waitForServer = (serverProcess) =>
  new Promise((resolve, reject) => {
    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Server did not start in time"));
      }
    }, SERVER_START_TIMEOUT_MS);

    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);
      if (text.includes(SERVER_READY_MESSAGE)) {
        started = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    serverProcess.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const body = await res.text().then((text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  });
  return { status: res.status, body, headers: res.headers };
};

const assertStatus = (response, expected, label) => {
  if (response.status !== expected) {
    throw new Error(
      `${label} expected status ${expected}, got ${response.status}: ${JSON.stringify(
        response.body,
      )}`,
    );
  }
};

const logStep = (index, title) =>
  console.log(`\n[STEP ${String(index).padStart(2, "0")}] ${title}`);

const startServer = async () => {
  const serverProcess = spawn("node", ["app.js"], {
    env: { ...process.env, PORT: String(SERVER_PORT), NODE_ENV: "test" },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForServer(serverProcess);
  return serverProcess;
};

const makeAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

const runAdvancedCheck = async () => {
  const serverProcess = await startServer();
  const createdUsers = [];
  try {
    const uniqueSuffix = String(Date.now()).slice(-5);
    const user = {
      username: `checkuser${uniqueSuffix}`,
      email: `checkuser+${uniqueSuffix}@example.com`,
      password: "Check1234!",
    };

    logStep(1, "Register new user");
    let response = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    assertStatus(response, 201, "Register");
    console.log("✅ registration succeeded", response.body);
    createdUsers.push(user.email);

    logStep(2, "Reject duplicate registration");
    response = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    assertStatus(response, 409, "Duplicate registration");
    console.log("✅ duplicate registration rejected", response.body);

    logStep(3, "Login with valid credentials");
    response = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    assertStatus(response, 200, "Login");
    const token = response.body.accessToken;
    if (!token) throw new Error("Login response did not include accessToken");
    console.log("✅ login succeeded, token received");

    logStep(4, "Reject login with wrong password");
    response = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "WrongPass!" }),
    });
    assertStatus(response, 401, "Invalid login");
    console.log("✅ invalid login rejected", response.body);

    logStep(5, "Start a game with invalid difficulty");
    response = await fetchJson(`${BASE_URL}/api/game/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ gridSize: 7, difficulty: "impossible" }),
    });
    assertStatus(response, 400, "Invalid game start");
    console.log("✅ invalid difficulty rejected", response.body);

    logStep(6, "Start first game session");
    response = await fetchJson(`${BASE_URL}/api/game/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ gridSize: 7, difficulty: "medium" }),
    });
    assertStatus(response, 201, "Game start");
    console.log("✅ game session started", response.body);
    const firstGameId = response.body.gameId;

    logStep(7, "Reuse active game session within 1 hour");
    response = await fetchJson(`${BASE_URL}/api/game/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ gridSize: 7, difficulty: "medium" }),
    });
    assertStatus(response, 201, "Game restart");
    if (response.body.gameId !== firstGameId) {
      throw new Error("Expected existing session to be reused");
    }
    console.log("✅ active session reused", response.body.gameId);

    logStep(8, "Fetch current game state");
    response = await fetchJson(`${BASE_URL}/api/game`, {
      method: "GET",
      headers: makeAuthHeader(token),
    });
    assertStatus(response, 200, "Get game");
    console.log("✅ game state fetched", {
      gameId: response.body.gameId,
      gridSize: response.body.gridSize,
      gameStatus: response.body.gameStatus,
      possibleToWin: response.body.possibleToWin,
    });

    logStep(9, "Reveal a safe starting tile");
    response = await fetchJson(`${BASE_URL}/api/game/reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ row: 0, col: 0 }),
    });
    assertStatus(response, 200, "Reveal first tile");
    console.log("✅ reveal action completed", response.body);

    logStep(10, "Reject repeated reveal on same tile");
    response = await fetchJson(`${BASE_URL}/api/game/reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ row: 0, col: 0 }),
    });
    assertStatus(response, 400, "Repeat reveal");
    console.log("✅ repeated reveal rejected", response.body);

    logStep(11, "Reject reveal with invalid coordinates");
    response = await fetchJson(`${BASE_URL}/api/game/reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...makeAuthHeader(token),
      },
      body: JSON.stringify({ row: -1, col: 999 }),
    });
    assertStatus(response, 400, "Invalid reveal coords");
    console.log("✅ invalid reveal rejected", response.body);

    logStep(12, "Query server health endpoint");
    response = await fetchJson(`${BASE_URL}/api/health`, { method: "GET" });
    assertStatus(response, 200, "Health check");
    console.log("✅ health endpoint is healthy", response.body);

    logStep(13, "Fetch leaderboard pages");
    response = await fetchJson(`${BASE_URL}/api/leaderboard`, {
      method: "GET",
    });
    assertStatus(response, 200, "Leaderboard");
    console.log("✅ leaderboard returned", {
      count: Array.isArray(response.body.leaderboard)
        ? response.body.leaderboard.length
        : 0,
    });

    response = await fetchJson(`${BASE_URL}/api/leaderboard/top10`, {
      method: "GET",
    });
    assertStatus(response, 200, "Top10 leaderboard");
    console.log("✅ top10 leaderboard returned", {
      count: Array.isArray(response.body.top10)
        ? response.body.top10.length
        : 0,
    });

    console.log("\n🎉 Advanced frontend simulation completed successfully.");
  } catch (error) {
    console.error("\n❌ Advanced check failed:", error.message);
    process.exitCode = 1;
  } finally {
    serverProcess.kill("SIGINT");
  }
};

runAdvancedCheck();

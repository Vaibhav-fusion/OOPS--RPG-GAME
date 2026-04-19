import { spawn } from "child_process";

const SERVER_PORT = 4001;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const SERVER_START_TIMEOUT_MS = 15000;

const waitForServer = (process) =>
  new Promise((resolve, reject) => {
    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Server did not start in time"));
      }
    }, SERVER_START_TIMEOUT_MS);

    process.stdout.on("data", (data) => {
      const message = data.toString();
      process.stdout.write(message);
      if (message.includes("Server listening on port")) {
        started = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    process.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    process.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
};

const runTests = async () => {
  const serverProcess = spawn("node", ["app.js"], {
    env: { ...process.env, PORT: String(SERVER_PORT), NODE_ENV: "test" },
    cwd: process.cwd(),
  });

  try {
    await waitForServer(serverProcess);

    const timestamp = Date.now();
    const uniqueSuffix = String(timestamp).slice(-4);
    const testEmail = `testuser+${uniqueSuffix}@example.com`;
    const testPassword = "TestPassword123";
    const username = `testusr${uniqueSuffix}`;

    console.log("\n1) Registering test user...");
    let response = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: testEmail,
        password: testPassword,
      }),
    });

    if (response.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(response.body)}`);
    }

    console.log("2) Logging in test user...");
    response = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    if (response.status !== 200 || !response.body.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }

    const token = response.body.accessToken;

    console.log("3) Starting a new game...");
    response = await fetchJson(`${BASE_URL}/api/game/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gridSize: 8, difficulty: "medium" }),
    });

    if (response.status !== 201) {
      throw new Error(`Game start failed: ${JSON.stringify(response.body)}`);
    }

    console.log("4) Fetching game state...");
    response = await fetchJson(`${BASE_URL}/api/game/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) {
      throw new Error(`Get game failed: ${JSON.stringify(response.body)}`);
    }

    console.log("5) Revealing initial tile...");
    response = await fetchJson(`${BASE_URL}/api/game/reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ row: 0, col: 0 }),
    });

    if (response.status !== 200) {
      throw new Error(`Reveal failed: ${JSON.stringify(response.body)}`);
    }

    console.log("6) Fetching leaderboard...");
    response = await fetchJson(`${BASE_URL}/api/leaderboard`, {
      method: "GET",
    });
    if (response.status !== 200) {
      throw new Error(
        `Leaderboard fetch failed: ${JSON.stringify(response.body)}`,
      );
    }

    console.log("7) Fetching top 10 leaderboard...");
    response = await fetchJson(`${BASE_URL}/api/leaderboard/top10`, {
      method: "GET",
    });
    if (response.status !== 200) {
      throw new Error(`Top10 fetch failed: ${JSON.stringify(response.body)}`);
    }

    console.log("\nAll tests passed successfully.");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  } finally {
    serverProcess.kill();
  }
};

runTests();

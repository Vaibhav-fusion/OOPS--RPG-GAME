async function test() {
  try {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@test.com`;
    const password = 'password123';
    
    console.log("Registering user:", email);
    await fetch('http://localhost:4002/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user${timestamp}`,
        email,
        password
      })
    });

    console.log("Login user:", email);
    const loginRes = await fetch('http://localhost:4002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password
      })
    });
    const login = await loginRes.json();
    const token = login.token;

    console.log("Starting game...");
    const startRes = await fetch('http://localhost:4002/api/game/start', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        difficulty: 'easy',
        forceNew: true
      })
    });
    const start = await startRes.json();
    
    console.log("START RESPONSE:", JSON.stringify(start, null, 2).substring(0, 500));

    const gameId = start.game.gameId;
    console.log("\nFetching game...");
    const getRes = await fetch('http://localhost:4002/api/game', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const get = await getRes.json();
    console.log("GET RESPONSE:", JSON.stringify(get, null, 2).substring(0, 500));

    console.log("\nRevealing tile (1,1)...");
    const revealRes = await fetch('http://localhost:4002/api/game/reveal', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        gameId,
        row: 1,
        col: 1
      })
    });
    const reveal = await revealRes.json();
    
    console.log("REVEAL RESPONSE:", JSON.stringify(reveal, null, 2).substring(0, 500));

  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

test();

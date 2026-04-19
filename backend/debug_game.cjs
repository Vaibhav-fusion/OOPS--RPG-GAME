const axios = require('axios');

async function test() {
  try {
    console.log("Registering user...");
    const reg = await axios.post('http://localhost:4000/api/auth/register', {
      username: 'debuguser123',
      email: 'debuguser123@test.com',
      password: 'password123'
    }).catch(e => e.response);

    let token = reg?.data?.token;

    if (!token) {
      console.log("Login user...");
      const login = await axios.post('http://localhost:4000/api/auth/login', {
        email: 'debuguser123@test.com',
        password: 'password123'
      });
      token = login.data.token;
    }

    console.log("Starting game...");
    const start = await axios.post('http://localhost:4000/api/game/start', {
      difficulty: 'easy',
      forceNew: true
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log("START RESPONSE:", JSON.stringify(start.data, null, 2));

    const gameId = start.data.game.gameId;
    console.log("Fetching game...");
    const get = await axios.get('http://localhost:4000/api/game', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("GET RESPONSE:", JSON.stringify(get.data, null, 2).substring(0, 300) + '...');

    console.log("Revealing tile (1,1)...");
    const reveal = await axios.post('http://localhost:4000/api/game/reveal', {
      gameId,
      row: 1,
      col: 1
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log("REVEAL RESPONSE:", JSON.stringify(reveal.data, null, 2).substring(0, 300) + '...');

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
  }
}

test();

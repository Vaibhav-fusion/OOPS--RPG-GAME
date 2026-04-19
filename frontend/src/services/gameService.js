import api from "./api.js";

export const gameService = {
  startGame: async (forceNew = false) => {
    const response = await api.post("/game/start", { forceNew });
    return response.data;
  },

  getActiveGame: async () => {
    try {
      const response = await api.get("/game");
      return response.data;
    } catch (error) {
      // No active game
      return null;
    }
  },

  getGame: async () => {
    const response = await api.get(`/game`);
    return response.data;
  },

  revealTile: async (row, col) => {
    const response = await api.post(`/game/reveal`, { row, col });
    return response.data;
  },

  levelUp: async () => {
    const response = await api.post(`/game/level-up`);
    return response.data;
  },

  getLeaderboard: async (limit = 10) => {
    const response = await api.get(`/leaderboard?limit=${limit}`);
    return response.data;
  },

  getTop10Leaderboard: async () => {
    const response = await api.get("/leaderboard/top10");
    return response.data;
  },
};

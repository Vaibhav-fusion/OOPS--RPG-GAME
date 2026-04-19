import { useState, useEffect } from "react";
import { gameService } from "../services/gameService.js";

export const useGame = (gameId) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGame = async () => {
    setLoading(true);
    try {
      const data = await gameService.getGame();
      setGame(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (x, y) => {
    setLoading(true);
    try {
      const data = await gameService.revealTile(x, y);
      setGame(data.game);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const startNewGame = async (forceNew = false) => {
    setLoading(true);
    try {
      const data = await gameService.startGame(forceNew);
      const gameData = data.game || data;
      setGame(gameData);
      setError(null);
      return gameData;
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw so caller can handle it
    } finally {
      setLoading(false);
    }
  };

  const getActiveGame = async () => {
    try {
      const data = await gameService.getActiveGame();
      return data;
    } catch (err) {
      return null;
    }
  };

  const levelUp = async () => {
    setLoading(true);
    try {
      const data = await gameService.levelUp();
      setGame(data.game);
      setError(null);
      return data.game;
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  return {
    game,
    loading,
    error,
    revealTile,
    startNewGame,
    levelUp,
    getActiveGame,
    refetch: fetchGame,
  };
};

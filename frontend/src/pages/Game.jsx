import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame.js";
import GameBoard from "../components/GameBoard.jsx";
import HUD from "../components/HUD.jsx";
import Loader from "../components/Loader.jsx";

const CLICK_COOLDOWN_MS = 240; // Adjustable rate-limit variable

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { game, loading, error, revealTile, startNewGame, levelUp } = useGame(id);

  const [flags, setFlags] = useState(new Set());
  const [canClick, setCanClick] = useState(true);

  const handleTileClick = (x, y) => {
    if (!canClick) return;
    if (flags.has(`${x},${y}`)) return;
    setCanClick(false);
    revealTile(x, y);
    setTimeout(() => setCanClick(true), CLICK_COOLDOWN_MS);
  };

  const handleFlagTile = (e, x, y) => {
    e.preventDefault();
    const flagKey = `${x},${y}`;
    setFlags((prev) => {
      const newFlags = new Set(prev);
      if (newFlags.has(flagKey)) newFlags.delete(flagKey);
      else newFlags.add(flagKey);
      return newFlags;
    });
  };

  const handleRestart = async () => {
    try {
      const newGame = await startNewGame(true);
      if (newGame && (newGame.gameId || newGame._id)) {
        navigate(`/game/${newGame.gameId || newGame._id}`);
      }
    } catch (err) {
      console.error("Failed to restart game:", err);
    }
  };

  const handleLevelUp = async () => {
    try {
      await levelUp();
    } catch (_err) {
      // Error is already surfaced by hook state
    }
  };

  if (loading && !game) return <Loader />;
  if (!game && !error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="rounded-xl border border-indigo-300/30 bg-slate-900/70 p-8 text-center text-white shadow-2xl">
          <p className="text-xl font-semibold">Preparing your dungeon...</p>
          <p className="mt-2 text-sm text-slate-300">
            If this takes long, return to dashboard and start a new run.
          </p>
        </div>
      </div>
    );

  const isGameOver =
    game && (game.gameStatus === "won" || game.gameStatus === "lost");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">
            🗡️ Dungeonsweeper 🛡️
          </h1>
          <p className="text-slate-300">
            Explore carefully. Reach and slay the center dragon to win.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300/50 bg-red-500/80 p-3 text-center font-bold text-white">
            {error}
          </div>
        )}

        {game && <HUD game={game} onLevelUp={handleLevelUp} levelUpLoading={loading} />}

        {game && (
          <GameBoard
            game={game}
            flags={flags}
            onTileClick={handleTileClick}
            onFlagTile={handleFlagTile}
            loading={loading || !canClick}
          />
        )}

        {isGameOver && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
            {game.gameStatus === "won" ? (
              <div>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  Victory! You conquered the dungeon!
                </h2>
                <p className="text-gray-600 mb-4">
                  You earned{" "}
                  <span className="font-bold text-indigo-600">
                    {game.playerStats.xp} XP
                  </span>{" "}
                  for your bravery!
                </p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold text-red-600 mb-2">
                  Game Over! The dungeon claimed you!
                </h2>
                <p className="text-gray-600 mb-4">
                  You fought bravely and earned{" "}
                  <span className="font-bold text-indigo-600">
                    {game.playerStats.xp} XP
                  </span>
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition duration-200 flex items-center"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition duration-200 flex items-center"
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;

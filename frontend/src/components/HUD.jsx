const HUD = ({ game, onLevelUp, levelUpLoading = false }) => {
  if (!game) return null;

  const maxHp = game.playerStats.maxHp || game.playerStats.hp || 1;
  const hpPercent = Math.max(0, Math.min(100, (game.playerStats.hp / maxHp) * 100));
  const levelUpCost = Math.max(1, game.playerStats.hp || 1);
  const canLevelUp = game.playerStats.xp >= levelUpCost && game.gameStatus === "ongoing";

  return (
    <div className="mb-6 rounded-2xl border border-indigo-300/30 bg-slate-900/70 p-6 text-white shadow-2xl backdrop-blur">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">❤️</span>
            <span className="text-xl font-bold">
              {game.playerStats.hp}/{maxHp}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-700">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">💎</span>
            <span className="text-xl font-bold">{game.playerStats.xp} XP</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">⭐</span>
            <span className="text-xl font-bold">
              Level {game.playerStats.level}
            </span>
          </div>
          <button
            type="button"
            onClick={onLevelUp}
            disabled={!canLevelUp || levelUpLoading}
            className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              canLevelUp && !levelUpLoading
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "cursor-not-allowed bg-slate-700 text-slate-300"
            }`}
          >
            ⬆️ Level Up ({levelUpCost} XP)
          </button>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">
              {game.gameStatus === "ongoing"
                ? "🎮"
                : game.gameStatus === "won"
                  ? "🏆"
                  : game.gameStatus === "lost"
                    ? "💀"
                    : "❓"}
            </span>
            <span className="text-xl font-bold capitalize">{game.gameStatus}</span>
          </div>
          <div className="text-sm text-slate-300 capitalize">
            dungeon mode • {game.gridSize}x{game.gridSize}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;

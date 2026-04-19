import { useState, useEffect } from "react";
import { gameService } from "../services/gameService.js";

const Top3Leaderboard = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const data = await gameService.getTop10Leaderboard();
        setTopPlayers(data.top10 ? data.top10.slice(0, 3) : []); // Show only top 3
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopPlayers();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🏆 Top Players</h3>
      <div className="space-y-3">
        {topPlayers.map((player, index) => (
          <div key={player._id} className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </span>
              <div>
                <div className="font-semibold text-gray-800">
                  {player.username}
                </div>
                <div className="text-sm text-gray-500">
                  Level {Math.floor(player.xp / 100) + 1}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-indigo-600">{player.xp} XP</div>
              <div className="text-sm text-gray-500">
                {player.gamesWon} wins
              </div>
            </div>
          </div>
        ))}
        {topPlayers.length === 0 && (
          <div className="text-center py-4 text-gray-500">No players yet</div>
        )}
      </div>
    </div>
  );
};

export default Top3Leaderboard;

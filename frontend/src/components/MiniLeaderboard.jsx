import { useState, useEffect } from "react";
import { gameService } from "../services/gameService.js";

const MiniLeaderboard = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const data = await gameService.getTop10Leaderboard();
        setTopPlayers(data.slice(0, 5)); // Show only top 5
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
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Top Players</h3>
      <div className="space-y-2">
        {topPlayers.map((player, index) => (
          <div
            key={player._id}
            className="flex justify-between items-center text-sm"
          >
            <div className="flex items-center">
              <span className="font-medium text-gray-600 mr-2">
                #{index + 1}
              </span>
              <span className="text-gray-800">{player.username}</span>
            </div>
            <span className="text-indigo-600 font-medium">{player.xp} XP</span>
          </div>
        ))}
        {topPlayers.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-2">
            No players yet
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniLeaderboard;

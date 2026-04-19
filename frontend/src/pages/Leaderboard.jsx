import { useState, useEffect } from "react";
import { gameService } from "../services/gameService.js";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../hooks/useAuth.js";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await gameService.getLeaderboard();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200">
          ❌ {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 Hall of Heroes
          </h1>
          <p className="text-gray-300">The greatest Dungeonsweeper champions</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
            <h2 className="text-2xl font-bold text-white text-center">
              Leaderboard
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user && entry.username === user.username;

              return (
                <div
                  key={entry._id}
                  className={`p-6 hover:bg-gray-50 transition duration-200 ${
                    isCurrentUser
                      ? "bg-yellow-50 border-l-4 border-yellow-400"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{getRankEmoji(rank)}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {entry.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Level {Math.floor(entry.totalXp / 100) + 1}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">
                            {entry.totalXp}
                          </div>
                          <div className="text-sm text-gray-600">💎 XP</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {entry.gamesWon}
                          </div>
                          <div className="text-sm text-gray-600">🏆 Wins</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Champions Yet
              </h3>
              <p className="text-gray-500">
                Be the first to claim victory in Dungeonsweeper!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

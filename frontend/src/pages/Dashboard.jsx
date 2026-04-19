import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useGame } from "../hooks/useGame.js";
import Loader from "../components/Loader.jsx";
import Top3Leaderboard from "../components/Top3Leaderboard.jsx";

const Dashboard = () => {
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { startNewGame, getActiveGame } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const checkActiveGame = async () => {
      try {
        const game = await getActiveGame();
        if (game) {
          setActiveGame(game);
        }
      } catch (error) {
        // No active session
      } finally {
        setLoading(false);
      }
    };
    checkActiveGame();
  }, []); // Remove getActiveGame from dependencies

  const handleStartGame = async () => {
    if (!user) {
      alert("You must be logged in to start a game. Redirecting to login...");
      navigate("/login");
      return;
    }

    try {
      const game = await startNewGame(true);
      if (game && game.gameId) {
        navigate(`/game/${game.gameId}`);
      } else {
        alert("Failed to start game: Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to start game:", error);
      alert(`Failed to start game: ${error.message || "Network error"}`);
    }
  };

  const handleContinueGame = () => {
    const id = activeGame?.gameId || activeGame?._id;
    if (id) {
      navigate(`/game/${id}`);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🗡️ Dungeonsweeper 🛡️
          </h1>
          <p className="text-gray-300">Welcome back, {user?.username}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                🎮 Game Actions
              </h2>

              {activeGame ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      🎯 Active Game Session
                    </h3>
                    <p className="text-yellow-700 text-sm mb-4">
                      You have an unfinished game. Continue where you left off!
                    </p>
                    <button
                      onClick={handleContinueGame}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                      🚀 Continue Game
                    </button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm mb-4">
                      Or start a fresh new game:
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Ready for a new adventure?
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
                  🗺️ Single Mode: Dungeon 11x11
                </div>
                <button
                  onClick={handleStartGame}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  🎲 Start New Game
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="lg:col-span-1">
            <Top3Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

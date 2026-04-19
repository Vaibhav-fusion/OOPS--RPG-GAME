import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold">
          Dungeonsweeper
        </Link>
        <div className="flex space-x-4">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-gray-300 transition">
                🏠 Dashboard
              </Link>
              <Link to="/profile" className="hover:text-gray-300 transition">
                👤 Profile
              </Link>
              <Link
                to="/leaderboard"
                className="hover:text-gray-300 transition"
              >
                🏆 Leaderboard
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-gray-300 transition"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300 transition">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

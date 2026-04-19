import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { profileService } from "../services/profileService.js";
import Loader from "../components/Loader.jsx";

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    avatarColor: "#3B82F6",
    avatarUrl: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setFormData({
          username: profile.username || "",
          displayName: profile.displayName || "",
          avatarColor: profile.avatarColor || "#3B82F6",
          avatarUrl: profile.avatarUrl || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const updatedProfile = await profileService.updateProfile(formData);

      // Update the auth context with new user data
      if (updatedProfile.username !== user.username) {
        // If username changed, we need to re-login or update token
        // For now, just show success message
      }

      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(
        "❌ " + (error.response?.data?.message || "Failed to update profile"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              👤 Profile Settings
            </h1>
            <p className="text-gray-600">
              Customize your Dungeonsweeper profile
            </p>
          </div>

          {/* Avatar Preview */}
          <div className="flex justify-center mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{
                backgroundColor: formData.avatarColor,
                backgroundImage: formData.avatarUrl
                  ? `url(${formData.avatarUrl})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!formData.avatarUrl &&
                formData.displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${message.includes("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your username"
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  3-20 characters, must be unique
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="How others see you"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional, shown in leaderboards
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎨 Avatar Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    name="avatarColor"
                    value={formData.avatarColor}
                    onChange={handleInputChange}
                    className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.avatarColor}
                    onChange={handleInputChange}
                    name="avatarColor"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    placeholder="#3B82F6"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hex color for your avatar background
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🖼️ Avatar Image URL
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional image URL (overrides color)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 disabled:opacity-50 flex items-center"
              >
                {saving ? <Loader /> : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

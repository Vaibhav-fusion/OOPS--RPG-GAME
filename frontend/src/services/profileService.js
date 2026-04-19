import api from "./api.js";

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data.user;
  },

  updateProfile: async (profileData) => {
    const response = await api.put("/profile", profileData);
    return response.data.user;
  },
};

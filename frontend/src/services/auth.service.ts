import api from "./api";
import { User, AuthTokens } from "@/types/api.types";

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post("/api/auth/login", { email, password });
    const { user, tokens } = response.data.data;

    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);

    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/api/auth/logout", { refreshToken });
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get("/api/auth/me");
    return response.data.data.user;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await api.patch("/api/auth/password", { currentPassword, newPassword });
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("accessToken");
  },
};

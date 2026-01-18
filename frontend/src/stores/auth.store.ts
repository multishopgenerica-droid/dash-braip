import { create } from "zustand";
import { User } from "@/types/api.types";
import { authService } from "@/services/auth.service";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { user } = await authService.login(email, password);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      if (!authService.isAuthenticated()) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

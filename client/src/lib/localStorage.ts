import type { User } from "@shared/schema";

const CURRENT_USER_KEY = 'securacert_current_user';

export interface LocalUser {
  id: number;
  username: string;
  email: string;
}

export const localStorage = {
  getCurrentUser(): LocalUser | null {
    try {
      const userData = window.localStorage.getItem(CURRENT_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: LocalUser): void {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  clearCurrentUser(): void {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  },

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
};

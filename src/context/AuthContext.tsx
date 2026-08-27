"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  hasPlacedOrder?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (user: User, isNewUser?: boolean) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (newUser: User, isNewUser: boolean = false) => {
    setUser(newUser);
    if (isNewUser) {
      toast.success(`Welcome to Mummy Food Hub, ${newUser.name}! 🎉`, {
        icon: '🎉',
        style: { borderRadius: '10px', background: '#3D261D', color: '#fff' }
      });
    } else {
      toast.success(`Welcome back, ${newUser.name}! 👋`, {
        icon: '👋',
        style: { borderRadius: '10px', background: '#3D261D', color: '#fff' }
      });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (e) {
      toast.error("Failed to logout");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

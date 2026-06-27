import React, { createContext, useContext, useState, useEffect } from "react";
import { User, ApiResponse } from "../types.js";
import ToastContainer, { ToastMessage, ToastType } from "../components/Toast.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  showToast: (message: string, type: ToastType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show dynamic toast helper
  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // On mount, load credentials from localStorage and check token profile with server
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("expense_tracker_token");
      const storedUser = localStorage.getItem("expense_tracker_user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Optionally, verify token freshness with the server
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          const result = await res.json() as ApiResponse<{ user: User }>;
          if (result.status === "success") {
            setUser(result.data.user);
            localStorage.setItem("expense_tracker_user", JSON.stringify(result.data.user));
          } else {
            // Token expired or invalid, clear state
            logout();
          }
        } catch (err) {
          console.error("Auth check failed", err);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json() as ApiResponse<{ token: string; user: User }>;

      if (result.status === "success") {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem("expense_tracker_token", result.data.token);
        localStorage.setItem("expense_tracker_user", JSON.stringify(result.data.user));
        showToast(result.message || "Logged in successfully!", "success");
        return true;
      } else {
        showToast(result.message || "Login failed", "error");
        return false;
      }
    } catch (err) {
      console.error("Login request error", err);
      showToast("Network error. Please try again later.", "error");
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await res.json() as ApiResponse<{ token: string; user: User }>;

      if (result.status === "success") {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem("expense_tracker_token", result.data.token);
        localStorage.setItem("expense_tracker_user", JSON.stringify(result.data.user));
        showToast(result.message || "Registration successful!", "success");
        return true;
      } else {
        showToast(result.message || "Sign up failed", "error");
        return false;
      }
    } catch (err) {
      console.error("Signup request error", err);
      showToast("Network error. Please try again later.", "error");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("expense_tracker_token");
    localStorage.removeItem("expense_tracker_user");
    setToken(null);
    setUser(null);
    showToast("Logged out successfully.", "success");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        showToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

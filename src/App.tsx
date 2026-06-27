import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import Sidebar from "./components/Sidebar.js";
import Login from "./pages/Login.js";
import Signup from "./pages/Signup.js";
import Dashboard from "./pages/Dashboard.js";
import AddExpense from "./pages/AddExpense.js";
import AdminUsers from "./pages/AdminUsers.js";
import { Loader2 } from "lucide-react";

// --- PROTECTED ROUTES LAYOUT ---
function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a full screen loading indicator during initial auth resolution
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
        <Loader2 className="h-10 w-10 text-brand-600 dark:text-brand-400 animate-spin mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Syncing secure connection...</p>
      </div>
    );
  }

  // Redirect to login if user is unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render Sidebar + active children content
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// --- PUBLIC ONLY ROUTE WRAPPER ---
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
        <Loader2 className="h-10 w-10 text-brand-600 dark:text-brand-400 animate-spin mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Verifying credentials...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Authenticated Application routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-expense" element={<AddExpense />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* Fallback routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

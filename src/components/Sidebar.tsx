import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useTheme } from "../context/ThemeContext.js";
import TrackSmartLogo from "./TrackSmartLogo.js";
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Wallet, 
  Menu, 
  X,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Sun,
  Moon
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem("sidebar-minimized");
    return saved === "true";
  });

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-minimized", String(next));
      return next;
    });
  };

  const isAdmin = user && (user.email.toLowerCase().trim() === "sandy0leymar@gmail.com" || user.email.toLowerCase().trim() === "sandy0leymar@gamil.com");

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Add Expense",
      path: "/add-expense",
      icon: PlusCircle,
    },
    ...(isAdmin ? [{
      name: "Manage Users",
      path: "/admin/users",
      icon: Users,
    }] : []),
  ];

  const SidebarContent = ({ minimized }: { minimized: boolean }) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand / Logo */}
      <div className={`p-5 border-b border-slate-800 flex items-center ${minimized ? "justify-center" : ""}`}>
        <TrackSmartLogo size={minimized ? "sm" : "md"} showText={!minimized} textClassName="text-white font-extrabold text-lg" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeSidebar}
            title={minimized ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl font-medium text-sm transition-all duration-200 ${
                minimized ? "justify-center p-3" : "gap-3 px-4 py-3"
              } ${
                isActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/15"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!minimized && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-2">
        {user && (
          <div 
            className={`flex items-center py-2 ${minimized ? "justify-center px-0" : "gap-3 px-2"} mb-1`} 
            title={minimized ? `${user.name} (${user.email})` : undefined}
          >
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
              <UserIcon className="h-4.5 w-4.5 text-slate-300" />
            </div>
            {!minimized && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-none mb-1">{user.name}</p>
                <p className="text-xs text-slate-400 truncate leading-none">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Global Dark Mode Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={minimized ? `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode` : undefined}
          className={`flex items-center text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            minimized ? "justify-center p-3 w-full" : "justify-between px-4 py-2.5 w-full"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {theme === "light" ? (
              <Sun className="h-5 w-5 shrink-0 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 shrink-0 text-indigo-400" />
            )}
            {!minimized && <span className="truncate">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>}
          </div>
          {!minimized && (
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${theme === "dark" ? "bg-brand-500" : "bg-slate-700"}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          )}
        </button>

        <button
          onClick={() => {
            closeSidebar();
            logout();
          }}
          title={minimized ? "Logout" : undefined}
          className={`flex items-center text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            minimized ? "justify-center p-3 w-full" : "gap-3 px-4 py-2.5 w-full"
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!minimized && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <TrackSmartLogo size="sm" showText={true} textClassName="text-white font-extrabold text-lg" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer mr-1"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-400" />
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Fixed left) */}
      <aside className={`hidden md:block h-screen sticky top-0 shrink-0 transition-all duration-300 relative ${isMinimized ? "w-[76px]" : "w-64"}`}>
        <SidebarContent minimized={isMinimized} />
        
        {/* Toggle button on desktop */}
        <button
          onClick={toggleMinimize}
          className="absolute top-[76px] -right-3.5 h-7 w-7 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg z-50 hover:bg-slate-800 hover:scale-105 transition-all duration-200"
          title={isMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar} />
        
        {/* Drawer container */}
        <div className={`absolute top-0 bottom-0 left-0 w-64 max-w-[80vw] z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent minimized={false} />
        </div>
      </div>
    </>
  );
}

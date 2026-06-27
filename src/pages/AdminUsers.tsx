import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Trash2, 
  RefreshCw, 
  IndianRupee, 
  FileSpreadsheet, 
  AlertTriangle,
  Search,
  User as UserIcon,
  ShieldAlert,
  Loader2,
  TrendingUp,
  Receipt,
  X,
  Plus
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";

interface UserStat {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalExpensesCount: number;
  totalAmountSpent: number;
}

const CATEGORY_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

export default function AdminUsers() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<UserStat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Check if the current user is an admin
  const isAdmin = user && (user.email.toLowerCase().trim() === "sandy0leymar@gmail.com" || user.email.toLowerCase().trim() === "sandy0leymar@gamil.com");

  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers();
    }
  }, [isAdmin, token]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.status === "success") {
        setUsers(result.data);
      } else {
        setError(result.message || "Failed to load user statistics");
      }
    } catch (err: any) {
      setError("An error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !token) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.status === "success") {
        showToast(`User ${userToDelete.name} deleted successfully!`);
        setUserToDelete(null);
        fetchUsers(); // Refresh stats
      } else {
        setDeleteError(result.message || "Failed to delete user");
      }
    } catch (err) {
      setDeleteError("Failed to delete user due to network or server error.");
    } finally {
      setIsDeleting(false);
    }
  };

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter users based on query
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Platform KPIs
  const totalUsers = users.length;
  const totalExpensesCount = users.reduce((sum, u) => sum + u.totalExpensesCount, 0);
  const totalAmountSpent = users.reduce((sum, u) => sum + u.totalAmountSpent, 0);
  const averageSpentPerUser = totalUsers > 0 ? totalAmountSpent / totalUsers : 0;

  // Prepare data for recharts
  const chartData = users
    .map(u => ({
      name: u.name,
      amount: u.totalAmountSpent,
      transactions: u.totalExpensesCount
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7); // Show top 7 users by spending

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 pointer-events-auto p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-white border-brand-100 text-brand-700"
          >
            <div className="p-1 bg-brand-50 rounded-lg">
              <Users className="h-5 w-5 text-brand-500" />
            </div>
            <div className="text-sm font-bold">{toastMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-brand-500" />
            Manage Users
          </h1>
          <p className="text-slate-500 text-sm mt-1">Platform administration panel and multi-user metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-brand-500" : ""}`} />
            <span className="text-xs font-bold md:inline hidden">Sync Registry</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-start gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Failed to retrieve admin statistics</h3>
            <p className="text-xs text-red-600/90 mt-1">{error}</p>
            <button 
              onClick={fetchUsers} 
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-brand-600 animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-bold animate-pulse">Analyzing user database registry...</p>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalUsers}</span>
              </div>
              <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalExpensesCount}</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Receipt className="h-5 w-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Volume Transacted</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  ₹{totalAmountSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <IndianRupee className="h-5 w-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Spent / User</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  ₹{averageSpentPerUser.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spending Bar Chart */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  Top User Expenditures (INR ₹)
                </h3>
                <div className="h-60 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                      <Tooltip 
                        formatter={(val) => [`₹${parseFloat(val as string).toFixed(2)}`, "Total Spent"]}
                        contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      />
                      <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={24}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transactions Share */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-slate-500" />
                  Activity Distribution (No. of Expenses)
                </h3>
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.transactions > 0)}
                        dataKey="transactions"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => [`${val} transactions`, "Count"]}
                        contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] font-bold text-slate-500">
                  {chartData.map((d, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></span>
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User List Table card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700">All Registered Users ({filteredUsers.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">Edit, inspect, or remove users and audit logs.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold">No users match your query</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">User Details</th>
                      <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Registered Date</th>
                      <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Transactions Count</th>
                      <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Total Spent</th>
                      <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isCurrentUser = user && u.id === user.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-extrabold text-xs shrink-0">
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800 truncate">{u.name}</span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[9px] font-extrabold">You</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 truncate block mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {u.totalExpensesCount} entries
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-950 text-xs">
                            ₹{u.totalAmountSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setUserToDelete(u)}
                                disabled={isCurrentUser}
                                className={`p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all ${
                                  isCurrentUser ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
                                }`}
                                title={isCurrentUser ? "You cannot delete your own account" : "Delete user and data"}
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setUserToDelete(null);
              }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Permanently Delete User?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This action is <span className="font-bold text-rose-600">irreversible</span>. You will permanently delete:
                  </p>
                </div>
              </div>

              {/* User details audit card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col gap-2.5 text-xs font-semibold mb-4 text-slate-500">
                <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                  <span>Name</span>
                  <span className="text-slate-800 font-bold">{userToDelete.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                  <span>Email</span>
                  <span className="text-slate-800 font-bold">{userToDelete.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                  <span>Transactions</span>
                  <span className="text-rose-500 font-bold">{userToDelete.totalExpensesCount} expenses</span>
                </div>
                <div className="flex justify-between">
                  <span>Funds Cleared</span>
                  <span className="text-rose-500 font-bold">₹{userToDelete.totalAmountSpent.toFixed(2)}</span>
                </div>
              </div>

              {deleteError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 border border-red-100 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 border border-slate-200 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Keep Account
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer hover:scale-[1.02]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Wiping Account...
                    </>
                  ) : (
                    "Confirm Wreak Wiping"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

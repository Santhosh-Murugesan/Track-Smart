import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useTheme } from "../context/ThemeContext.js";
import { Expense } from "../types.js";
import EditExpenseModal from "../components/EditExpenseModal.js";
import DeleteConfirmModal from "../components/DeleteConfirmModal.js";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Briefcase, 
  FileDown, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  PieChart as PieChartIcon, 
  History,
  TrendingDown,
  Percent,
  RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: "#f59e0b",         // Amber
  Transport: "#3b82f6",    // Blue
  Housing: "#6366f1",      // Indigo
  Healthcare: "#f43f5e",   // Rose
  Entertainment: "#a855f7",// Purple
  Shopping: "#ec4899",     // Pink
  Education: "#10b981",    // Emerald
  Work: "#64748b",         // Slate
  Travel: "#06b6d4",       // Cyan
  Utilities: "#f97316",    // Orange
  Others: "#14b8a6"        // Teal
};

const CATEGORY_EMOJIS: { [key: string]: string } = {
  Food: "🍔",
  Transport: "🚗",
  Housing: "🏠",
  Healthcare: "💊",
  Entertainment: "🎬",
  Shopping: "🛒",
  Education: "📚",
  Work: "💼",
  Travel: "✈️",
  Utilities: "🔧",
  Others: "💰"
};

export default function Dashboard() {
  const { token, showToast } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Filter States
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`; // Defaults to current Month
  });

  // Table Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allFilteredExpenses, setAllFilteredExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals / Action States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Sync date filter default value when period changes
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    if (period === "daily") {
      setDateFilter(`${yyyy}-${mm}-${dd}`);
    } else if (period === "monthly") {
      setDateFilter(`${yyyy}-${mm}`);
    } else if (period === "yearly") {
      setDateFilter(`${yyyy}`);
    }
    setPage(1); // Reset to page 1 on filter change
  }, [period]);

  // Load expenses based on current filters and pagination page
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/expenses?period=${period}&date=${dateFilter}&page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.status === "success") {
        setExpenses(result.data.expenses);
        setAllFilteredExpenses(result.data.allFilteredExpenses);
        setTotalCount(result.data.totalCount);
      } else {
        showToast(result.message || "Failed to retrieve expenses.", "error");
      }
    } catch (err) {
      console.error("Fetch expenses error:", err);
      showToast("Network error. Could not connect to API server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && dateFilter) {
      fetchExpenses();
    }
  }, [token, period, dateFilter, page]);

  // ---------------- COMPUTED KPI METRICS ----------------
  const kpis = useMemo(() => {
    // Total Expenses
    const total = allFilteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    // Highest Category Spending
    const categoryTotals: { [key: string]: number } = {};
    allFilteredExpenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    let highestCat = "N/A";
    let highestCatAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > highestCatAmount) {
        highestCat = cat;
        highestCatAmount = amt;
      }
    });

    // Average Daily Spend
    // Get unique dates
    const uniqueDates = new Set(allFilteredExpenses.map((e) => e.date));
    const uniqueDaysCount = uniqueDates.size || 1;
    const avgDailySpend = total / uniqueDaysCount;

    // Transaction Count
    const transactionCount = allFilteredExpenses.length;

    return {
      total,
      highestCat,
      highestCatAmount,
      avgDailySpend,
      transactionCount
    };
  }, [allFilteredExpenses]);

  // ---------------- CHART DATA CALCULATIONS ----------------
  // 1. Spending Over Time Chart
  const lineChartData = useMemo(() => {
    const dailyMap: { [key: string]: number } = {};
    
    allFilteredExpenses.forEach((exp) => {
      dailyMap[exp.date] = (dailyMap[exp.date] || 0) + exp.amount;
    });

    // Sort dates chronologically
    return Object.entries(dailyMap)
      .map(([date, amount]) => {
        // Pretty formatting (e.g. "2026-06-27" -> "27 Jun")
        let label = date;
        try {
          const d = new Date(date);
          const day = d.getDate();
          const month = d.toLocaleDateString("en-US", { month: "short" });
          label = `${day} ${month}`;
        } catch (_) {}
        return { date, rawDate: date, amount, label };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [allFilteredExpenses]);

  // 2. Category Pie Chart
  const pieChartData = useMemo(() => {
    const map: { [key: string]: number } = {};
    allFilteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CATEGORY_COLORS[name] || "#64748b"
    }));
  }, [allFilteredExpenses]);

  // 3. Category Comparison Horizontal Bar
  const comparisonChartData = useMemo(() => {
    const map: { [key: string]: number } = {};
    allFilteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
        color: CATEGORY_COLORS[category] || "#64748b"
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allFilteredExpenses]);

  // ---------------- SECURE CSV EXPORTER ----------------
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/expenses/export?period=${period}&date=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expenses_${period}_${dateFilter}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast("CSV report downloaded successfully!", "success");
      } else {
        showToast("Failed to download CSV export.", "error");
      }
    } catch (err) {
      console.error("Export CSV error", err);
      showToast("Connection error while exporting data.", "error");
    }
  };

  // ---------------- ACTION INLINE HANDLERS ----------------
  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async (id: string, updatedFields: { amount: number; category: string; description: string; date: string }) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const result = await res.json();
      if (result.status === "success") {
        showToast("Expense updated successfully!", "success");
        fetchExpenses(); // Refresh listings
        return true;
      } else {
        showToast(result.message || "Could not save edits.", "error");
        return false;
      }
    } catch (err) {
      console.error("Edit save error", err);
      showToast("Network error. Please try again.", "error");
      return false;
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.status === "success") {
        showToast("Expense record deleted.", "success");
        
        // Adjust page number if we deleted the last item on the page
        const remainingOnPage = expenses.length - 1;
        if (remainingOnPage === 0 && page > 1) {
          setPage(page - 1);
        } else {
          fetchExpenses();
        }
        return true;
      } else {
        showToast(result.message || "Failed to delete record.", "error");
        return false;
      }
    } catch (err) {
      console.error("Delete error", err);
      showToast("Network error.", "error");
      return false;
    }
  };

  // Last 5 Years for Dropdown Year Selector
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 0; i < 6; i++) {
      result.push(currentYear - i);
    }
    return result;
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 font-sans space-y-8">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Real-time analytics and transaction listings for your logged expenses.
          </p>
        </div>

        {/* Sync refresh button & CSV Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpenses}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={allFilteredExpenses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <FileDown className="h-4.5 w-4.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Period</span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/50">
            {(["daily", "monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  period === p ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input depending on active Period filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Calendar Date</span>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4.5 w-4.5" />
            </div>

            {period === "daily" && (
              <input
                type="date"
                value={dateFilter}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-500 transition-colors outline-none cursor-pointer"
              />
            )}

            {period === "monthly" && (
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-500 transition-colors outline-none cursor-pointer"
              />
            )}

            {period === "yearly" && (
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-500 transition-colors outline-none cursor-pointer appearance-none"
              >
                {years.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Spending */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              ₹{kpis.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <IndianRupee className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 2: Highest Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Highest Category</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block truncate max-w-[160px]">
              {kpis.highestCat !== "N/A" && CATEGORY_EMOJIS[kpis.highestCat]} {kpis.highestCat}
            </span>
            {kpis.highestCatAmount > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Total: ₹{kpis.highestCatAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 3: Average Daily Spend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Daily Spend</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              ₹{kpis.avgDailySpend.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 4: Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Transactions</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {kpis.transactionCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts Section */}
      {allFilteredExpenses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200/60 p-12 text-center rounded-2xl">
          <History className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-base">No Data Recorded for This Period</h4>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Log dynamic expenses under the **Add Expense** page to start tracking beautiful visual reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Spending Over Time Chart */}
          <div className="lg:col-span-8 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-brand-600" />
              <span>Spending Trend Over Time</span>
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip 
                    formatter={(val) => [`₹${parseFloat(val as string).toFixed(2)}`, "Expenses"]}
                    contentStyle={{ 
                      background: isDark ? "#0f172a" : "#ffffff", 
                      borderRadius: "12px", 
                      border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`, 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      color: isDark ? "#f8fafc" : "#0f172a"
                    }}
                    itemStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--color-brand-500)" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: isDark ? "#0f172a" : "#ffffff", strokeWidth: 2, fill: "var(--color-brand-500)" }} 
                    activeDot={{ r: 6, stroke: isDark ? "#0f172a" : "#ffffff", strokeWidth: 2, fill: "var(--color-brand-600)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Category Proportion Pie/Donut Chart */}
          <div className="lg:col-span-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-brand-600" />
              <span>Expenses by Category</span>
            </h3>
            <div className="h-72 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [`₹${parseFloat(val as string).toFixed(2)}`, "Total"]}
                    contentStyle={{ 
                      background: isDark ? "#0f172a" : "#ffffff", 
                      borderRadius: "12px", 
                      border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`, 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      color: isDark ? "#f8fafc" : "#0f172a"
                    }}
                    itemStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Comparison Side-by-side Horizontal Bar Chart */}
          <div className="lg:col-span-12 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Category Volume Comparison</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    formatter={(val) => [`₹${parseFloat(val as string).toFixed(2)}`, "Spent"]}
                    contentStyle={{ 
                      background: isDark ? "#0f172a" : "#ffffff", 
                      borderRadius: "12px", 
                      border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`, 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      color: isDark ? "#f8fafc" : "#0f172a"
                    }}
                    itemStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {comparisonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Expense Listing Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg">Transaction History</h3>
          <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-full">
            {totalCount} total entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Syncing financial records...</span>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                    No transactions matching this filter period.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-500 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5"
                        style={{
                          borderColor: `${CATEGORY_COLORS[exp.category]}30`,
                          backgroundColor: `${CATEGORY_COLORS[exp.category]}10`,
                          color: CATEGORY_COLORS[exp.category]
                        }}
                      >
                        <span>{CATEGORY_EMOJIS[exp.category]}</span>
                        <span>{exp.category}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(exp)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg cursor-pointer transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalCount > limit && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500 bg-slate-50/30">
            <div>
              Showing <span className="font-bold text-slate-800">{Math.min(totalCount, (page - 1) * limit + 1)}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(totalCount, page * limit)}</span> of{" "}
              <span className="font-bold text-slate-800">{totalCount}</span> records
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold shadow-xs">
                Page {page} of {Math.ceil(totalCount / limit)}
              </span>

              <button
                onClick={() => setPage(Math.min(Math.ceil(totalCount / limit), page + 1))}
                disabled={page === Math.ceil(totalCount / limit)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Expense Modal Dialog */}
      <EditExpenseModal
        isOpen={isEditOpen}
        expense={selectedExpense}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        expense={selectedExpense}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

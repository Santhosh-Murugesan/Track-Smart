import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { motion } from "motion/react";
import { 
  IndianRupee, 
  Calendar, 
  AlignLeft, 
  Plus, 
  Loader2 
} from "lucide-react";

interface CategoryOption {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bgActive: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: "Food", label: "Food", emoji: "🍔", color: "text-amber-600 border-amber-200 bg-amber-50", bgActive: "bg-amber-600 hover:bg-amber-700 text-white border-transparent" },
  { key: "Transport", label: "Transport", emoji: "🚗", color: "text-blue-600 border-blue-200 bg-blue-50", bgActive: "bg-blue-600 hover:bg-blue-700 text-white border-transparent" },
  { key: "Housing", label: "Housing", emoji: "🏠", color: "text-indigo-600 border-indigo-200 bg-indigo-50", bgActive: "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent" },
  { key: "Healthcare", label: "Healthcare", emoji: "💊", color: "text-rose-600 border-rose-200 bg-rose-50", bgActive: "bg-rose-600 hover:bg-rose-700 text-white border-transparent" },
  { key: "Entertainment", label: "Entertainment", emoji: "🎬", color: "text-purple-600 border-purple-200 bg-purple-50", bgActive: "bg-purple-600 hover:bg-purple-700 text-white border-transparent" },
  { key: "Shopping", label: "Shopping", emoji: "🛒", color: "text-pink-600 border-pink-200 bg-pink-50", bgActive: "bg-pink-600 hover:bg-pink-700 text-white border-transparent" },
  { key: "Education", label: "Education", emoji: "📚", color: "text-emerald-600 border-emerald-200 bg-emerald-50", bgActive: "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" },
  { key: "Work", label: "Work", emoji: "💼", color: "text-slate-600 border-slate-200 bg-slate-50", bgActive: "bg-slate-600 hover:bg-slate-700 text-white border-transparent" },
  { key: "Travel", label: "Travel", emoji: "✈️", color: "text-cyan-600 border-cyan-200 bg-cyan-50", bgActive: "bg-cyan-600 hover:bg-cyan-700 text-white border-transparent" },
  { key: "Utilities", label: "Utilities", emoji: "🔧", color: "text-orange-600 border-orange-200 bg-orange-50", bgActive: "bg-orange-600 hover:bg-orange-700 text-white border-transparent" },
  { key: "Others", label: "Others", emoji: "💰", color: "text-teal-600 border-teal-200 bg-teal-50", bgActive: "bg-teal-600 hover:bg-teal-700 text-white border-transparent" }
];

export default function AddExpense() {
  const { token, showToast } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const todayLocal = new Date();
    // Format to YYYY-MM-DD representing local calendar day
    const yyyy = todayLocal.getFullYear();
    const mm = String(todayLocal.getMonth() + 1).padStart(2, "0");
    const dd = String(todayLocal.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key === selectedCategory ? "" : key);
  };

  const validateForm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError("Amount must be a positive number greater than 0.");
      return false;
    }

    if (!selectedCategory) {
      setValidationError("Please select a category.");
      return false;
    }

    if (!description || description.trim().length === 0) {
      setValidationError("Please write a brief description of the expense.");
      return false;
    }

    if (description.length > 300) {
      setValidationError("Description is too long (maximum 300 characters).");
      return false;
    }

    if (!date) {
      setValidationError("Please select a date.");
      return false;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // allow today
    if (selectedDate > today) {
      setValidationError("Date cannot be in the future.");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category: selectedCategory,
          description: description.trim(),
          date
        })
      });

      const result = await res.json();
      if (result.status === "success") {
        showToast("Expense logged successfully!", "success");
        // Redirect to dashboard page on success
        navigate("/dashboard");
      } else {
        showToast(result.message || "Failed to log expense.", "error");
      }
    } catch (err) {
      console.error("Error creating expense:", err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Expense</h2>
        <p className="mt-1.5 text-sm text-slate-500 font-medium">
          Log your daily expenditures to maintain clear records and update analytics.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-slate-100 shadow-xl rounded-2xl p-6 md:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
              {validationError}
            </div>
          )}

          {/* Amount (Locked to INR ₹) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Expense Amount (INR ₹)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-10.5 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Category Pill Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2 py-1">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategorySelect(cat.key)}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? cat.bgActive + " scale-105 shadow-md shadow-brand-500/10"
                        : `${cat.color} hover:bg-opacity-80 hover:scale-[1.02]`
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">
                Description
              </label>
              <span className={`text-xs font-medium ${description.length > 280 ? "text-red-500" : "text-slate-400"}`}>
                {description.length} / 300 characters
              </span>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
                <AlignLeft className="h-5 w-5" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                required
                rows={3}
                placeholder="What did you purchase? (e.g. Weekly grocery stock, bus pass renewal...)"
                className="block w-full pl-10.5 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Transaction Date
            </label>
            <div className="relative rounded-xl shadow-sm max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full pl-10.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/15 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Logging expense...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Add Expense</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

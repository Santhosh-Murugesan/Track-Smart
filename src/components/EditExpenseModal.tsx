import React, { useState, useEffect } from "react";
import { Expense } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { X, IndianRupee, Calendar, AlignLeft, Loader2 } from "lucide-react";

interface EditExpenseModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (id: string, updatedData: { amount: number; category: string; description: string; date: string }) => Promise<boolean>;
}

const CATEGORIES = [
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

export default function EditExpenseModal({ isOpen, expense, onClose, onSave }: EditExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Update states whenever selected expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDescription(expense.description);
      setDate(expense.date);
      setError("");
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }
    if (!description || description.trim().length === 0) {
      setError("Description is required.");
      return;
    }
    if (description.length > 300) {
      setError("Description cannot exceed 300 characters.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      setError("Date cannot be in the future.");
      return;
    }

    setIsSaving(true);
    const success = await onSave(expense.id, {
      amount: numAmount,
      category,
      description: description.trim(),
      date
    });
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Edit Expense Record</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="block w-full pl-10.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5 py-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? cat.bgActive + " scale-105"
                          : `${cat.color} hover:bg-opacity-80`
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description
                </label>
                <span className={`text-[10px] font-semibold ${description.length > 285 ? "text-red-500" : "text-slate-400"}`}>
                  {description.length} / 300
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
                  rows={2}
                  placeholder="Purchase detail..."
                  className="block w-full pl-10.5 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="block w-full pl-10.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/15 flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

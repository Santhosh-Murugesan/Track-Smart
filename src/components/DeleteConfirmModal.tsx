import { useState } from "react";
import { Expense } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export default function DeleteConfirmModal({ isOpen, expense, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onConfirm(expense.id);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">Delete Expense Record?</h3>
              <p className="text-slate-500 text-sm mt-1">
                Are you sure you want to permanently delete this transaction? This action is irreversible.
              </p>

              {/* Item Details card */}
              <div className="mt-4 bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-400 font-semibold">Description</span>
                  <span className="text-slate-800 font-bold max-w-[180px] truncate">{expense.description}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-400 font-semibold">Category</span>
                  <span className="text-slate-800 font-bold">{expense.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-400 font-semibold">Amount</span>
                  <span className="text-slate-900 font-extrabold text-sm">₹{expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Date</span>
                  <span className="text-slate-800 font-bold">{expense.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/15 flex items-center gap-2 cursor-pointer transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                "Delete Record"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  allFilteredExpenses: Expense[];
  totalCount: number;
  page: number;
  limit: number;
}

import fs from "fs";
import path from "path";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  expenses: Expense[];
}

const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to load database with a fallback structure
function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDb: DatabaseSchema = { users: [], expenses: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading DB, returning empty schema", err);
    return { users: [], expenses: [] };
  }
}

// Helper to save database
function saveDb(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving DB", err);
  }
}

export const dbHelper = {
  // --- USERS ---
  getUsers(): User[] {
    return loadDb().users;
  },

  getAllExpenses(): Expense[] {
    return loadDb().expenses;
  },

  deleteUser(userId: string): boolean {
    const db = loadDb();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== userId);
    const userDeleted = db.users.length < initialLen;
    if (userDeleted) {
      db.expenses = db.expenses.filter(e => e.userId !== userId);
      saveDb(db);
    }
    return userDeleted;
  },

  findUserByEmail(email: string): User | undefined {
    const db = loadDb();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id: string): User | undefined {
    const db = loadDb();
    return db.users.find(u => u.id === id);
  },

  addUser(user: Omit<User, "id" | "createdAt">): User {
    const db = loadDb();
    const newUser: User = {
      ...user,
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },

  // --- EXPENSES ---
  getExpenses(userId: string): Expense[] {
    const db = loadDb();
    return db.expenses.filter(e => e.userId === userId);
  },

  addExpense(userId: string, expense: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">): Expense {
    const db = loadDb();
    const newExpense: Expense = {
      ...expense,
      id: "exp_" + Math.random().toString(36).substring(2, 11),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.expenses.push(newExpense);
    saveDb(db);
    return newExpense;
  },

  updateExpense(userId: string, id: string, updatedFields: Partial<Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">>): Expense | null {
    const db = loadDb();
    const index = db.expenses.findIndex(e => e.id === id && e.userId === userId);
    if (index === -1) return null;

    const current = db.expenses[index];
    const updated: Expense = {
      ...current,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    db.expenses[index] = updated;
    saveDb(db);
    return updated;
  },

  deleteExpense(userId: string, id: string): boolean {
    const db = loadDb();
    const initialLen = db.expenses.length;
    db.expenses = db.expenses.filter(e => !(e.id === id && e.userId === userId));
    const isDeleted = db.expenses.length < initialLen;
    if (isDeleted) {
      saveDb(db);
    }
    return isDeleted;
  }
};

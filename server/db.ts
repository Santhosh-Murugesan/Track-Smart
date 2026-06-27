import dotenv from "dotenv";
// Load environment variables immediately on module import
dotenv.config();

import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  limit,
  setLogLevel
} from "firebase/firestore";

// Silence internal gRPC connection reset warnings from @firebase/firestore
setLogLevel("silent");

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

// Dynamically read Firebase project settings
let dbConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    dbConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.error("Failed to read firebase-applet-config.json", err);
}

// Fallback to process.env variables if file-based keys are missing or undefined
dbConfig.projectId = dbConfig.projectId || process.env.FIREBASE_PROJECT_ID;
dbConfig.appId = dbConfig.appId || process.env.FIREBASE_APP_ID;
dbConfig.apiKey = dbConfig.apiKey || process.env.FIREBASE_API_KEY;
dbConfig.authDomain = dbConfig.authDomain || process.env.FIREBASE_AUTH_DOMAIN;
dbConfig.firestoreDatabaseId = dbConfig.firestoreDatabaseId || process.env.FIREBASE_FIRESTORE_DATABASE_ID;
dbConfig.storageBucket = dbConfig.storageBucket || process.env.FIREBASE_STORAGE_BUCKET;
dbConfig.messagingSenderId = dbConfig.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID;

// Initialize Firebase JS Client SDK
const firebaseConfig = {
  apiKey: dbConfig.apiKey,
  authDomain: dbConfig.authDomain,
  projectId: dbConfig.projectId,
  storageBucket: dbConfig.storageBucket,
  messagingSenderId: dbConfig.messagingSenderId,
  appId: dbConfig.appId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to prevent gRPC/WebSocket hangs in sandbox
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbConfig.firestoreDatabaseId);

// Test Firestore Connection on boot
async function testFirestoreConnection() {
  try {
    const q = query(collection(firestore, "users"), limit(1));
    await getDocs(q);
    console.log("Firestore Web Client SDK connection test: SUCCESS");
  } catch (err: any) {
    console.log("Firestore Web Client SDK connection test: FAILED.", err.message || err);
  }
}
testFirestoreConnection();

// --- LOCAL STORAGE FALLBACK ENGINE ---
const LOCAL_DB_PATH = path.join(process.cwd(), "db.json");

interface LocalDb {
  users: User[];
  expenses: Expense[];
}

function readLocalDb(): LocalDb {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read local db.json", err);
  }
  return { users: [], expenses: [] };
}

function writeLocalDb(data: LocalDb) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to local db.json", err);
  }
}

export const dbHelper = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(firestore, "users"));
      const users: User[] = [];
      snapshot.forEach(docSnap => {
        users.push(docSnap.data() as User);
      });
      return users;
    } catch (err: any) {
      console.warn("Firestore error in getUsers, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      return local.users;
    }
  },

  async getAllExpenses(): Promise<Expense[]> {
    try {
      const snapshot = await getDocs(collection(firestore, "expenses"));
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        expenses.push(docSnap.data() as Expense);
      });
      return expenses;
    } catch (err: any) {
      console.warn("Firestore error in getAllExpenses, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      return local.expenses;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return false;

      // Delete user document
      await deleteDoc(userRef);

      // Delete user's expenses
      const q = query(collection(firestore, "expenses"), where("userId", "==", userId));
      const expensesSnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      expensesSnapshot.forEach(docSnap => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      await Promise.all(deletePromises);

      // Sync local DB
      const local = readLocalDb();
      local.users = local.users.filter(u => u.id !== userId);
      local.expenses = local.expenses.filter(e => e.userId !== userId);
      writeLocalDb(local);

      return true;
    } catch (err: any) {
      console.warn("Firestore error in deleteUser, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      const userIndex = local.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;

      local.users.splice(userIndex, 1);
      local.expenses = local.expenses.filter(e => e.userId !== userId);
      writeLocalDb(local);
      return true;
    }
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(
        collection(firestore, "users"),
        where("email", "==", email.toLowerCase().trim()),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return undefined;
      return snapshot.docs[0].data() as User;
    } catch (err: any) {
      console.warn("Firestore error in findUserByEmail, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      return local.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    }
  },

  async findUserById(id: string): Promise<User | undefined> {
    try {
      const docRef = doc(firestore, "users", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return undefined;
      return docSnap.data() as User;
    } catch (err: any) {
      console.warn("Firestore error in findUserById, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      return local.users.find(u => u.id === id);
    }
  },

  async addUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = "usr_" + Math.random().toString(36).substring(2, 11);
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    newUser.email = newUser.email.toLowerCase().trim();

    try {
      await setDoc(doc(firestore, "users", id), newUser);
    } catch (err: any) {
      console.warn("Firestore error in addUser, falling back to local DB:", err.message || err);
    }

    // Always keep local DB in sync as a fallback
    const local = readLocalDb();
    local.users.push(newUser);
    writeLocalDb(local);

    return newUser;
  },

  // --- EXPENSES ---
  async getExpenses(userId: string): Promise<Expense[]> {
    try {
      const q = query(collection(firestore, "expenses"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        expenses.push(docSnap.data() as Expense);
      });
      return expenses;
    } catch (err: any) {
      console.warn("Firestore error in getExpenses, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      return local.expenses.filter(e => e.userId === userId);
    }
  },

  async addExpense(userId: string, expense: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Expense> {
    const id = "exp_" + Math.random().toString(36).substring(2, 11);
    const newExpense: Expense = {
      ...expense,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(firestore, "expenses", id), newExpense);
    } catch (err: any) {
      console.warn("Firestore error in addExpense, falling back to local DB:", err.message || err);
    }

    // Always keep local DB in sync as a fallback
    const local = readLocalDb();
    local.expenses.push(newExpense);
    writeLocalDb(local);

    return newExpense;
  },

  async updateExpense(userId: string, id: string, updatedFields: Partial<Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<Expense | null> {
    try {
      const docRef = doc(firestore, "expenses", id);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error("Doc not found in Firestore");
      }

      const current = docSnapshot.data() as Expense;
      if (current.userId !== userId) return null;

      const updated: Expense = {
        ...current,
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, updated);

      // Keep local in sync
      const local = readLocalDb();
      const index = local.expenses.findIndex(e => e.id === id);
      if (index !== -1) {
        local.expenses[index] = updated;
        writeLocalDb(local);
      }

      return updated;
    } catch (err: any) {
      console.warn("Firestore error in updateExpense, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      const index = local.expenses.findIndex(e => e.id === id);
      if (index === -1) return null;

      const current = local.expenses[index];
      if (current.userId !== userId) return null;

      const updated: Expense = {
        ...current,
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      local.expenses[index] = updated;
      writeLocalDb(local);
      return updated;
    }
  },

  async deleteExpense(userId: string, id: string): Promise<boolean> {
    try {
      const docRef = doc(firestore, "expenses", id);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error("Doc not found in Firestore");
      }

      const current = docSnapshot.data() as Expense;
      if (current.userId !== userId) return false;

      await deleteDoc(docRef);

      // Keep local in sync
      const local = readLocalDb();
      local.expenses = local.expenses.filter(e => e.id !== id);
      writeLocalDb(local);

      return true;
    } catch (err: any) {
      console.warn("Firestore error in deleteExpense, falling back to local DB:", err.message || err);
      const local = readLocalDb();
      const index = local.expenses.findIndex(e => e.id === id);
      if (index === -1) return false;

      const current = local.expenses[index];
      if (current.userId !== userId) return false;

      local.expenses.splice(index, 1);
      writeLocalDb(local);
      return true;
    }
  }
};

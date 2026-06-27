import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbHelper, Expense, User } from "./server/db.js";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-expense-tracker-key-2026";

// Middlewares
app.use(express.json());

// Consistent response helper
const jsonResponse = (res: any, status: "success" | "error", data: any = {}, message = "", code = 200) => {
  return res.status(code).json({
    status,
    data,
    message
  });
};

// ---------------- AUTHENTICATION MIDDLEWARE ----------------
interface AuthenticatedRequest extends express.Request {
  userId?: string;
  userEmail?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(res, "error", {}, "Authorization token required", 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return jsonResponse(res, "error", {}, "Invalid or expired authorization token", 401);
  }
};

// ---------------- ADMIN MIDDLEWARE & HELPER ----------------
const isAdminEmail = (email: string) => {
  const normalized = email.toLowerCase().trim();
  return normalized === "sandy0leymar@gmail.com" || normalized === "sandy0leymar@gamil.com";
};

const adminMiddleware = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    if (!req.userEmail || !isAdminEmail(req.userEmail)) {
      return jsonResponse(res, "error", {}, "Forbidden: Admin access required", 403);
    }
    next();
  } catch (err) {
    return jsonResponse(res, "error", {}, "Forbidden", 403);
  }
};

// ---------------- API ROUTES ----------------

// GET /api/admin/users - Admin: fetch all users with stats
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await dbHelper.getUsers();
    const allExpenses = await dbHelper.getAllExpenses();

    const userStats = users.map(user => {
      const userExpenses = allExpenses.filter(e => e.userId === user.id);
      const totalCount = userExpenses.length;
      const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalExpensesCount: totalCount,
        totalAmountSpent: totalSpent
      };
    });

    return jsonResponse(res, "success", userStats, "Users statistics fetched successfully");
  } catch (err: any) {
    console.error("Admin list users error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to fetch users", 500);
  }
});

// DELETE /api/admin/users/:id - Admin: delete user and their expenses
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      return jsonResponse(res, "error", {}, "You cannot delete your own admin account", 400);
    }

    const isDeleted = await dbHelper.deleteUser(id);
    if (!isDeleted) {
      return jsonResponse(res, "error", {}, "User not found", 404);
    }

    return jsonResponse(res, "success", {}, "User and all of their expenses deleted successfully");
  } catch (err: any) {
    console.error("Admin delete user error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to delete user", 500);
  }
});

// POST /auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return jsonResponse(res, "error", {}, "Name, email, and password are required", 400);
    }

    if (password.length < 6) {
      return jsonResponse(res, "error", {}, "Password must be at least 6 characters long", 400);
    }

    const existingUser = await dbHelper.findUserByEmail(email);
    if (existingUser) {
      return jsonResponse(res, "error", {}, "An account with this email already exists", 400);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await dbHelper.addUser({
      name,
      email,
      passwordHash
    });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    return jsonResponse(res, "success", {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    }, "Registration successful!", 201);
  } catch (err: any) {
    console.error("Register error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to register user", 500);
  }
});

// POST /auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return jsonResponse(res, "error", {}, "Email and password are required", 400);
    }

    const user = await dbHelper.findUserByEmail(email);
    if (!user) {
      return jsonResponse(res, "error", {}, "Invalid email or password", 401);
    }

    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return jsonResponse(res, "error", {}, "Invalid email or password", 401);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return jsonResponse(res, "success", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, "Logged in successfully!");
  } catch (err: any) {
    console.error("Login error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to log in", 500);
  }
});

// POST /auth/logout (Simply acknowledge; token removal is completed on client)
app.post("/api/auth/logout", authMiddleware, (req, res) => {
  return jsonResponse(res, "success", {}, "Logged out successfully");
});

// GET /api/auth/me (Get profile of logged-in user)
app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await dbHelper.findUserById(req.userId!);
    if (!user) {
      return jsonResponse(res, "error", {}, "User not found", 404);
    }
    return jsonResponse(res, "success", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err: any) {
    return jsonResponse(res, "error", {}, err.message || "Failed to fetch profile", 500);
  }
});

const ALLOWED_CATEGORIES = [
  "Food", "Transport", "Housing", "Healthcare", "Entertainment",
  "Shopping", "Education", "Work", "Travel", "Utilities", "Others"
];

// POST /expenses - Create expense
app.post("/api/expenses", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, category, description, date } = req.body;

    // Validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return jsonResponse(res, "error", {}, "Amount must be a numeric value greater than 0", 400);
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return jsonResponse(res, "error", {}, `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`, 400);
    }

    if (!description || description.trim().length === 0) {
      return jsonResponse(res, "error", {}, "Description is required", 400);
    }

    if (description.length > 300) {
      return jsonResponse(res, "error", {}, "Description cannot exceed 300 characters", 400);
    }

    if (!date) {
      return jsonResponse(res, "error", {}, "Date is required", 400);
    }

    // Validate date is not in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // allow today
    if (selectedDate > today) {
      return jsonResponse(res, "error", {}, "Date cannot be in the future", 400);
    }

    const newExpense = await dbHelper.addExpense(req.userId!, {
      amount: parsedAmount,
      category,
      description: description.trim(),
      date
    });

    return jsonResponse(res, "success", newExpense, "Expense added successfully!", 201);
  } catch (err: any) {
    console.error("Add expense error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to add expense", 500);
  }
});

// GET /expenses - List expenses with filtering and pagination
app.get("/api/expenses", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const period = req.query.period as string; // daily, monthly, yearly
    const dateQuery = req.query.date as string; // YYYY-MM-DD, YYYY-MM, YYYY
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let userExpenses = await dbHelper.getExpenses(userId);

    // Sort by date descending (newest first), then by id descending
    userExpenses.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return b.id.localeCompare(a.id);
    });

    // Apply filters
    let filteredExpenses = [...userExpenses];
    if (period && dateQuery) {
      if (period === "daily") {
        filteredExpenses = userExpenses.filter(e => e.date === dateQuery);
      } else if (period === "monthly") {
        // dateQuery format should be YYYY-MM
        filteredExpenses = userExpenses.filter(e => e.date.startsWith(dateQuery));
      } else if (period === "yearly") {
        // dateQuery format should be YYYY
        filteredExpenses = userExpenses.filter(e => e.date.startsWith(dateQuery));
      }
    }

    // Paginate
    const totalCount = filteredExpenses.length;
    const startIndex = (page - 1) * limit;
    const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + limit);

    return jsonResponse(res, "success", {
      expenses: paginatedExpenses,
      allFilteredExpenses: filteredExpenses, // Needed by front-end charts to render active dashboard filters seamlessly
      totalCount,
      page,
      limit
    }, "Expenses retrieved successfully");
  } catch (err: any) {
    console.error("List expenses error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to retrieve expenses", 500);
  }
});

// PUT /expenses/{id} - Update expense
app.put("/api/expenses/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { amount, category, description, date } = req.body;

    // Validate if fields are sent
    const updatedFields: Partial<Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">> = {};

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return jsonResponse(res, "error", {}, "Amount must be a numeric value greater than 0", 400);
      }
      updatedFields.amount = parsedAmount;
    }

    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return jsonResponse(res, "error", {}, `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`, 400);
      }
      updatedFields.category = category;
    }

    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        return jsonResponse(res, "error", {}, "Description is required", 400);
      }
      if (description.length > 300) {
        return jsonResponse(res, "error", {}, "Description cannot exceed 300 characters", 400);
      }
      updatedFields.description = description.trim();
    }

    if (date !== undefined) {
      if (!date) {
        return jsonResponse(res, "error", {}, "Date is required", 400);
      }
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        return jsonResponse(res, "error", {}, "Date cannot be in the future", 400);
      }
      updatedFields.date = date;
    }

    const updatedExpense = await dbHelper.updateExpense(userId, id, updatedFields);
    if (!updatedExpense) {
      return jsonResponse(res, "error", {}, "Expense not found or unauthorized", 404);
    }

    return jsonResponse(res, "success", updatedExpense, "Expense updated successfully!");
  } catch (err: any) {
    console.error("Update expense error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to update expense", 500);
  }
});

// DELETE /expenses/{id} - Delete expense
app.delete("/api/expenses/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const isDeleted = await dbHelper.deleteExpense(userId, id);
    if (!isDeleted) {
      return jsonResponse(res, "error", {}, "Expense not found or unauthorized", 404);
    }

    return jsonResponse(res, "success", {}, "Expense deleted successfully!");
  } catch (err: any) {
    console.error("Delete expense error:", err);
    return jsonResponse(res, "error", {}, err.message || "Failed to delete expense", 500);
  }
});

// GET /expenses/export - Return CSV
app.get("/api/expenses/export", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || "all";
    const dateQuery = req.query.date as string;

    let userExpenses = await dbHelper.getExpenses(userId);
    userExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let filtered = [...userExpenses];
    if (period !== "all" && dateQuery) {
      if (period === "daily") {
        filtered = userExpenses.filter(e => e.date === dateQuery);
      } else if (period === "monthly") {
        filtered = userExpenses.filter(e => e.date.startsWith(dateQuery));
      } else if (period === "yearly") {
        filtered = userExpenses.filter(e => e.date.startsWith(dateQuery));
      }
    }

    // Helper to safely format CSV values (escape quotes and commas)
    const escapeCsvValue = (val: string) => {
      const formatted = val.replace(/"/g, '""');
      if (formatted.includes(",") || formatted.includes("\n") || formatted.includes('"')) {
        return `"${formatted}"`;
      }
      return formatted;
    };

    // CSV Headers
    const headers = ["ID", "Date", "Category", "Amount", "Description", "Created At"];
    const csvLines = [headers.join(",")];

    filtered.forEach(exp => {
      const line = [
        exp.id,
        exp.date,
        escapeCsvValue(exp.category),
        exp.amount,
        escapeCsvValue(exp.description),
        exp.createdAt
      ];
      csvLines.push(line.join(","));
    });

    const csvContent = csvLines.join("\r\n");

    const filename = `expenses_${period}_${dateQuery || "all"}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error("Export CSV error:", err);
    return res.status(500).send("Failed to export CSV: " + err.message);
  }
});

// ---------------- VITE / FRONTEND INTEGRATION ----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

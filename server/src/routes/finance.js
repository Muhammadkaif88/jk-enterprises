import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";

export const financeRouter = Router();

financeRouter.get("/", authorize("manager"), (req, res) => {
  const db = readDb();
  res.json(db.finance);
});

financeRouter.get("/summary", authorize("manager"), (req, res) => {
  const db = readDb();
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);

  function sumLogs(items, type) {
    return items
      .filter((entry) => entry.transactionType === type)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
  }

  const todayLogs = db.finance.filter((entry) => (entry.entryDate || entry.createdAt.slice(0, 10)) === todayKey);
  const monthLogs = db.finance.filter((entry) => (entry.entryDate || entry.createdAt.slice(0, 10)).startsWith(monthKey));

  res.json({
    today: {
      income: sumLogs(todayLogs, "income"),
      purchase: sumLogs(todayLogs, "purchase"),
      expense: sumLogs(todayLogs, "expense"),
      profit: sumLogs(todayLogs, "income") - sumLogs(todayLogs, "purchase") - sumLogs(todayLogs, "expense")
    },
    month: {
      income: sumLogs(monthLogs, "income"),
      purchase: sumLogs(monthLogs, "purchase"),
      expense: sumLogs(monthLogs, "expense"),
      profit: sumLogs(monthLogs, "income") - sumLogs(monthLogs, "purchase") - sumLogs(monthLogs, "expense")
    },
    recentExpenses: db.finance
      .filter((entry) => entry.transactionType === "expense")
      .slice(0, 5)
  });
});

financeRouter.post("/", authorize("manager"), (req, res) => {
  const db = readDb();
  const log = {
    id: nextId(db.finance),
    transactionType: req.body.transactionType,
    amount: Number(req.body.amount || 0),
    description: req.body.description,
    category: req.body.category || "General",
    entryDate: req.body.entryDate || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  db.finance.unshift(log);

  if (log.transactionType === "purchase" && req.body.inventoryId) {
    const inventoryItem = db.inventory.find((item) => item.id === Number(req.body.inventoryId));
    if (inventoryItem) {
      inventoryItem.stockQty += Number(req.body.receivedQty || 0);
    }
  }

  writeDb(db);
  res.status(201).json(log);
});

financeRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const log = db.finance.find((entry) => entry.id === Number(req.params.id));
  if (!log) {
    return res.status(404).json({ message: "Finance record not found." });
  }
  Object.assign(log, {
    transactionType: req.body.transactionType ?? log.transactionType,
    amount: req.body.amount !== undefined ? Number(req.body.amount) : log.amount,
    description: req.body.description ?? log.description,
    category: req.body.category ?? log.category,
    entryDate: req.body.entryDate ?? log.entryDate
  });
  writeDb(db);
  res.json(log);
});

financeRouter.delete("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.finance = db.finance.filter((entry) => entry.id !== id);
  writeDb(db);
  res.status(204).send();
});

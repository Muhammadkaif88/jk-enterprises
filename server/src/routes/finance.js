import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const financeRouter = Router();

financeRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const active = db.finance.filter((entry) => !entry.isDeleted);
  res.json(scopeRecords(active, getRequestedCompanyId(req)));
});

financeRouter.get("/summary", authorize("technician"), (req, res) => {
  const db = readDb();
  const allFinance = db.finance.filter((entry) => !entry.isDeleted);
  const scopedFinance = scopeRecords(allFinance, getRequestedCompanyId(req));
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);

  function sumLogs(items, type) {
    return items
      .filter((entry) => entry.transactionType === type)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
  }

  const todayLogs = scopedFinance.filter((entry) => (entry.entryDate || entry.createdAt.slice(0, 10)) === todayKey);
  const monthLogs = scopedFinance.filter((entry) => (entry.entryDate || entry.createdAt.slice(0, 10)).startsWith(monthKey));

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
    recentExpenses: scopedFinance
      .filter((entry) => entry.transactionType === "expense")
      .slice(0, 5)
  });
});

financeRouter.post("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before logging accounting entries." });
  }
  const log = {
    id: nextId(db.finance),
    companyId: company.id,
    companyName: company.name,
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

financeRouter.put("/:id", authorize("technician"), (req, res) => {
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

financeRouter.delete("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  const entry = db.finance.find((entry) => entry.id === id);
  
  if (!entry) {
    return res.status(404).json({ message: "Finance record not found." });
  }
  
  entry.isDeleted = true;
  entry.deletedAt = new Date().toISOString();
  entry.deletedBy = req.body.email || "system";
  writeDb(db);
  res.status(204).send();
});

import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { readDb } from "../data/store.js";

export const overviewRouter = Router();

overviewRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const revenue = db.finance
    .filter((entry) => entry.transactionType === "income")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const purchases = db.finance
    .filter((entry) => entry.transactionType === "purchase")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = db.finance
    .filter((entry) => entry.transactionType === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  res.json({
    totals: {
      revenue,
      purchases,
      expenses,
      profit: revenue - purchases - expenses
    },
    lowStock: db.inventory.filter((item) => item.stockQty <= item.lowStockThreshold),
    activeProjects: db.projects.filter((project) => project.status !== "delivered").length,
    notesAwaitingConversion: db.notes.filter((note) => !note.isConverted).length,
    presentToday: db.attendanceLogs.filter((entry) => entry.date === new Date().toISOString().slice(0, 10) && entry.status === "Present").length,
    openDoubts: db.doubtClearance.filter((entry) => entry.status !== "Resolved").length,
    openComplaints: db.complaints.filter((entry) => entry.status !== "Closed").length
  });
});

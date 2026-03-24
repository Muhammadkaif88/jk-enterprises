import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { readDb } from "../data/store.js";
import { getRequestedCompanyId, scopeRecords } from "../services/companyScope.js";

export const overviewRouter = Router();

function buildTotals(items) {
  const revenue = items
    .filter((entry) => entry.transactionType === "income")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const purchases = items
    .filter((entry) => entry.transactionType === "purchase")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = items
    .filter((entry) => entry.transactionType === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  return {
    revenue,
    purchases,
    expenses,
    profit: revenue - purchases - expenses
  };
}

function bucketByPeriod(items, formatKey) {
  const totals = new Map();

  for (const entry of items) {
    const rawDate = entry.entryDate || entry.createdAt?.slice(0, 10);
    if (!rawDate) continue;
    const key = formatKey(rawDate);
    const current = totals.get(key) || { label: key, profit: 0, expenses: 0 };
    const amount = Number(entry.amount || 0);

    if (entry.transactionType === "income") current.profit += amount;
    if (entry.transactionType === "purchase" || entry.transactionType === "expense") {
      current.profit -= amount;
      current.expenses += amount;
    }
    totals.set(key, current);
  }

  return Array.from(totals.values()).sort((a, b) => a.label.localeCompare(b.label));
}

overviewRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  const finance = scopeRecords(db.finance, companyId);
  const inventory = scopeRecords(db.inventory, companyId);
  const projects = scopeRecords(db.projects, companyId);
  const notes = scopeRecords(db.notes, companyId);
  const attendance = scopeRecords(db.attendanceLogs, companyId);
  const doubts = scopeRecords(db.doubtClearance, companyId);
  const complaints = scopeRecords(db.complaints, companyId);

  const totals = buildTotals(finance);
  const companyBreakdown = db.companies.map((company) => ({
    ...company,
    ...buildTotals(db.finance.filter((entry) => Number(entry.companyId) === company.id))
  }));
  const monthlyTrend = bucketByPeriod(finance, (date) => date.slice(0, 7));
  const yearlyTrend = bucketByPeriod(finance, (date) => date.slice(0, 4));

  res.json({
    totals,
    lowStock: inventory.filter((item) => item.stockQty <= item.lowStockThreshold),
    activeProjects: projects.filter((project) => project.status !== "delivered").length,
    notesAwaitingConversion: notes.filter((note) => !note.isConverted).length,
    presentToday: attendance.filter((entry) => entry.date === new Date().toISOString().slice(0, 10) && entry.status === "Present").length,
    openDoubts: doubts.filter((entry) => entry.status !== "Resolved").length,
    openComplaints: complaints.filter((entry) => entry.status !== "Closed").length,
    companyBreakdown,
    monthlyTrend,
    yearlyTrend
  });
});

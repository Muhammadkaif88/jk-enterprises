import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const investmentsRouter = Router();

investmentsRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  const company = db.companies.find(c => c.id === Number(companyId));
  
  // Calculate current month profit
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const currentMonthFinance = db.finance.filter(f => 
    f.companyId === Number(companyId) && 
    (f.createdAt || "").startsWith(currentMonthStr)
  );
  
  const revenue = currentMonthFinance.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + f.amount, 0);
  const expenses = currentMonthFinance.filter(f => f.transactionType !== 'income').reduce((sum, f) => sum + f.amount, 0);
  const netProfit = revenue - expenses;

  const active = (db.investments || []).filter((entry) => !entry.isDeleted);
  const scoped = scopeRecords(active, companyId);

  const results = scoped.map(inv => {
    const transactions = (db.investorTransactions || []).filter(t => t.investorId === inv.id);
    const totalInvested = transactions.filter(t => t.type === 'Investment In').reduce((sum, t) => sum + t.amount, 0);
    const totalPayouts = transactions.filter(t => t.type === 'Profit Payout Out').reduce((sum, t) => sum + t.amount, 0);
    
    const companyValuation = company?.totalValuation || 10000000;
    const equityPct = totalInvested > 0 ? (totalInvested / companyValuation) * 100 : 0;
    const monthlyProfitShare = netProfit > 0 ? netProfit * (equityPct / 100) : 0;
    const cumulativeROI = totalInvested > 0 ? (totalPayouts / totalInvested) * 100 : 0;

    return {
      ...inv,
      investedFund: totalInvested,
      returnedFund: totalPayouts,
      equityPct: Number(equityPct.toFixed(2)),
      monthlyProfitShare: Math.round(monthlyProfitShare),
      cumulativeROI: Number(cumulativeROI.toFixed(1)),
      netProfitForMonth: netProfit
    };
  });

  res.json(results);
});

investmentsRouter.post("/transaction", authorize("manager"), (req, res) => {
  const { investorId, type, amount, method, upiId, transactionId, receiptNumber, date } = req.body;
  if (!investorId || !amount) return res.status(400).json({ message: "Investor ID and amount required" });

  const db = readDb();
  const investor = db.investments.find(i => i.id === Number(investorId));
  if (!investor) return res.status(404).json({ message: "Investor not found" });

  const txId = nextId(db.investorTransactions || []);
  const transaction = {
    id: txId,
    investorId: Number(investorId),
    type,
    amount: Number(amount),
    method,
    upiId: upiId || "",
    transactionId: transactionId || "",
    receiptNumber: receiptNumber || "",
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  db.investorTransactions = db.investorTransactions || [];
  db.investorTransactions.unshift(transaction);

  // Sync with main ledger (finance)
  const financeEntry = {
    id: nextId(db.finance),
    companyId: investor.companyId,
    companyName: investor.companyName,
    transactionType: type === 'Investment In' ? 'income' : 'expense',
    amount: Number(amount),
    description: `Investor ${type}: ${investor.investorName} (${method}${method === 'UPI' ? ': ' + upiId : ''})`,
    category: 'Investment',
    createdAt: new Date().toISOString()
  };
  db.finance.push(financeEntry);

  writeDb(db);
  res.status(201).json({ transaction, financeEntry });
});

investmentsRouter.post("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before logging investment details." });
  }

  const record = {
    id: nextId(db.investments || []),
    companyId: company.id,
    companyName: company.name,
    investorName: req.body.investorName,
    contactNumber: req.body.contactNumber || "",
    investedFund: Number(req.body.investedFund || 0),
    returnedFund: Number(req.body.returnedFund || 0),
    investedDate: req.body.investedDate || new Date().toISOString().slice(0, 10),
    returnDate: req.body.returnDate || "",
    notes: req.body.notes || ""
  };

  db.investments = db.investments || [];
  db.investments.unshift(record);
  writeDb(db);
  res.status(201).json(record);
});

investmentsRouter.put("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const record = (db.investments || []).find((entry) => entry.id === Number(req.params.id));
  if (!record) {
    return res.status(404).json({ message: "Investment record not found." });
  }

  Object.assign(record, {
    investorName: req.body.investorName ?? record.investorName,
    contactNumber: req.body.contactNumber ?? record.contactNumber,
    investedFund: req.body.investedFund !== undefined ? Number(req.body.investedFund) : record.investedFund,
    returnedFund: req.body.returnedFund !== undefined ? Number(req.body.returnedFund) : record.returnedFund,
    investedDate: req.body.investedDate ?? record.investedDate,
    returnDate: req.body.returnDate ?? record.returnDate,
    notes: req.body.notes ?? record.notes
  });

  writeDb(db);
  res.json(record);
});

investmentsRouter.get("/:id/transactions", authorize("technician"), (req, res) => {
  const db = readDb();
  const transactions = (db.investorTransactions || []).filter(t => t.investorId === Number(req.params.id));
  res.json(transactions);
});

investmentsRouter.delete("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const record = (db.investments || []).find((entry) => entry.id === Number(req.params.id));
  if (!record) {
    return res.status(404).json({ message: "Investment record not found." });
  }
  record.isDeleted = true;
  record.deletedAt = new Date().toISOString();
  record.deletedBy = req.body.email || "system";
  writeDb(db);
  res.status(204).send();
});

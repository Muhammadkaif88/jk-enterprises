import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const investmentsRouter = Router();

investmentsRouter.get("/", authorize("investor"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  
  // Calculate current month profit
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const currentMonthFinance = db.finance.filter(f => 
    (companyId === "all" || f.companyId === Number(companyId)) && 
    (f.createdAt || "").startsWith(currentMonthStr)
  );
  
  const revenue = currentMonthFinance.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + f.amount, 0);
  const expenses = currentMonthFinance.filter(f => f.transactionType !== 'income').reduce((sum, f) => sum + f.amount, 0);
  const netProfit = revenue - expenses;

  const active = (db.investments || []).filter((entry) => !entry.isDeleted);
  const scoped = scopeRecords(active, companyId);

  const results = scoped.map(inv => {
    // We use the manually set values, falling back to 0
    const explicitInvested = Number(inv.investedFund || 0);
    const explicitReturned = Number(inv.returnedFund || 0);
    const explicitEquity = Number(inv.equityPct || 0);
    
    const monthlyProfitShare = netProfit > 0 ? netProfit * (explicitEquity / 100) : 0;
    const cumulativeROI = explicitInvested > 0 ? (explicitReturned / explicitInvested) * 100 : 0;

    return {
      ...inv,
      investedFund: explicitInvested,
      returnedFund: explicitReturned,
      equityPct: explicitEquity,
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

  // Automatically adjust the investor's balance based on the transaction,
  // but since it's an explicit field now, we just add to it.
  if (type === 'Investment In') {
    investor.investedFund = Number(investor.investedFund || 0) + Number(amount);
  } else if (type === 'Profit Payout Out') {
    investor.returnedFund = Number(investor.returnedFund || 0) + Number(amount);
  }

  // Sync with main ledger (finance)
  const financeEntry = {
    id: nextId(db.finance),
    companyId: investor.companyId,
    companyName: investor.companyName,
    transactionType: type === 'Investment In' ? 'income' : 'expense',
    amount: Number(amount),
    description: `Investor ${type}: ${investor.investorName} (${method}${method === 'UPI' ? ': ' + upiId : ''})`,
    category: 'Investment',
    entryDate: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };
  db.finance.push(financeEntry);

  writeDb(db);
  res.status(201).json({ transaction, financeEntry });
});

investmentsRouter.post("/", authorize("manager"), (req, res) => {
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
    equityPct: Number(req.body.equityPct || 0),
    investedDate: req.body.investedDate || new Date().toISOString().slice(0, 10),
    returnDate: req.body.returnDate || "",
    notes: req.body.notes || ""
  };

  db.investments = db.investments || [];
  db.investments.unshift(record);

  // Sync with main ledger (finance) if initial investment is provided
  if (record.investedFund > 0) {
    const financeEntry = {
      id: nextId(db.finance),
      companyId: record.companyId,
      companyName: record.companyName,
      transactionType: 'income',
      amount: record.investedFund,
      description: `Initial Investment: ${record.investorName}`,
      category: 'Investment',
      entryDate: record.investedDate,
      createdAt: new Date().toISOString()
    };
    db.finance.push(financeEntry);
  }

  writeDb(db);
  res.status(201).json(record);
});

investmentsRouter.put("/:id", authorize("manager"), (req, res) => {
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
    equityPct: req.body.equityPct !== undefined ? Number(req.body.equityPct) : record.equityPct,
    investedDate: req.body.investedDate ?? record.investedDate,
    returnDate: req.body.returnDate ?? record.returnDate,
    notes: req.body.notes ?? record.notes
  });

  writeDb(db);
  res.json(record);
});

investmentsRouter.get("/:id/transactions", authorize("investor"), (req, res) => {
  const db = readDb();
  const transactions = (db.investorTransactions || []).filter(t => t.investorId === Number(req.params.id));
  res.json(transactions);
});

investmentsRouter.delete("/:id", authorize("manager"), (req, res) => {
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

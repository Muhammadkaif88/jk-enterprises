import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const billingRouter = Router();

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getNextInvoiceNumber(db) {
  const currentYear = new Date().getFullYear();
  const currentYearPrefix = String(currentYear);

  const existingNumbers = db.billing
    .map((entry) => String(entry.invoiceNumber || ""))
    .map((value) => value.replace(/\D/g, ""))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const yearScoped = existingNumbers.filter((value) => String(value).startsWith(currentYearPrefix));
  const maxNumber = yearScoped.length ? Math.max(...yearScoped) : Number(`${currentYearPrefix}0000`);
  return String(maxNumber + 1);
}

function normalizeLineItems(items = []) {
  return items.map((item) => ({
    inventoryId: item.inventoryId !== undefined && item.inventoryId !== null && item.inventoryId !== ""
      ? Number(item.inventoryId)
      : null,
    description: item.description || "",
    qty: Number(item.qty || 0),
    price: Number(item.price || 0),
    total: Number(item.total ?? Number(item.qty || 0) * Number(item.price || 0))
  }));
}

function computeBilling(lineItems, discount, paidAmount) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const amount = subtotal - discount;
  return {
    subtotal,
    amount,
    balanceDue: amount - paidAmount
  };
}

function resolveRecognizedIncome(bill) {
  return Number(bill.amount || 0);
}

function findInventoryMatch(db, companyId, description, inventoryId) {
  if (inventoryId) {
    return db.inventory.find(
      (item) => Number(item.companyId) === Number(companyId) && Number(item.id) === Number(inventoryId)
    );
  }

  const target = normalizeText(description);
  return db.inventory.find((item) => {
    if (Number(item.companyId) !== Number(companyId)) return false;
    const name = normalizeText(item.partName);
    return name === target || target.includes(name) || name.includes(target);
  });
}

function revertBillingEffects(db, bill) {
  if (Array.isArray(bill.inventoryAdjustments)) {
    bill.inventoryAdjustments.forEach((adjustment) => {
      const item = db.inventory.find((entry) => entry.id === Number(adjustment.inventoryId));
      if (item) {
        item.stockQty += Number(adjustment.qty || 0);
      }
    });
  }

  if (bill.financeLogId) {
    db.finance = db.finance.filter((entry) => entry.id !== Number(bill.financeLogId));
  }
}

function applyBillingEffects(db, bill) {
  const inventoryAdjustments = [];

  for (const lineItem of bill.lineItems) {
    const inventoryItem = findInventoryMatch(db, bill.companyId, lineItem.description, lineItem.inventoryId);
    if (!inventoryItem) continue;

    const qty = Number(lineItem.qty || 0);
    if (inventoryItem.stockQty < qty) {
      throw new Error(`${inventoryItem.partName} does not have enough stock for this bill.`);
    }

    inventoryItem.stockQty -= qty;
    inventoryAdjustments.push({
      inventoryId: inventoryItem.id,
      partName: inventoryItem.partName,
      unitCost: inventoryItem.unitCost,
      qty
    });
  }

  bill.inventoryAdjustments = inventoryAdjustments;

  const incomeAmount = resolveRecognizedIncome(bill);
  if (incomeAmount > 0) {
    const financeLog = {
      id: nextId(db.finance),
      companyId: bill.companyId,
      companyName: bill.companyName,
      transactionType: "income",
      amount: incomeAmount,
      description: `Billing invoice ${bill.invoiceNumber} - ${bill.customerName} - ${bill.description || bill.billType || "Invoice entry"}`,
      category: "Billing",
      entryDate: bill.invoiceDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      sourceType: "billing",
      sourceId: bill.id
    };
    db.finance.unshift(financeLog);
    bill.financeLogId = financeLog.id;
  } else {
    bill.financeLogId = null;
  }
}

billingRouter.get("/", authorize("manager"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.billing, getRequestedCompanyId(req)));
});

billingRouter.post("/", authorize("manager"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before creating billing entries." });
  }

  const bill = {
    id: nextId(db.billing),
    companyId: company.id,
    companyName: company.name,
    billType: req.body.billType || "Invoice",
    invoiceNumber: getNextInvoiceNumber(db),
    customerName: req.body.customerName,
    customerAddress: req.body.customerAddress || "",
    customerPhone: req.body.customerPhone || "",
    description: req.body.description || "",
    lineItems: normalizeLineItems(req.body.lineItems || []),
    paymentMethod: req.body.paymentMethod || "Bank / UPI",
    discount: Number(req.body.discount || 0),
    paidAmount: Number(req.body.paidAmount || 0),
    subtotal: 0,
    amount: 0,
    balanceDue: 0,
    status: req.body.status || "Draft",
    invoiceDate: req.body.invoiceDate || new Date().toISOString().slice(0, 10),
    dueDate: req.body.dueDate || ""
  };

  Object.assign(bill, computeBilling(bill.lineItems, bill.discount, bill.paidAmount));
  applyBillingEffects(db, bill);

  db.billing.unshift(bill);
  writeDb(db);
  res.status(201).json(bill);
});

billingRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const bill = db.billing.find((entry) => entry.id === Number(req.params.id));
  if (!bill) {
    return res.status(404).json({ message: "Billing entry not found." });
  }

  revertBillingEffects(db, bill);

  Object.assign(bill, {
    billType: req.body.billType ?? bill.billType,
    invoiceNumber: req.body.invoiceNumber ?? bill.invoiceNumber,
    customerName: req.body.customerName ?? bill.customerName,
    customerAddress: req.body.customerAddress ?? bill.customerAddress,
    customerPhone: req.body.customerPhone ?? bill.customerPhone,
    description: req.body.description ?? bill.description,
    lineItems: Array.isArray(req.body.lineItems) ? normalizeLineItems(req.body.lineItems) : bill.lineItems,
    paymentMethod: req.body.paymentMethod ?? bill.paymentMethod,
    discount: req.body.discount !== undefined ? Number(req.body.discount) : bill.discount,
    paidAmount: req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : bill.paidAmount,
    status: req.body.status ?? bill.status,
    invoiceDate: req.body.invoiceDate ?? bill.invoiceDate,
    dueDate: req.body.dueDate ?? bill.dueDate
  });

  Object.assign(bill, computeBilling(bill.lineItems, bill.discount, bill.paidAmount));
  applyBillingEffects(db, bill);

  writeDb(db);
  res.json(bill);
});

billingRouter.delete("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const bill = db.billing.find((entry) => entry.id === Number(req.params.id));
  if (!bill) {
    return res.status(404).json({ message: "Billing entry not found." });
  }
  revertBillingEffects(db, bill);
  db.billing = db.billing.filter((entry) => entry.id !== Number(req.params.id));
  writeDb(db);
  res.status(204).send();
});

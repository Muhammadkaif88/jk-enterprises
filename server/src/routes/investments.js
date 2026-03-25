import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const investmentsRouter = Router();

investmentsRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.investments || [], getRequestedCompanyId(req)));
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

investmentsRouter.delete("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  db.investments = (db.investments || []).filter((entry) => entry.id !== Number(req.params.id));
  writeDb(db);
  res.status(204).send();
});

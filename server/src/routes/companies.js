import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { readDb, writeDb } from "../data/store.js";

export const companiesRouter = Router();

companiesRouter.get("/", authorize("technician"), (_req, res) => {
  const db = readDb();
  res.json(db.companies);
});

companiesRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const company = db.companies.find((entry) => entry.id === Number(req.params.id));
  if (!company) {
    return res.status(404).json({ message: "Company not found." });
  }

  Object.assign(company, {
    name: req.body.name ?? company.name,
    code: req.body.code ?? company.code,
    address: req.body.address ?? company.address,
    phone: req.body.phone ?? company.phone,
    email: req.body.email ?? company.email,
    bankName: req.body.bankName ?? company.bankName,
    accountNumber: req.body.accountNumber ?? company.accountNumber,
    ifsc: req.body.ifsc ?? company.ifsc,
    upiId: req.body.upiId ?? company.upiId,
    totalValuation: req.body.totalValuation !== undefined ? Number(req.body.totalValuation) : company.totalValuation
  });

  db.staff = db.staff.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.inventory = db.inventory.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.finance = db.finance.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.projects = db.projects.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.notes = db.notes.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.attendanceLogs = db.attendanceLogs.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.doubtClearance = db.doubtClearance.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.complaints = db.complaints.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.tasks = db.tasks.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );
  db.billing = db.billing.map((entry) =>
    Number(entry.companyId) === company.id ? { ...entry, companyName: company.name } : entry
  );

  writeDb(db);
  res.json(company);
});

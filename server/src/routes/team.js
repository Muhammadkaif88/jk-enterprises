import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const teamRouter = Router();

teamRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.staff, getRequestedCompanyId(req)));
});

teamRouter.post("/", authorize("admin"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding staff." });
  }
  const member = {
    id: nextId(db.staff),
    companyId: company.id,
    companyName: company.name,
    fullName: req.body.fullName,
    email: req.body.email,
    role: req.body.role || "technician",
    staffCategory: req.body.staffCategory || "",
    expertise: req.body.expertise || "",
    attendanceStatus: req.body.attendanceStatus || "Present",
    assignedTask: req.body.assignedTask || "",
    salary: Number(req.body.salary || 0)
  };
  db.staff.unshift(member);
  writeDb(db);
  res.status(201).json(member);
});

teamRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const member = db.staff.find((entry) => entry.id === Number(req.params.id));
  if (!member) {
    return res.status(404).json({ message: "Staff member not found." });
  }
  Object.assign(member, {
    fullName: req.body.fullName ?? member.fullName,
    email: req.body.email ?? member.email,
    role: req.body.role ?? member.role,
    staffCategory: req.body.staffCategory ?? member.staffCategory,
    expertise: req.body.expertise ?? member.expertise,
    attendanceStatus: req.body.attendanceStatus ?? member.attendanceStatus,
    assignedTask: req.body.assignedTask ?? member.assignedTask,
    salary: req.body.salary !== undefined ? Number(req.body.salary) : member.salary
  });
  writeDb(db);
  res.json(member);
});

teamRouter.delete("/:id", authorize("admin"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.staff = db.staff.filter((entry) => entry.id !== id);
  writeDb(db);
  res.status(204).send();
});

import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";
import { syncAttendanceStatuses } from "../services/attendanceStatus.js";

export const teamRouter = Router();

function buildUserAccount(member, password) {
  return {
    fullName: member.fullName,
    email: member.email,
    phone: member.phone || "",
    password,
    role: member.role,
    staffCategory: member.staffCategory,
    companyId: member.companyId,
    companyName: member.companyName,
    secondaryCompanyId: member.secondaryCompanyId || null,
    secondaryCompanyName: member.secondaryCompanyName || "",
    approvalStatus: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: "Admin"
  };
}

teamRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  syncAttendanceStatuses(db);
  const activeStaff = db.staff.filter((entry) => entry.isDeleted !== true);
  res.json(scopeRecords(activeStaff, getRequestedCompanyId(req)));
});

teamRouter.post("/", authorize("admin"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  const secondaryCompany = req.body.secondaryCompanyId ? resolveCompany(db, req.body.secondaryCompanyId) : null;
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding staff." });
  }
  if (db.staff.some((entry) => String(entry.email).toLowerCase() === String(req.body.email).toLowerCase())) {
    return res.status(400).json({ message: "A staff profile already exists for this email." });
  }
  if (db.users.some((entry) => String(entry.email).toLowerCase() === String(req.body.email).toLowerCase())) {
    return res.status(400).json({ message: "A login account already exists for this email." });
  }
  if (!req.body.password) {
    return res.status(400).json({ message: "Add an employee password before creating the account." });
  }
  const member = {
    id: nextId(db.staff),
    companyId: company.id,
    companyName: company.name,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone || "",
    role: req.body.role || "technician",
    staffCategory: req.body.staffCategory || "",
    secondaryCompanyId: secondaryCompany && secondaryCompany.id !== company.id ? secondaryCompany.id : null,
    secondaryCompanyName: secondaryCompany && secondaryCompany.id !== company.id ? secondaryCompany.name : "",
    expertise: req.body.expertise || "",
    attendanceStatus: "Pending Assignment",
    assignedTask: req.body.assignedTask || "",
    dailyWage: Number(req.body.dailyWage || req.body.salary || 0)
  };
  db.staff.unshift(member);
  db.users.unshift({
    id: nextId(db.users),
    ...buildUserAccount(member, req.body.password)
  });
  writeDb(db);
  res.status(201).json(member);
});

teamRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const member = db.staff.find((entry) => entry.id === Number(req.params.id));
  const secondaryCompany = req.body.secondaryCompanyId ? resolveCompany(db, req.body.secondaryCompanyId) : null;
  if (!member) {
    return res.status(404).json({ message: "Staff member not found." });
  }
  const previousEmail = member.email;
  Object.assign(member, {
    fullName: req.body.fullName ?? member.fullName,
    email: req.body.email ?? member.email,
    phone: req.body.phone ?? member.phone,
    role: req.body.role ?? member.role,
    staffCategory: req.body.staffCategory ?? member.staffCategory,
    secondaryCompanyId:
      req.body.secondaryCompanyId !== undefined
        ? secondaryCompany && secondaryCompany.id !== Number(member.companyId)
          ? secondaryCompany.id
          : null
        : member.secondaryCompanyId || null,
    secondaryCompanyName:
      req.body.secondaryCompanyId !== undefined
        ? secondaryCompany && secondaryCompany.id !== Number(member.companyId)
          ? secondaryCompany.name
          : ""
        : member.secondaryCompanyName || "",
    expertise: req.body.expertise ?? member.expertise,
    assignedTask: req.body.assignedTask ?? member.assignedTask,
    dailyWage: req.body.dailyWage !== undefined ? Number(req.body.dailyWage) : (req.body.salary !== undefined ? Number(req.body.salary) : member.dailyWage)
  });

  const linkedUser = db.users.find(
    (entry) => entry.email === previousEmail || entry.email === member.email
  );
  if (linkedUser) {
    Object.assign(linkedUser, {
      fullName: member.fullName,
      email: member.email,
      phone: member.phone || linkedUser.phone || "",
      role: member.role,
      staffCategory: member.staffCategory,
      companyId: member.companyId,
      companyName: member.companyName,
      secondaryCompanyId: member.secondaryCompanyId || null,
      secondaryCompanyName: member.secondaryCompanyName || "",
      ...(req.body.password ? { password: req.body.password } : {})
    });
  }

  writeDb(db);
  res.json(member);
});

teamRouter.delete("/:id", authorize("admin"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  const member = db.staff.find((entry) => entry.id === id);
  
  if (!member) {
    return res.status(404).json({ message: "Staff member not found." });
  }
  
  // Soft delete: mark as deleted instead of removing
  member.isDeleted = true;
  member.deletedAt = new Date().toISOString();
  member.deletedBy = req.header("x-user-email") || "admin";
  
  writeDb(db);
  res.status(200).json({ message: "Staff member moved to recycle bin" });
});

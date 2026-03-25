import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

function withAssignee(db, assigneeId) {
  const member = db.staff.find((entry) => entry.id === Number(assigneeId));
  return member?.fullName || "Unassigned";
}

function buildAssigneeData(db, primaryId, secondaryId) {
  const normalizedPrimaryId = Number(primaryId || 0);
  const normalizedSecondaryId = Number(secondaryId || 0);
  const safeSecondaryId = normalizedSecondaryId && normalizedSecondaryId !== normalizedPrimaryId ? normalizedSecondaryId : 0;
  const assigneeNames = [withAssignee(db, normalizedPrimaryId), safeSecondaryId ? withAssignee(db, safeSecondaryId) : ""]
    .filter((name) => name && name !== "Unassigned");

  return {
    assigneeId: normalizedPrimaryId,
    assigneeName: withAssignee(db, normalizedPrimaryId),
    secondaryAssigneeId: safeSecondaryId,
    secondaryAssigneeName: safeSecondaryId ? withAssignee(db, safeSecondaryId) : "",
    assigneeNames: assigneeNames.join(", ")
  };
}

function resolveRequestStaff(db, req) {
  const email = String(req.header("x-user-email") || "").trim().toLowerCase();
  const fullName = String(req.header("x-user-name") || "").trim();

  return db.staff.find((entry) => {
    if (email && String(entry.email || "").trim().toLowerCase() === email) {
      return true;
    }
    return fullName && entry.fullName === fullName;
  });
}

export const tasksRouter = Router();

tasksRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const active = db.tasks.filter((entry) => !entry.isDeleted);
  res.json(scopeRecords(active, getRequestedCompanyId(req)));
});

tasksRouter.post("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before creating a task." });
  }

  const task = {
    id: nextId(db.tasks),
    companyId: company.id,
    companyName: company.name,
    title: req.body.title,
    projectName: req.body.projectName || "",
    description: req.body.description || "",
    priority: req.body.priority || "Low",
    status: req.body.status || "todo",
    startDate: req.body.startDate || "",
    dueDate: req.body.dueDate || "",
    ...buildAssigneeData(db, req.body.assigneeId, req.body.secondaryAssigneeId),
    createdAt: new Date().toISOString()
  };

  db.tasks.unshift(task);
  writeDb(db);
  res.status(201).json(task);
});

tasksRouter.put("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const task = db.tasks.find((entry) => entry.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (req.userRole === "technician") {
    const currentStaff = resolveRequestStaff(db, req);
    const isAssigned =
      currentStaff &&
      (Number(task.assigneeId) === Number(currentStaff.id) ||
        Number(task.secondaryAssigneeId || 0) === Number(currentStaff.id));

    if (!isAssigned) {
      return res.status(403).json({ message: "You can only update tasks assigned to your account." });
    }

    const nextStatus = String(req.body.status || "");
    if (!["in-progress", "review"].includes(nextStatus)) {
      return res.status(403).json({ message: "Employee accounts can only move tasks to In Progress or Review." });
    }

    task.status = nextStatus;
    writeDb(db);
    return res.json(task);
  }

  const nextCompany = req.body.companyId ? resolveCompany(db, req.body.companyId) : null;

  Object.assign(task, {
    companyId: nextCompany ? nextCompany.id : task.companyId,
    companyName: nextCompany ? nextCompany.name : task.companyName,
    title: req.body.title ?? task.title,
    projectName: req.body.projectName ?? task.projectName,
    description: req.body.description ?? task.description,
    priority: req.body.priority ?? task.priority,
    status: req.body.status ?? task.status,
    startDate: req.body.startDate ?? task.startDate,
    dueDate: req.body.dueDate ?? task.dueDate,
    ...(req.body.assigneeId !== undefined || req.body.secondaryAssigneeId !== undefined
      ? buildAssigneeData(
          db,
          req.body.assigneeId !== undefined ? req.body.assigneeId : task.assigneeId,
          req.body.secondaryAssigneeId !== undefined ? req.body.secondaryAssigneeId : task.secondaryAssigneeId
        )
      : {})
  });

  writeDb(db);
  res.json(task);
});

tasksRouter.delete("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const task = db.tasks.find((entry) => entry.id === Number(req.params.id));
  
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }
  
  task.isDeleted = true;
  task.deletedAt = new Date().toISOString();
  task.deletedBy = req.body.email || "system";
  writeDb(db);
  res.status(204).send();
});

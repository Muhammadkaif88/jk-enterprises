import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

function withStaffName(db, staffId) {
  const member = db.staff.find((entry) => entry.id === Number(staffId));
  return member?.fullName || "Unknown Staff";
}

export const staffTrackingRouter = Router();

staffTrackingRouter.get("/summary", authorize("technician"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  const today = new Date().toISOString().slice(0, 10);
  const attendance = scopeRecords(db.attendanceLogs, companyId);
  const doubts = scopeRecords(db.doubtClearance, companyId);
  const complaints = scopeRecords(db.complaints, companyId);
  const todayAttendance = attendance.filter((entry) => entry.date === today);

  res.json({
    todayAttendanceCount: todayAttendance.length,
    presentToday: todayAttendance.filter((entry) => entry.status === "Present").length,
    lateToday: todayAttendance.filter((entry) => entry.status === "Late").length,
    openDoubts: doubts.filter((entry) => entry.status !== "Resolved").length,
    openComplaints: complaints.filter((entry) => entry.status !== "Closed").length
  });
});

staffTrackingRouter.get("/attendance", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.attendanceLogs, getRequestedCompanyId(req)));
});

staffTrackingRouter.post("/attendance", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding attendance." });
  }
  const record = {
    id: nextId(db.attendanceLogs),
    companyId: company.id,
    companyName: company.name,
    staffId: Number(req.body.staffId),
    staffName: withStaffName(db, req.body.staffId),
    date: req.body.date || new Date().toISOString().slice(0, 10),
    status: req.body.status || "Present",
    checkIn: req.body.checkIn || "",
    checkOut: req.body.checkOut || "",
    notes: req.body.notes || ""
  };
  db.attendanceLogs.unshift(record);
  writeDb(db);
  res.status(201).json(record);
});

staffTrackingRouter.put("/attendance/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const record = db.attendanceLogs.find((entry) => entry.id === Number(req.params.id));
  if (!record) {
    return res.status(404).json({ message: "Attendance record not found." });
  }
  Object.assign(record, {
    staffId: req.body.staffId !== undefined ? Number(req.body.staffId) : record.staffId,
    staffName: req.body.staffId !== undefined ? withStaffName(db, req.body.staffId) : record.staffName,
    date: req.body.date ?? record.date,
    status: req.body.status ?? record.status,
    checkIn: req.body.checkIn ?? record.checkIn,
    checkOut: req.body.checkOut ?? record.checkOut,
    notes: req.body.notes ?? record.notes
  });
  writeDb(db);
  res.json(record);
});

staffTrackingRouter.delete("/attendance/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  db.attendanceLogs = db.attendanceLogs.filter((entry) => entry.id !== Number(req.params.id));
  writeDb(db);
  res.status(204).send();
});

staffTrackingRouter.get("/doubts", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.doubtClearance, getRequestedCompanyId(req)));
});

staffTrackingRouter.post("/doubts", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding a doubt." });
  }
  const item = {
    id: nextId(db.doubtClearance),
    companyId: company.id,
    companyName: company.name,
    staffId: Number(req.body.staffId),
    staffName: withStaffName(db, req.body.staffId),
    topic: req.body.topic,
    question: req.body.question,
    response: req.body.response || "",
    priority: req.body.priority || "Medium",
    status: req.body.status || "Open",
    createdAt: new Date().toISOString(),
    resolvedAt: req.body.status === "Resolved" ? new Date().toISOString() : null
  };
  db.doubtClearance.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

staffTrackingRouter.put("/doubts/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const item = db.doubtClearance.find((entry) => entry.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Doubt entry not found." });
  }
  Object.assign(item, {
    staffId: req.body.staffId !== undefined ? Number(req.body.staffId) : item.staffId,
    staffName: req.body.staffId !== undefined ? withStaffName(db, req.body.staffId) : item.staffName,
    topic: req.body.topic ?? item.topic,
    question: req.body.question ?? item.question,
    response: req.body.response ?? item.response,
    priority: req.body.priority ?? item.priority,
    status: req.body.status ?? item.status,
    resolvedAt:
      (req.body.status ?? item.status) === "Resolved"
        ? item.resolvedAt || new Date().toISOString()
        : null
  });
  writeDb(db);
  res.json(item);
});

staffTrackingRouter.delete("/doubts/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  db.doubtClearance = db.doubtClearance.filter((entry) => entry.id !== Number(req.params.id));
  writeDb(db);
  res.status(204).send();
});

staffTrackingRouter.get("/complaints", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.complaints, getRequestedCompanyId(req)));
});

staffTrackingRouter.post("/complaints", authorize("technician"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding a complaint." });
  }
  const item = {
    id: nextId(db.complaints),
    companyId: company.id,
    companyName: company.name,
    staffId: Number(req.body.staffId),
    staffName: withStaffName(db, req.body.staffId),
    complaintType: req.body.complaintType || "General",
    subject: req.body.subject,
    description: req.body.description,
    status: req.body.status || "Open",
    resolution: req.body.resolution || "",
    createdAt: new Date().toISOString()
  };
  db.complaints.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

staffTrackingRouter.put("/complaints/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const item = db.complaints.find((entry) => entry.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Complaint not found." });
  }
  Object.assign(item, {
    staffId: req.body.staffId !== undefined ? Number(req.body.staffId) : item.staffId,
    staffName: req.body.staffId !== undefined ? withStaffName(db, req.body.staffId) : item.staffName,
    complaintType: req.body.complaintType ?? item.complaintType,
    subject: req.body.subject ?? item.subject,
    description: req.body.description ?? item.description,
    status: req.body.status ?? item.status,
    resolution: req.body.resolution ?? item.resolution
  });
  writeDb(db);
  res.json(item);
});

staffTrackingRouter.delete("/complaints/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  db.complaints = db.complaints.filter((entry) => entry.id !== Number(req.params.id));
  writeDb(db);
  res.status(204).send();
});

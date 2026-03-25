import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";
import { syncAttendanceStatuses } from "../services/attendanceStatus.js";
import { formatWorkedDuration, getIndiaDateKey, getIndiaTimeLabel, parseIndiaTimeLabel } from "../services/indiaTime.js";

function withStaffName(db, staffId) {
  const member = db.staff.find((entry) => entry.id === Number(staffId));
  return member?.fullName || "Unknown Staff";
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

function applyAttendanceWorkSummary(record) {
  if (record.status === "Leave") {
    record.workedMinutes = 0;
    record.workedDuration = "0h 00m";
    record.dayApprovalStatus = "Leave Approved";
    return record;
  }

  const checkInMinutes = parseIndiaTimeLabel(record.checkIn);
  const checkOutMinutes = parseIndiaTimeLabel(record.checkOut);

  if (checkInMinutes === null || checkOutMinutes === null) {
    record.workedMinutes = 0;
    record.workedDuration = "";
    record.dayApprovalStatus = "Working Session Open";
    return record;
  }

  const workedMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
  record.workedMinutes = workedMinutes;
  record.workedDuration = formatWorkedDuration(workedMinutes);

  if (workedMinutes >= 540) {
    record.dayApprovalStatus = "Full Day Approved";
  } else if (workedMinutes >= 480) {
    record.dayApprovalStatus = "3/4 Day Approved";
  } else if (workedMinutes >= 420) {
    record.dayApprovalStatus = "Half Day Approved";
  } else {
    record.dayApprovalStatus = "Not Approved";
  }

  return record;
}

export const staffTrackingRouter = Router();

staffTrackingRouter.get("/summary", authorize("technician"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  const today = getIndiaDateKey();
  const activeAttendance = db.attendanceLogs.filter((entry) => !entry.isDeleted);
  const activeDoubts = db.doubtClearance.filter((entry) => !entry.isDeleted);
  const activeComplaints = db.complaints.filter((entry) => !entry.isDeleted);
  const attendance = scopeRecords(activeAttendance, companyId);
  const doubts = scopeRecords(activeDoubts, companyId);
  const complaints = scopeRecords(activeComplaints, companyId);
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
  const active = db.attendanceLogs.filter((entry) => !entry.isDeleted);
  res.json(scopeRecords(active, getRequestedCompanyId(req)));
});

staffTrackingRouter.post("/attendance", authorize("technician"), (req, res) => {
  const db = readDb();
  const requestStaff = resolveRequestStaff(db, req);
  const company = resolveCompany(db, req.body.companyId || requestStaff?.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before adding attendance." });
  }
  const targetStaffId = Number(req.body.staffId || requestStaff?.id || 0);
  if (!targetStaffId) {
    return res.status(400).json({ message: "No linked staff profile found for attendance." });
  }
  const todayKey = getIndiaDateKey();
  const existingTodayRecord = db.attendanceLogs.find(
    (entry) => Number(entry.staffId) === targetStaffId && entry.date === todayKey
  );
  if (existingTodayRecord) {
    return res.status(400).json({ message: "Attendance already checked in for today. Use check out when work is completed." });
  }
  const record = {
    id: nextId(db.attendanceLogs),
    companyId: company.id,
    companyName: company.name,
    staffId: targetStaffId,
    staffName: withStaffName(db, targetStaffId),
    date: todayKey,
    status: req.body.status === "Leave" ? "Leave" : "Present",
    checkIn: getIndiaTimeLabel(),
    checkOut: req.body.checkOut || "",
    workedMinutes: 0,
    workedDuration: "",
    dayApprovalStatus: "",
    notes: req.body.notes || ""
  };
  applyAttendanceWorkSummary(record);
  db.attendanceLogs.unshift(record);
  syncAttendanceStatuses(db);
  writeDb(db);
  res.status(201).json(record);
});

staffTrackingRouter.post("/attendance/check-out", authorize("technician"), (req, res) => {
  const db = readDb();
  const requestStaff = resolveRequestStaff(db, req);
  if (!requestStaff) {
    return res.status(400).json({ message: "No linked staff profile found for attendance." });
  }

  const todayKey = getIndiaDateKey();
  const record = db.attendanceLogs.find(
    (entry) => Number(entry.staffId) === Number(requestStaff.id) && entry.date === todayKey
  );

  if (!record) {
    return res.status(404).json({ message: "No check-in found for today. Complete check in first." });
  }

  record.checkOut = getIndiaTimeLabel();
  applyAttendanceWorkSummary(record);
  syncAttendanceStatuses(db);
  writeDb(db);
  res.json(record);
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
  applyAttendanceWorkSummary(record);
  syncAttendanceStatuses(db);
  writeDb(db);
  res.json(record);
});

staffTrackingRouter.delete("/attendance/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const record = db.attendanceLogs.find((entry) => entry.id === Number(req.params.id));
  if (!record) {
    return res.status(404).json({ message: "Attendance record not found." });
  }
  record.isDeleted = true;
  record.deletedAt = new Date().toISOString();
  record.deletedBy = req.body.email || "system";
  syncAttendanceStatuses(db);
  writeDb(db);
  res.status(204).send();
});

staffTrackingRouter.get("/doubts", authorize("technician"), (req, res) => {
  const db = readDb();
  const active = db.doubtClearance.filter((entry) => !entry.isDeleted);
  res.json(scopeRecords(active, getRequestedCompanyId(req)));
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
  const item = db.doubtClearance.find((entry) => entry.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Doubt entry not found." });
  }
  item.isDeleted = true;
  item.deletedAt = new Date().toISOString();
  item.deletedBy = req.body.email || "system";
  writeDb(db);
  res.status(204).send();
});

staffTrackingRouter.get("/complaints", authorize("technician"), (req, res) => {
  const db = readDb();
  const active = db.complaints.filter((entry) => !entry.isDeleted);
  res.json(scopeRecords(active, getRequestedCompanyId(req)));
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
  const item = db.complaints.find((entry) => entry.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ message: "Complaint not found." });
  }
  item.isDeleted = true;
  item.deletedAt = new Date().toISOString();
  item.deletedBy = req.body.email || "system";
  writeDb(db);
  res.status(204).send();
});

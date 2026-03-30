import { Router } from "express";
import { nextId, readDb, writeDb } from "../data/store.js";
import crypto from "node:crypto";
import { authorize } from "../middleware/rbac.js";

export const authRouter = Router();

// Simple hash function for demonstration (use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function resolveApprovalProfile(profile) {
  const selectedProfile = String(profile || "").trim();
  if (!selectedProfile) {
    return null;
  }

  if (selectedProfile === "manager") {
    return { role: "manager", staffCategory: "Manager" };
  }

  if (selectedProfile === "Investor") {
    return { role: "investor", staffCategory: "Investor" };
  }

  if (selectedProfile === "Freelancer") {
    return { role: "technician", staffCategory: "Freelancer" };
  }

  return {
    role: "technician",
    staffCategory: selectedProfile
  };
}

authRouter.post("/register", (req, res) => {
  const db = readDb();
  if (!db.users) db.users = [];
  const { email, password, fullName, phone } = req.body;

  if (db.users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "User already exists." });
  }

  const user = {
    id: nextId(db.users),
    email,
    password, // Store as is or hash if needed. The user's request is simple.
    fullName,
    phone: phone || "",
    role: "",
    staffCategory: "",
    companyId: null,
    companyName: "",
    approvalStatus: "pending",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  writeDb(db);

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

authRouter.post("/login", (req, res) => {
  const db = readDb();
  if (!db.users) db.users = [];
  const { email, password } = req.body;

  const user = db.users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  if (user.approvalStatus !== "approved") {
    return res.status(403).json({ message: "Your account is waiting for admin approval. You cannot log in yet." });
  }

  const { password: _, ...userWithoutPassword } = user;
  
  // For a real app, generate a JWT here. 
  // For this local tool, we'll return the user object which acts as the 'token'.
  res.json({
    token: `fake-jwt-for-${user.id}`,
    user: userWithoutPassword
  });
});

authRouter.get("/pending", authorize("admin"), (req, res) => {
  const db = readDb();
  res.json(db.users.filter((user) => user.approvalStatus === "pending"));
});

authRouter.post("/pending/:id/approve", authorize("admin"), (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const company = db.companies.find((entry) => entry.id === Number(req.body.companyId));
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before approving this account." });
  }

  const accessProfile = resolveApprovalProfile(req.body.accessProfile);
  if (!accessProfile) {
    return res.status(400).json({ message: "Select an employee category before approving this account." });
  }

  user.approvalStatus = "approved";
  user.approvedAt = new Date().toISOString();
  user.approvedBy = req.headers["x-user-name"] || "Admin";
  user.rejectedAt = null;
  user.rejectedBy = null;
  user.companyId = company.id;
  user.companyName = company.name;
  user.role = accessProfile.role;
  user.staffCategory = accessProfile.staffCategory;
  user.phone = req.body.phone || user.phone || "";

  const existingStaffProfile = db.staff.find((entry) => entry.email === user.email);
  if (existingStaffProfile) {
    Object.assign(existingStaffProfile, {
      companyId: company.id,
      companyName: company.name,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || existingStaffProfile.phone || "",
      role: user.role,
      staffCategory: user.staffCategory
    });
  } else {
    db.staff.unshift({
      id: nextId(db.staff),
      companyId: company.id,
      companyName: company.name,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      staffCategory: user.staffCategory,
      expertise: "",
      attendanceStatus: "Pending Assignment",
      assignedTask: "",
      salary: 0
    });
  }

  writeDb(db);
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

authRouter.post("/pending/:id/reject", authorize("admin"), (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.approvalStatus = "rejected";
  user.rejectedAt = new Date().toISOString();
  user.rejectedBy = req.headers["x-user-name"] || "Admin";
  user.approvedAt = null;
  user.approvedBy = null;

  writeDb(db);
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Set user role to admin (admin only)
authRouter.post("/users/:id/set-admin", authorize("admin"), (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.role = "admin";
  writeDb(db);
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: "User promoted to admin role",
    user: userWithoutPassword
  });
});

// Remove admin role (admin only)
authRouter.post("/users/:id/remove-admin", authorize("admin"), (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.role = user.staffCategory === "Manager" ? "manager" : "technician";
  writeDb(db);
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: "Admin role removed from user",
    user: userWithoutPassword
  });
});

import { Router } from "express";
import { nextId, readDb, writeDb } from "../data/store.js";
import crypto from "node:crypto";

export const authRouter = Router();

// Simple hash function for demonstration (use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

authRouter.post("/register", (req, res) => {
  const db = readDb();
  if (!db.users) db.users = [];
  const { email, password, fullName, role } = req.body;

  if (db.users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "User already exists." });
  }

  const user = {
    id: nextId(db.users),
    email,
    password, // Store as is or hash if needed. The user's request is simple.
    fullName,
    role: role || "technician"
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

  const { password: _, ...userWithoutPassword } = user;
  
  // For a real app, generate a JWT here. 
  // For this local tool, we'll return the user object which acts as the 'token'.
  res.json({
    token: `fake-jwt-for-${user.id}`,
    user: userWithoutPassword
  });
});

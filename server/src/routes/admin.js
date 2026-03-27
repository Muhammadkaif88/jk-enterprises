import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { readDb, writeDb } from "../data/store.js";

export const adminRouter = Router();

adminRouter.get("/export", authorize("admin"), (req, res) => {
  try {
    const db = readDb();
    res.setHeader("Content-Disposition", "attachment; filename=jk_compy_backup.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(db, null, 2));
  } catch (error) {
    res.status(500).json({ message: "Failed to export data: " + error.message });
  }
});

adminRouter.post("/import", authorize("admin"), (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== "object" || !Array.isArray(data.companies)) {
      return res.status(400).json({ message: "Invalid backup file format." });
    }
    writeDb(data);
    res.json({ message: "Data imported successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to import data: " + error.message });
  }
});

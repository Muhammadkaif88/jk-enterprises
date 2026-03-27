import express from "express";
import cors from "cors";
import { overviewRouter } from "./routes/overview.js";
import { inventoryRouter } from "./routes/inventory.js";
import { financeRouter } from "./routes/finance.js";
import { projectsRouter } from "./routes/projects.js";
import { notesRouter } from "./routes/notes.js";
import { teamRouter } from "./routes/team.js";
import { authRouter } from "./routes/auth.js";
import { staffTrackingRouter } from "./routes/staffTracking.js";
import { companiesRouter } from "./routes/companies.js";
import { tasksRouter } from "./routes/tasks.js";
import { billingRouter } from "./routes/billing.js";
import { investmentsRouter } from "./routes/investments.js";
import { recycleBinRouter } from "./routes/recycleBin.js";
import { adminRouter } from "./routes/admin.js";
import { salaryRouter } from "./routes/salary.js";
import { readDb, writeDb } from "./data/store.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/overview", overviewRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/finance", financeRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/team", teamRouter);
app.use("/api/auth", authRouter);
app.use("/api/staff-tracking", staffTrackingRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/billing", billingRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/recycle-bin", recycleBinRouter);
app.use("/api/admin", adminRouter);
app.use("/api/salaries", salaryRouter);

// Auto-cleanup function - runs every 24 hours
function runAutoCleanup() {
  const COLLECTIONS = ["inventory", "finance", "billing", "projects", "tasks", "investments", "notes", "attendanceLogs", "doubtClearance", "complaints"];
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

  const db = readDb();
  let totalCleaned = 0;

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(db[collection])) continue;

    const initialLength = db[collection].length;
    db[collection] = db[collection].filter((entry) => {
      if (entry.isDeleted === true && entry.deletedAt) {
        const deletedTime = new Date(entry.deletedAt).getTime();
        const now = new Date().getTime();
        if (now - deletedTime > TEN_DAYS_MS) {
          totalCleaned++;
          
          if (collection === "staff") {
            const userIndex = db.users.findIndex(u => String(u.email).toLowerCase() === String(entry.email).toLowerCase());
            if (userIndex !== -1) {
              db.users.splice(userIndex, 1);
            }
          }
          
          return false; // Remove permanently
        }
      }
      return true; // Keep
    });
  }

  if (totalCleaned > 0) {
    writeDb(db);
    console.log(`[Auto Cleanup] Permanently deleted ${totalCleaned} expired items from recycle bin`);
  }
}

// Schedule cleanup every 24 hours
setInterval(runAutoCleanup, 24 * 60 * 60 * 1000);

// Run cleanup on server startup
runAutoCleanup();

app.listen(port, () => {
  console.log(`ERMS API listening on http://localhost:${port}`);
});

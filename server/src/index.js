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

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`ERMS API listening on http://localhost:${port}`);
});

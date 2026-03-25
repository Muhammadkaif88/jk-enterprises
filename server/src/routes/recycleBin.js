import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId } from "../services/companyScope.js";

export const recycleBinRouter = Router();

const COLLECTIONS = ["inventory", "finance", "billing", "projects", "tasks", "investments", "notes", "attendanceLogs", "doubtClearance", "complaints", "staff"];

function isOlderThanDays(timestamp, days = 10) {
  if (!timestamp) return false;
  const deletedTime = new Date(timestamp).getTime();
  const now = new Date().getTime();
  const ageMs = now - deletedTime;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > days;
}

// GET all soft-deleted records across all collections
recycleBinRouter.get("/", authorize("admin"), (req, res) => {
  const db = readDb();
  const companyId = getRequestedCompanyId(req);
  const recycledItems = [];

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(db[collection])) continue;

    const deleted = db[collection]
      .filter((entry) => entry.isDeleted === true)
      .map((entry) => ({
        id: entry.id,
        collection,
        companyId: entry.companyId,
        companyName: entry.companyName || "Unknown",
        name: entry.partName || entry.title || entry.invoiceNumber || entry.staffName || entry.fullName || entry.subject || "Unnamed Item",
        deletedAt: entry.deletedAt,
        deletedBy: entry.deletedBy || "system",
        daysInBin: Math.floor((new Date() - new Date(entry.deletedAt)) / (1000 * 60 * 60 * 24)),
        willAutoDeleteAt: new Date(new Date(entry.deletedAt).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: isOlderThanDays(entry.deletedAt, 10)
      }));

    // Filter by company if needed
    if (companyId) {
      recycledItems.push(...deleted.filter((item) => Number(item.companyId) === Number(companyId)));
    } else {
      recycledItems.push(...deleted);
    }
  }

  // Sort by deleted date (most recent first)
  recycledItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  res.json(recycledItems);
});

// GET statistics about recycle bin
recycleBinRouter.get("/stats", authorize("admin"), (req, res) => {
  const db = readDb();
  let totalDeleted = 0;
  let willAutoDelete = 0;
  let canRestore = 0;

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(db[collection])) continue;

    db[collection].forEach((entry) => {
      if (entry.isDeleted === true) {
        totalDeleted++;
        const isExpired = isOlderThanDays(entry.deletedAt, 10);
        if (isExpired) {
          willAutoDelete++;
        } else {
          canRestore++;
        }
      }
    });
  }

  res.json({
    totalDeleted,
    canRestore,
    willAutoDelete,
    lastCleanup: "Never" // Can be enhanced with actual cleanup logs
  });
});

// RESTORE a deleted record
recycleBinRouter.post("/:collection/:id/restore", authorize("admin"), (req, res) => {
  const db = readDb();
  const { collection, id } = req.params;

  if (!COLLECTIONS.includes(collection)) {
    return res.status(400).json({ message: "Invalid collection." });
  }

  if (!Array.isArray(db[collection])) {
    return res.status(400).json({ message: "Collection not found." });
  }

  const entry = db[collection].find((item) => item.id === Number(id));

  if (!entry) {
    return res.status(404).json({ message: "Item not found in recycle bin." });
  }

  if (!entry.isDeleted) {
    return res.status(400).json({ message: "Item is not deleted." });
  }

  // Restore the item
  entry.isDeleted = false;
  entry.deletedAt = null;
  entry.deletedBy = null;
  entry.restoredAt = new Date().toISOString();
  entry.restoredBy = req.body.email || "admin";

  writeDb(db);

  res.json({
    message: `Item restored from ${collection}`,
    item: entry
  });
});

// PERMANENTLY DELETE a record
recycleBinRouter.delete("/:collection/:id/permanent", authorize("admin"), (req, res) => {
  const db = readDb();
  const { collection, id } = req.params;

  if (!COLLECTIONS.includes(collection)) {
    return res.status(400).json({ message: "Invalid collection." });
  }

  if (!Array.isArray(db[collection])) {
    return res.status(400).json({ message: "Collection not found." });
  }

  const index = db[collection].findIndex((item) => item.id === Number(id));

  if (index === -1) {
    return res.status(404).json({ message: "Item not found." });
  }

  const deletedItem = db[collection][index];
  db[collection].splice(index, 1);
  
  if (collection === "staff") {
    // Completely remove the linked user account to prevent regeneration
    const userIndex = db.users.findIndex(u => String(u.email).toLowerCase() === String(deletedItem.email).toLowerCase());
    if (userIndex !== -1) {
      db.users.splice(userIndex, 1);
    }
  }

  writeDb(db);

  res.json({
    message: `Item permanently deleted from ${collection}`,
    deletedItemId: id
  });
});

// AUTO CLEANUP - Remove items older than 10 days (can be called manually or by job scheduler)
recycleBinRouter.post("/cleanup/execute", authorize("admin"), (req, res) => {
  const db = readDb();
  let totalPermanentlyDeleted = 0;

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(db[collection])) continue;

    const initialLength = db[collection].length;

    db[collection] = db[collection].filter((entry) => {
      if (entry.isDeleted && isOlderThanDays(entry.deletedAt, 10)) {
        totalPermanentlyDeleted++;
        
        if (collection === "staff") {
          const userIndex = db.users.findIndex(u => String(u.email).toLowerCase() === String(entry.email).toLowerCase());
          if (userIndex !== -1) {
            db.users.splice(userIndex, 1);
          }
        }
        
        return false; // Remove from array
      }
      return true; // Keep in array
    });

    if (db[collection].length < initialLength) {
      console.log(`[Cleanup] Removed ${initialLength - db[collection].length} expired items from ${collection}`);
    }
  }

  writeDb(db);

  res.json({
    message: "Cleanup completed",
    itemsPermanentlyDeleted: totalPermanentlyDeleted,
    timestamp: new Date().toISOString()
  });
});

// EMPTY ENTIRE RECYCLE BIN (dangerous - admin only, requires confirmation)
recycleBinRouter.post("/empty-all", authorize("admin"), (req, res) => {
  if (req.body.confirm !== true) {
    return res.status(400).json({
      message: "This action will permanently delete all items in recycle bin. Send confirm: true to proceed."
    });
  }

  const db = readDb();
  let totalDeleted = 0;

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(db[collection])) continue;

    const initialLength = db[collection].length;
    db[collection] = db[collection].filter((entry) => {
      if (entry.isDeleted === true) {
        totalDeleted++;
        
        if (collection === "staff") {
          const userIndex = db.users.findIndex(u => String(u.email).toLowerCase() === String(entry.email).toLowerCase());
          if (userIndex !== -1) {
            db.users.splice(userIndex, 1);
          }
        }

        return false;
      }
      return true;
    });
  }

  writeDb(db);

  res.json({
    message: "Recycle bin emptied",
    itemsPermanentlyDeleted: totalDeleted,
    timestamp: new Date().toISOString()
  });
});

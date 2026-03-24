import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.inventory, getRequestedCompanyId(req)));
});

inventoryRouter.post("/", authorize("manager"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before creating inventory." });
  }
  const item = {
    id: nextId(db.inventory),
    companyId: company.id,
    companyName: company.name,
    partName: req.body.partName,
    category: req.body.category,
    partValue: req.body.partValue || "",
    packageType: req.body.packageType || "",
    stockQty: Number(req.body.stockQty || 0),
    lowStockThreshold: Number(req.body.lowStockThreshold || 5),
    unitCost: Number(req.body.unitCost || 0),
    datasheetUrl: req.body.datasheetUrl || "",
    supplier: req.body.supplier || ""
  };
  db.inventory.push(item);
  writeDb(db);
  res.status(201).json(item);
});

inventoryRouter.put("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  const item = db.inventory.find((entry) => entry.id === id);

  if (!item) {
    return res.status(404).json({ message: "Inventory item not found." });
  }

  Object.assign(item, {
    partName: req.body.partName ?? item.partName,
    category: req.body.category ?? item.category,
    partValue: req.body.partValue ?? item.partValue,
    packageType: req.body.packageType ?? item.packageType,
    stockQty: req.body.stockQty !== undefined ? Number(req.body.stockQty) : item.stockQty,
    lowStockThreshold: req.body.lowStockThreshold !== undefined ? Number(req.body.lowStockThreshold) : item.lowStockThreshold,
    unitCost: req.body.unitCost !== undefined ? Number(req.body.unitCost) : item.unitCost,
    datasheetUrl: req.body.datasheetUrl ?? item.datasheetUrl,
    supplier: req.body.supplier ?? item.supplier
  });

  writeDb(db);
  res.json(item);
});

inventoryRouter.delete("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.inventory = db.inventory.filter((entry) => entry.id !== id);
  writeDb(db);
  res.status(204).send();
});

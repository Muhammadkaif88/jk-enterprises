import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";
import { getRequestedCompanyId, resolveCompany, scopeRecords } from "../services/companyScope.js";

export const projectsRouter = Router();

projectsRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(scopeRecords(db.projects, getRequestedCompanyId(req)));
});

projectsRouter.post("/", authorize("manager"), (req, res) => {
  const db = readDb();
  const company = resolveCompany(db, req.body.companyId);
  if (!company) {
    return res.status(400).json({ message: "Select a valid company before creating a project." });
  }
  const bom = Array.isArray(req.body.bom) ? req.body.bom : [];

  for (const bomItem of bom) {
    const inventoryItem = db.inventory.find((item) => item.id === Number(bomItem.inventoryId));
    if (!inventoryItem) {
      return res.status(400).json({ message: `Inventory item ${bomItem.inventoryId} not found.` });
    }
  }

  const project = {
    id: nextId(db.projects),
    companyId: company.id,
    companyName: company.name,
    projectName: req.body.projectName,
    clientName: req.body.clientName || "",
    status: req.body.status || "rd",
    documentationLink: req.body.documentationLink || "",
    firmwareLink: req.body.firmwareLink || "",
    circuitDiagramLink: req.body.circuitDiagramLink || "",
    codeLink: req.body.codeLink || "",
    componentNotes: req.body.componentNotes || "",
    projectDetails: req.body.projectDetails || "",
    projectCode: req.body.projectCode || "",
    usedComponents: Array.isArray(req.body.usedComponents) ? req.body.usedComponents.filter(Boolean) : [],
    notes: req.body.notes || "",
    circuitAttachments: Array.isArray(req.body.circuitAttachments) ? req.body.circuitAttachments : [],
    projectFiles: Array.isArray(req.body.projectFiles) ? req.body.projectFiles : [],
    imageAttachments: Array.isArray(req.body.imageAttachments) ? req.body.imageAttachments : [],
    bom: bom.map((item) => ({
      inventoryId: Number(item.inventoryId),
      quantity: Number(item.quantity)
    })),
    ideaSourceId: req.body.ideaSourceId || null,
    createdAt: new Date().toISOString()
  };

  db.projects.unshift(project);

  if (project.ideaSourceId) {
    const note = db.notes.find((entry) => entry.id === Number(project.ideaSourceId));
    if (note) {
      note.isConverted = true;
    }
  }

  writeDb(db);
  res.status(201).json(project);
});

projectsRouter.put("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const project = db.projects.find((entry) => entry.id === Number(req.params.id));
  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  Object.assign(project, {
    projectName: req.body.projectName ?? project.projectName,
    clientName: req.body.clientName ?? project.clientName,
    status: req.body.status ?? project.status,
    documentationLink: req.body.documentationLink ?? project.documentationLink,
    firmwareLink: req.body.firmwareLink ?? project.firmwareLink,
    circuitDiagramLink: req.body.circuitDiagramLink ?? project.circuitDiagramLink,
    codeLink: req.body.codeLink ?? project.codeLink,
    componentNotes: req.body.componentNotes ?? project.componentNotes,
    projectDetails: req.body.projectDetails ?? project.projectDetails,
    projectCode: req.body.projectCode ?? project.projectCode,
    usedComponents: Array.isArray(req.body.usedComponents) ? req.body.usedComponents.filter(Boolean) : project.usedComponents,
    notes: req.body.notes ?? project.notes,
    circuitAttachments: Array.isArray(req.body.circuitAttachments) ? req.body.circuitAttachments : project.circuitAttachments,
    projectFiles: Array.isArray(req.body.projectFiles) ? req.body.projectFiles : project.projectFiles,
    imageAttachments: Array.isArray(req.body.imageAttachments) ? req.body.imageAttachments : project.imageAttachments,
    bom: req.body.bom ? req.body.bom.map((item) => ({
      inventoryId: Number(item.inventoryId),
      quantity: Number(item.quantity)
    })) : project.bom,
    ideaSourceId: req.body.ideaSourceId ?? project.ideaSourceId
  });

  writeDb(db);
  res.json(project);
});

projectsRouter.delete("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.projects = db.projects.filter((entry) => entry.id !== id);
  writeDb(db);
  res.status(204).send();
});

import { Router } from "express";
import { authorize } from "../middleware/rbac.js";
import { nextId, readDb, writeDb } from "../data/store.js";

export const notesRouter = Router();

notesRouter.get("/", authorize("technician"), (req, res) => {
  const db = readDb();
  res.json(db.notes);
});

notesRouter.post("/", authorize("technician"), (req, res) => {
  const db = readDb();
  const note = {
    id: nextId(db.notes),
    title: req.body.title,
    content: req.body.content,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    isConverted: false,
    createdAt: new Date().toISOString()
  };
  db.notes.unshift(note);
  writeDb(db);
  res.status(201).json(note);
});

notesRouter.put("/:id", authorize("technician"), (req, res) => {
  const db = readDb();
  const note = db.notes.find((entry) => entry.id === Number(req.params.id));
  if (!note) {
    return res.status(404).json({ message: "Idea note not found." });
  }
  Object.assign(note, {
    title: req.body.title ?? note.title,
    content: req.body.content ?? note.content,
    tags: req.body.tags ?? note.tags,
    isConverted: req.body.isConverted ?? note.isConverted
  });
  writeDb(db);
  res.json(note);
});

notesRouter.delete("/:id", authorize("manager"), (req, res) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.notes = db.notes.filter((entry) => entry.id !== id);
  writeDb(db);
  res.status(204).send();
});

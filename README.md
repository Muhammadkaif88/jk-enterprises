# Electronics & Robotics Management System

Starter full-stack ERMS for company control, inventory, finance, projects, idea capture, and staff permissions.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database path today: JSON file persistence for quick startup
- Database target: PostgreSQL schema included in `docs/schema.sql`

## Modules

- RBAC-aware dashboard with role switching
- Inventory CRUD with low-stock highlighting
- Finance logs for purchases, income, and expenses
- Project Vault with BOM-based inventory deduction
- Idea Lab with note conversion into projects
- Team management and expertise tracking

## Run

Install dependencies in the workspace root:

```bash
npm.cmd install
```

Start backend:

```bash
npm.cmd run dev:server
```

Start frontend:

```bash
npm.cmd run dev:client
```

Backend default URL: `http://localhost:4000`

Frontend default URL: `http://localhost:5173`

## Notes

- API access rules are role-aware through the `x-role` header or the frontend role picker.
- The backend auto-creates `server/src/data/db.json` with starter records.
- `docs/schema.sql` shows the PostgreSQL version of the data model for production migration.

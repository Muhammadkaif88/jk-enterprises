import { readDb } from "../data/store.js";

function getAccessibleCompanyIds(user) {
  return [...new Set([user?.companyId, user?.secondaryCompanyId].map((value) => Number(value)).filter(Boolean))];
}

export function getRequestedCompanyId(req) {
  const raw = req.query.companyId || req.header("x-company-id") || "all";
  const currentUserEmail = String(req.header("x-user-email") || "").trim().toLowerCase();
  if (!currentUserEmail) {
    return raw === "all" ? "all" : Number(raw);
  }

  const db = readDb();
  const currentUser = (db.users || []).find(
    (entry) => String(entry.email || "").trim().toLowerCase() === currentUserEmail && entry.approvalStatus === "approved"
  );

  if (!currentUser || currentUser.role === "admin") {
    return raw === "all" ? "all" : Number(raw);
  }

  const accessibleCompanyIds = getAccessibleCompanyIds(currentUser);
  if (!accessibleCompanyIds.length) {
    return raw === "all" ? "all" : Number(raw);
  }

  if (raw === "all") {
    return accessibleCompanyIds[0];
  }

  const requestedCompanyId = Number(raw);
  return accessibleCompanyIds.includes(requestedCompanyId) ? requestedCompanyId : accessibleCompanyIds[0];
}

export function scopeRecords(records, companyId) {
  if (companyId === "all") {
    return records;
  }
  return records.filter((entry) => Number(entry.companyId) === Number(companyId));
}

export function resolveCompany(db, companyId) {
  return db.companies.find((entry) => entry.id === Number(companyId)) || null;
}

export function getRequestedCompanyId(req) {
  const raw = req.query.companyId || req.header("x-company-id") || "all";
  return raw === "all" ? "all" : Number(raw);
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

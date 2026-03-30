import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(moduleDir, "../../..");
const dataDir = path.join(projectRoot, ".erms-data");
const dbPath = path.join(dataDir, "db.json");
const backupDbPath = path.join(dataDir, "db.backup.json");
const legacyDbPaths = [
  path.join(moduleDir, "db.json"),
  path.join(projectRoot, "src/data/db.json")
];

const seedData = {
  companies: [
    {
      id: 1,
      name: "Edukkit",
      code: "edukkit",
      address: "Raihsoft Technologies, 1st Floor Pandikkad, Malappuram, Kerala 676521, India",
      phone: "+91 90370 65029",
      email: "edukkitofficial@gmail.com",
      bankName: "Kotak811 Bank",
      accountNumber: "7049752112",
      ifsc: "KKBK0009308",
      upiId: "8075100930@kotak811",
      totalValuation: 10000000
    },
    {
      id: 2,
      name: "3D.Objex",
      code: "3d-objex",
      address: "Prototype Service Studio, Malappuram, Kerala",
      phone: "+91 80751 00930",
      email: "sales@3dobjex.local",
      bankName: "Kotak811 Bank",
      accountNumber: "7049752112",
      ifsc: "KKBK0009308",
      upiId: "8075100930@kotak811",
      totalValuation: 5000000
    },
    {
      id: 3,
      name: "Qisa Cafe",
      code: "qisa-cafe",
      address: "Qisa Cafe, Malappuram, Kerala",
      phone: "+91 80751 00930",
      email: "hello@qisacafe.local",
      bankName: "Kotak811 Bank",
      accountNumber: "7049752112",
      ifsc: "KKBK0009308",
      upiId: "8075100930@kotak811",
      totalValuation: 2000000
    }
  ],
  staff: [
    {
      id: 1,
      fullName: "Muhammed Kaif",
      email: "owner@jkcompy.local",
      role: "admin",
      staffCategory: "Owner",
      companyId: 1,
      companyName: "Edukkit",
      expertise: "Management",
      attendanceStatus: "Present",
      assignedTask: "Executive oversight",
      salary: 0
    }
  ],
  inventory: [],
  finance: [],
  projects: [],
  notes: [],
  attendanceLogs: [],
  doubtClearance: [],
  complaints: [],
  tasks: [],
  billing: [],
  investments: [],
  salaries: [],
  users: [
    {
      id: 1,
      email: "owner@jkcompy.local",
      password: "admin",
      role: "admin",
      fullName: "Muhammed Kaif",
      companyId: 1,
      companyName: "Edukkit",
      approvalStatus: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: "System"
    }
  ],
  investorTransactions: []
};

let currentCompanies = seedData.companies;

function getCompanyMeta(companyId) {
  return currentCompanies.find((entry) => entry.id === Number(companyId)) || currentCompanies[0];
}

function normalizeCompany(company) {
  return {
    totalValuation: 10000000,
    ...company
  };
}

function withCompany(item, fallbackCompanyId = 1) {
  const company = getCompanyMeta(item.companyId ?? fallbackCompanyId);
  return {
    ...item,
    companyId: company.id,
    companyName: company.name
  };
}

function normalizeProject(project) {
  const normalizedProject = withCompany({
    documentationLink: "",
    firmwareLink: "",
    circuitDiagramLink: "",
    codeLink: "",
    componentNotes: "",
    projectDetails: "",
    projectCode: "",
    usedComponents: [],
    circuitAttachments: [],
    projectFiles: [],
    imageAttachments: [],
    bom: [],
    ...project
  });

  return {
    ...normalizedProject,
    usedComponents: Array.isArray(normalizedProject.usedComponents)
      ? normalizedProject.usedComponents.filter(Boolean)
      : String(normalizedProject.componentNotes || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    circuitAttachments: Array.isArray(normalizedProject.circuitAttachments) ? normalizedProject.circuitAttachments : [],
    projectFiles: Array.isArray(normalizedProject.projectFiles) ? normalizedProject.projectFiles : [],
    imageAttachments: Array.isArray(normalizedProject.imageAttachments) ? normalizedProject.imageAttachments : [],
    bom: Array.isArray(normalizedProject.bom) ? normalizedProject.bom : []
  };
}

function normalizeTask(task) {
  const normalizedTask = withCompany({
    projectName: "",
    startDate: "",
    dueDate: "",
    priority: "Low",
    status: "todo",
    secondaryAssigneeId: 0,
    secondaryAssigneeName: "",
    assigneeNames: "",
    ...task
  });

  return {
    ...normalizedTask,
    secondaryAssigneeId: Number(normalizedTask.secondaryAssigneeId || 0),
    secondaryAssigneeName: normalizedTask.secondaryAssigneeName || "",
    assigneeNames:
      normalizedTask.assigneeNames ||
      [normalizedTask.assigneeName, normalizedTask.secondaryAssigneeName].filter(Boolean).join(", ")
  };
}

function normalizeBillingEntry(entry) {
  const invoiceYear = String((entry.invoiceDate || new Date().toISOString().slice(0, 10)).slice(0, 4) || new Date().getFullYear());
  const numericInvoice = String(entry.invoiceNumber || "").replace(/\D/g, "");
  const normalizedInvoiceNumber =
    numericInvoice.length >= 8
      ? numericInvoice
      : `${invoiceYear}${String(entry.id || 1).padStart(4, "0")}`;
  const lineItems =
    entry.lineItems && entry.lineItems.length
      ? entry.lineItems
      : entry.description || entry.amount
        ? [
            {
              description: entry.description || entry.billType || "Billing item",
              qty: 1,
              price: Number(entry.amount || 0),
              total: Number(entry.amount || 0)
            }
          ]
        : [];
  const computedSubtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.total ?? Number(item.qty || 0) * Number(item.price || 0)),
    0
  );
  const subtotal = entry.subtotal && Number(entry.subtotal) > 0 ? Number(entry.subtotal) : computedSubtotal;
  const discount = Number(entry.discount || 0);
  const paidAmount = Number(entry.paidAmount || 0);
  const amount = entry.amount ?? subtotal - discount;

  return withCompany({
    billType: "Invoice",
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    description: "",
    status: "Draft",
    invoiceDate: "",
    dueDate: "",
    paymentMethod: "Bank / UPI",
    ...entry,
    invoiceNumber: normalizedInvoiceNumber,
    lineItems,
    inventoryAdjustments: entry.inventoryAdjustments || [],
    financeLogId: entry.financeLogId || null,
    subtotal,
    discount,
    paidAmount,
    amount,
    balanceDue: amount - paidAmount
  });
}

function normalizeStaff(entry) {
  return withCompany({
    staffCategory: "",
    phone: "",
    secondaryCompanyId: null,
    secondaryCompanyName: "",
    dailyWage: entry.dailyWage || Math.round((entry.salary || 0) / 22),
    ...entry
  });
}

function normalizeSalary(entry) {
  const baseAmount = Number(entry.baseAmount || (entry.workUnits || 0) * (entry.dailyWage || 0));
  const finalAmount = entry.finalAmount ?? (baseAmount + Number(entry.bonus || 0) - Number(entry.deduction || 0));
  
  return withCompany({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workUnits: 0,
    dailyWage: 0,
    baseAmount,
    bonus: 0,
    deduction: 0,
    finalAmount,
    status: "pending",
    ...entry
  });
}

function normalizeUser(user) {
  const baseUser = {
    approvalStatus: "approved",
    staffCategory: "",
    phone: "",
    secondaryCompanyId: null,
    secondaryCompanyName: "",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    ...user
  };

  const normalizedUser =
    baseUser.companyId === null || baseUser.companyId === undefined || baseUser.companyId === ""
      ? {
          ...baseUser,
          companyId: null,
          companyName: baseUser.companyName || ""
        }
      : withCompany(baseUser, Number(baseUser.companyId));

  return {
    ...normalizedUser,
    secondaryCompanyId: baseUser.secondaryCompanyId ? Number(baseUser.secondaryCompanyId) : null,
    secondaryCompanyName:
      baseUser.secondaryCompanyId && currentCompanies.some((entry) => entry.id === Number(baseUser.secondaryCompanyId))
        ? getCompanyMeta(baseUser.secondaryCompanyId).name
        : baseUser.secondaryCompanyName || "",
    approvalStatus: normalizedUser.approvalStatus || "approved"
  };
}

function normalizeInvestment(entry) {
  return withCompany({
    contactNumber: "",
    investedFund: 0,
    returnedFund: 0,
    investedDate: "",
    returnDate: "",
    notes: "",
    equityPct: 0,
    ...entry
  });
}

function normalizeInvestorTransaction(entry) {
  return {
    investorId: null,
    type: "Investment In", // Investment In / Profit Payout Out
    amount: 0,
    method: "Cash", // Cash / UPI
    upiId: "",
    transactionId: "",
    receiptNumber: "",
    date: new Date().toISOString().slice(0, 10),
    ...entry
  };
}

function normalizeNote(entry) {
  const note = withCompany(entry);
  if (!note.details && note.content) {
    note.details = note.content;
    if (note.tags && note.tags.length) {
      note.details += "\nTags: " + note.tags.join(", ");
    }
  }
  note.ideaFiles = note.ideaFiles || [];
  return note;
}

function normalizeAttendanceLog(entry) {
  return withCompany({
    checkIn: "",
    checkOut: "",
    workedMinutes: 0,
    workedDuration: "",
    dayApprovalStatus: "",
    notes: "",
    ...entry
  });
}

function normalizeDb(data) {
  currentCompanies = data.companies || seedData.companies;

  // Build initial staff list from stored data
  const staffList = (data.staff || seedData.staff).map(normalizeStaff);
  const staffEmails = new Set(staffList.map((s) => String(s.email || "").toLowerCase()));

  // Backfill: create staff profiles for approved users who have none
  const users = (data.users || seedData.users).map(normalizeUser);
  let maxStaffId = staffList.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0);
  for (const user of users) {
    if (user.approvalStatus !== "approved") continue;
    const email = String(user.email || "").toLowerCase();
    if (staffEmails.has(email)) continue;
    staffEmails.add(email);
    maxStaffId += 1;
    staffList.push(
      normalizeStaff({
        id: maxStaffId,
        companyId: user.companyId || null,
        companyName: user.companyName || "",
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "technician",
        staffCategory: user.staffCategory || "",
        expertise: "",
        attendanceStatus: "Pending Assignment",
        assignedTask: "",
        salary: 0
      })
    );
  }

  return {
    ...seedData,
    ...data,
    companies: currentCompanies.map(normalizeCompany),
    staff: staffList,
    inventory: (data.inventory || seedData.inventory).map((entry) => withCompany(entry)),
    finance: (data.finance || seedData.finance).map((entry) => withCompany(entry)),
    projects: (data.projects || seedData.projects).map(normalizeProject),
    notes: (data.notes || seedData.notes).map(normalizeNote),
    attendanceLogs: (data.attendanceLogs || seedData.attendanceLogs).map(normalizeAttendanceLog),
    doubtClearance: (data.doubtClearance || seedData.doubtClearance).map((entry) => withCompany(entry)),
    complaints: (data.complaints || seedData.complaints).map((entry) => withCompany(entry)),
    tasks: (data.tasks || seedData.tasks).map(normalizeTask),
    billing: (data.billing || seedData.billing).map(normalizeBillingEntry),
    investments: (data.investments || seedData.investments).map(normalizeInvestment),
    investorTransactions: (data.investorTransactions || seedData.investorTransactions || []).map(normalizeInvestorTransaction),
    salaries: (data.salaries || seedData.salaries || []).map(normalizeSalary),
    users
  };
}

function pickLatestExistingPath(paths) {
  return paths
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => ({
      candidate,
      mtimeMs: fs.statSync(candidate).mtimeMs
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0]?.candidate || null;
}

function readRawDbFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function persistDbSnapshot(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(normalizeDb(data), null, 2));
}

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const migrationSource = pickLatestExistingPath(legacyDbPaths);
    if (migrationSource) {
      const migratedData = readRawDbFile(migrationSource);
      persistDbSnapshot(dbPath, migratedData);
      fs.copyFileSync(dbPath, backupDbPath);
      return;
    }

    persistDbSnapshot(dbPath, seedData);
    fs.copyFileSync(dbPath, backupDbPath);
  }
}

let cachedDb = null;
let dbLastRead = 0;

export function readDb() {
  ensureDb();
  try {
    const stats = fs.statSync(dbPath);
    if (cachedDb && stats.mtimeMs <= dbLastRead) {
      return cachedDb;
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    cachedDb = normalizeDb(JSON.parse(raw));
    dbLastRead = stats.mtimeMs;
    return cachedDb;
  } catch (err) {
    console.error("Error reading database:", err);
    try {
      if (fs.existsSync(backupDbPath)) {
        const backupData = normalizeDb(readRawDbFile(backupDbPath));
        persistDbSnapshot(dbPath, backupData);
        cachedDb = backupData;
        dbLastRead = fs.statSync(dbPath).mtimeMs;
        return backupData;
      }

      const legacySource = pickLatestExistingPath(legacyDbPaths);
      if (legacySource) {
        const legacyData = normalizeDb(readRawDbFile(legacySource));
        persistDbSnapshot(dbPath, legacyData);
        fs.copyFileSync(dbPath, backupDbPath);
        cachedDb = legacyData;
        dbLastRead = fs.statSync(dbPath).mtimeMs;
        return legacyData;
      }
    } catch (recoveryError) {
      console.error("Error recovering database:", recoveryError);
    }

    const safeSeed = normalizeDb(seedData);
    persistDbSnapshot(dbPath, safeSeed);
    fs.copyFileSync(dbPath, backupDbPath);
    return safeSeed;
  }
}

export function writeDb(data) {
  try {
    const normalizedData = normalizeDb(data);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupDbPath);
    }
    persistDbSnapshot(dbPath, normalizedData);
    cachedDb = normalizedData;
    dbLastRead = fs.statSync(dbPath).mtimeMs;
    return normalizedData;
  } catch (err) {
    console.error("Error writing database:", err);
    throw err;
  }
}

export function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(moduleDir, "../../..");
const dataDir = process.env.VERCEL ? "/tmp" : path.join(projectRoot, ".erms-data");
const dbPath = path.join(dataDir, "db.json");
const backupDbPath = path.join(dataDir, "db.backup.json");
const legacyDbPaths = [
  path.join(moduleDir, "db.json"),
  path.join(projectRoot, "src/data/db.json")
];

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })
  : null;

// Initialize Cloudflare R2 Client (S3 compatible)
const r2Client = (process.env.CLOUDFLARE_R2_ENDPOINT && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY)
  ? new S3Client({
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      region: "auto",
    })
  : null;

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
let activeInitPromise = null;
const CACHE_TTL_MS = 2000; // 2 seconds


// Recursive function to search and upload base64 image/file attachments to R2
async function processBase64Uploads(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await processBase64Uploads(obj[i]);
    }
    return obj;
  }

  // If this object is an attachment with a base64 dataUrl
  if (obj.dataUrl && typeof obj.dataUrl === "string" && obj.dataUrl.startsWith("data:")) {
    try {
      obj.dataUrl = await uploadBase64ToR2(obj.dataUrl, obj.name);
    } catch (err) {
      console.error(`Failed to upload ${obj.name || "file"} to Cloudflare R2:`, err);
    }
  }

  // Recurse into other properties
  for (const key of Object.keys(obj)) {
    if (key !== "dataUrl") {
      obj[key] = await processBase64Uploads(obj[key]);
    }
  }

  return obj;
}

// Upload a single base64 data url file to R2
async function uploadBase64ToR2(base64Str, fileName) {
  if (!r2Client) {
    console.warn("Cloudflare R2 is not configured. Base64 file will be stored in database.");
    return base64Str;
  }

  const match = base64Str.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return base64Str;

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Create unique key
  const cleanFileName = (fileName || "file").replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanFileName}`;

  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueName,
      Body: buffer,
      ContentType: contentType,
    })
  );

  let publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrlBase) {
    publicUrlBase = `${process.env.CLOUDFLARE_R2_ENDPOINT}/${bucketName}`;
  }

  const separator = publicUrlBase.endsWith("/") ? "" : "/";
  return `${publicUrlBase}${separator}${uniqueName}`;
}

async function saveDbToSupabase(data) {
  if (!supabase) return;
  const { error } = await supabase
    .from("erms_db")
    .upsert({ id: 1, data });
  if (error) {
    throw error;
  }
}

export async function initDb(force = false) {
  const now = Date.now();
  
  // If a fetch is already in progress and we are not forcing a refresh, await and return it
  if (activeInitPromise && !force) {
    return activeInitPromise;
  }

  // If cache is fresh and we are not forcing a refresh, return cached state
  if (cachedDb && !force && (now - dbLastRead < CACHE_TTL_MS)) {
    return cachedDb;
  }

  activeInitPromise = (async () => {
    try {
      if (!supabase) {
        console.log("Supabase is not configured. Using local JSON store.");
        ensureDb();
        const raw = fs.readFileSync(dbPath, "utf-8");
        cachedDb = normalizeDb(JSON.parse(raw));
        dbLastRead = Date.now();
        return cachedDb;
      }

      console.log("Fetching database state from Supabase...");
      const { data, error } = await supabase
        .from("erms_db")
        .select("data")
        .eq("id", 1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No existing database row found in Supabase. Seeding from local file...");
          ensureDb();
          const raw = fs.readFileSync(dbPath, "utf-8");
          const localData = normalizeDb(JSON.parse(raw));

          console.log("Uploading seed database to Supabase...");
          const { error: insertError } = await supabase
            .from("erms_db")
            .upsert({ id: 1, data: localData });

          if (insertError) throw insertError;
          cachedDb = localData;
          dbLastRead = Date.now();
        } else {
          throw error;
        }
      } else {
        console.log("Successfully loaded database state from Supabase!");
        cachedDb = normalizeDb(data.data);
        dbLastRead = Date.now();
      }
    } catch (err) {
      console.error("Failed to load database from Supabase, falling back to local file:", err);
      ensureDb();
      const raw = fs.readFileSync(dbPath, "utf-8");
      cachedDb = normalizeDb(JSON.parse(raw));
      dbLastRead = Date.now();
    } finally {
      activeInitPromise = null;
    }
    return cachedDb;
  })();

  return activeInitPromise;
}

export function readDb() {
  if (!cachedDb) {
    ensureDb();
    const raw = fs.readFileSync(dbPath, "utf-8");
    cachedDb = normalizeDb(JSON.parse(raw));
    dbLastRead = Date.now();
  }
  return cachedDb;
}

export let pendingWrites = [];

export function writeDb(data) {
  try {
    const normalizedData = normalizeDb(data);
    cachedDb = normalizedData;
    dbLastRead = Date.now();

    // Local file write backup
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(normalizedData, null, 2));
    } catch (err) {
      console.error("Failed to write local backup:", err);
    }

    // Trigger async processing & cloud save
    const writePromise = (async () => {
      // 1. Process base64 files and upload to R2
      const processedData = await processBase64Uploads(normalizedData);
      cachedDb = processedData;

      // Local write updated backup
      try {
        fs.writeFileSync(dbPath, JSON.stringify(processedData, null, 2));
      } catch (err) {
        console.error("Failed to write local processed backup:", err);
      }

      // 2. Upload to Supabase database
      if (supabase) {
        await saveDbToSupabase(processedData);
        console.log("Database state synced with Supabase successfully.");
      }
    })();

    pendingWrites.push(writePromise);
    writePromise.finally(() => {
      const idx = pendingWrites.indexOf(writePromise);
      if (idx !== -1) {
        pendingWrites.splice(idx, 1);
      }
    });

    return normalizedData;
  } catch (err) {
    console.error("Error writing database:", err);
    throw err;
  }
}

export function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

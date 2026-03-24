import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve("src/data/db.json");

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
      upiId: "8075100930@kotak811"
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
      upiId: "8075100930@kotak811"
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
      upiId: "8075100930@kotak811"
    }
  ],
  staff: [
    {
      id: 1,
      fullName: "Muhammed Kaif",
      email: "owner@jkcompy.local",
      role: "admin",
      staffCategory: "Robotic Engineer",
      companyId: 1,
      companyName: "Edukkit",
      expertise: "Operations, finance, embedded systems",
      attendanceStatus: "Present",
      assignedTask: "Executive oversight",
      salary: 0
    },
    {
      id: 2,
      fullName: "Lead Robotics Engineer",
      email: "lead@jkcompy.local",
      role: "manager",
      staffCategory: "Robotic Engineer",
      companyId: 2,
      companyName: "3D.Objex",
      expertise: "PID control, mechatronics, prototyping",
      attendanceStatus: "Present",
      assignedTask: "Agri-bot validation",
      salary: 65000
    },
    {
      id: 3,
      fullName: "Lab Technician",
      email: "tech@jkcompy.local",
      role: "technician",
      staffCategory: "Trainer",
      companyId: 1,
      companyName: "Edukkit",
      expertise: "Soldering, inventory handling, Arduino labs",
      attendanceStatus: "Present",
      assignedTask: "Drawer audit",
      salary: 28000
    }
  ],
  inventory: [
    {
      id: 1,
      companyId: 2,
      companyName: "3D.Objex",
      partName: "Nema 17 Stepper Motor",
      category: "Motor",
      partValue: "1.8 Degree",
      packageType: "Module",
      stockQty: 14,
      lowStockThreshold: 6,
      unitCost: 780,
      datasheetUrl: "https://example.com/nema17.pdf",
      supplier: "Robotics Hub"
    },
    {
      id: 2,
      companyId: 1,
      companyName: "Edukkit",
      partName: "HC-SR04 Ultrasonic Sensor",
      category: "Sensor",
      partValue: "40kHz",
      packageType: "Module",
      stockQty: 9,
      lowStockThreshold: 10,
      unitCost: 85,
      datasheetUrl: "https://example.com/hcsr04.pdf",
      supplier: "Sensor World"
    },
    {
      id: 3,
      companyId: 1,
      companyName: "Edukkit",
      partName: "ATmega328P",
      category: "MCU",
      partValue: "8-bit AVR",
      packageType: "DIP",
      stockQty: 21,
      lowStockThreshold: 8,
      unitCost: 190,
      datasheetUrl: "https://example.com/atmega328p.pdf",
      supplier: "Embedded Mart"
    }
  ],
  finance: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      transactionType: "income",
      amount: 45000,
      description: "Client payment for line follower robot batch",
      createdAt: "2026-03-18T10:00:00.000Z"
    },
    {
      id: 2,
      companyId: 1,
      companyName: "Edukkit",
      transactionType: "purchase",
      amount: 12500,
      description: "Bulk purchase of lab consumables",
      createdAt: "2026-03-19T09:00:00.000Z"
    },
    {
      id: 3,
      companyId: 3,
      companyName: "Qisa Cafe",
      transactionType: "expense",
      amount: 8000,
      description: "Electricity and rent allocation",
      createdAt: "2026-03-20T09:00:00.000Z"
    }
  ],
  projects: [
    {
      id: 1,
      companyId: 2,
      companyName: "3D.Objex",
      projectName: "Smart Agri-Bot v2",
      clientName: "Internal R&D",
      status: "testing",
      documentationLink: "https://example.com/agri-bot-docs",
      firmwareLink: "https://github.com/example/agri-bot",
      circuitDiagramLink: "https://example.com/agri-bot-circuit",
      codeLink: "https://github.com/example/agri-bot-firmware",
      componentNotes: "Uses dual stepper drive, ultrasonic sensing, moisture relay, and AVR controller board.",
      projectDetails: "Autonomous agriculture prototype with obstacle avoidance and moisture-triggered actions.",
      notes: "Field moisture navigation tuning in progress",
      imageAttachments: [],
      bom: [
        { inventoryId: 1, quantity: 2 },
        { inventoryId: 2, quantity: 2 }
      ],
      ideaSourceId: null,
      createdAt: "2026-03-17T11:00:00.000Z"
    }
  ],
  notes: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      title: "PID Control improvement",
      content: "Use filtered derivative term for motor stabilization on rough terrain.",
      tags: ["PID_Control", "AgriBot"],
      isConverted: false,
      createdAt: "2026-03-21T08:00:00.000Z"
    }
  ],
  attendanceLogs: [
    {
      id: 1,
      companyId: 2,
      companyName: "3D.Objex",
      staffId: 2,
      staffName: "Lead Robotics Engineer",
      date: "2026-03-23",
      status: "Present",
      checkIn: "09:05",
      checkOut: "18:20",
      notes: "Reviewed agri-bot motor tuning"
    },
    {
      id: 2,
      companyId: 1,
      companyName: "Edukkit",
      staffId: 3,
      staffName: "Lab Technician",
      date: "2026-03-23",
      status: "Late",
      checkIn: "10:10",
      checkOut: "18:05",
      notes: "Component drawer recount"
    }
  ],
  doubtClearance: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      staffId: 3,
      staffName: "Lab Technician",
      topic: "Motor driver overheating",
      question: "Need review on current limiting for BTS7960 setup.",
      response: "Add heatsink and reduce peak duty cycle during stall tests.",
      priority: "High",
      status: "Resolved",
      createdAt: "2026-03-22T11:30:00.000Z",
      resolvedAt: "2026-03-22T13:15:00.000Z"
    }
  ],
  complaints: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      staffId: 3,
      staffName: "Lab Technician",
      complaintType: "Lab support",
      subject: "Insufficient soldering stations",
      description: "Two soldering benches are frequently unavailable during workshop hours.",
      status: "Open",
      resolution: "",
      createdAt: "2026-03-21T09:45:00.000Z"
    }
  ],
  tasks: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      title: "Prepare robotics workshop kit",
      description: "Assemble starter kits and testing checklist for next batch.",
      assigneeId: 3,
      assigneeName: "Lab Technician",
      priority: "High",
      status: "todo",
      dueDate: "2026-03-25",
      createdAt: "2026-03-23T08:30:00.000Z"
    },
    {
      id: 2,
      companyId: 3,
      companyName: "Qisa Cafe",
      title: "Review weekly cafe expense sheet",
      description: "Validate purchase entries and cash counter mismatch.",
      assigneeId: 1,
      assigneeName: "Muhammed Kaif",
      priority: "Medium",
      status: "in-progress",
      dueDate: "2026-03-24",
      createdAt: "2026-03-23T09:15:00.000Z"
    }
  ],
  billing: [
    {
      id: 1,
      companyId: 1,
      companyName: "Edukkit",
      billType: "Service Charge",
      invoiceNumber: "20260011",
      customerName: "Thanseeh M",
      customerAddress: "Eranad Knowledge City College, Elankur Wandoor Rd, Manjeri, Kerala 676122",
      customerPhone: "+91 90370 65029",
      description: "LIFI Data Transfer System service charge",
      lineItems: [
        { description: "LIFI Data Transfer System Service Charge", qty: 1, price: 2500, total: 2500 },
        { description: "16x2 LCD JHD Display", qty: 1, price: 190, total: 190 },
        { description: "LCD I2C Adapter Module", qty: 1, price: 65, total: 65 },
        { description: "Mini Breadboard", qty: 1, price: 35, total: 35 },
        { description: "LDR Sensor Module", qty: 1, price: 45, total: 45 },
        { description: "Nano With C Type USB ATmega328P", qty: 1, price: 270, total: 270 }
      ],
      subtotal: 3105,
      discount: 105,
      paidAmount: 0,
      balanceDue: 3000,
      paymentMethod: "Bank / UPI",
      amount: 3000,
      status: "Paid",
      invoiceDate: "2026-03-20",
      dueDate: "2026-03-25"
    },
    {
      id: 2,
      companyId: 2,
      companyName: "3D.Objex",
      billType: "Printing Service",
      invoiceNumber: "20260012",
      customerName: "Prototype Client",
      customerAddress: "",
      customerPhone: "",
      description: "Custom enclosure print job",
      lineItems: [
        { description: "Custom enclosure 3D print", qty: 1, price: 6500, total: 6500 }
      ],
      subtotal: 6500,
      discount: 0,
      paidAmount: 0,
      balanceDue: 6500,
      paymentMethod: "Bank Transfer",
      amount: 6500,
      status: "Sent",
      invoiceDate: "2026-03-22",
      dueDate: "2026-03-27"
    }
  ],
  users: [
    {
      id: 1,
      email: "owner@jkcompy.local",
      password: "admin", // Plain text for now as per minimal requirements, can be hashed later
      role: "admin",
      fullName: "Muhammed Kaif",
      companyId: 1,
      companyName: "Edukkit",
      approvalStatus: "approved",
      approvedAt: "2026-03-20T08:00:00.000Z",
      approvedBy: "System"
    }
  ]
};

let currentCompanies = seedData.companies;

function getCompanyMeta(companyId) {
  return currentCompanies.find((entry) => entry.id === Number(companyId)) || currentCompanies[0];
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
    ...entry
  });
}

function normalizeUser(user) {
  const baseUser = {
    approvalStatus: "approved",
    staffCategory: "",
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
    approvalStatus: normalizedUser.approvalStatus || "approved"
  };
}

function normalizeDb(data) {
  currentCompanies = data.companies || seedData.companies;
  return {
    ...seedData,
    ...data,
    companies: currentCompanies,
    staff: (data.staff || seedData.staff).map(normalizeStaff),
    inventory: (data.inventory || seedData.inventory).map((entry) => withCompany(entry)),
    finance: (data.finance || seedData.finance).map((entry) => withCompany(entry)),
    projects: (data.projects || seedData.projects).map(normalizeProject),
    notes: (data.notes || seedData.notes).map((entry) => withCompany(entry)),
    attendanceLogs: (data.attendanceLogs || seedData.attendanceLogs).map((entry) => withCompany(entry)),
    doubtClearance: (data.doubtClearance || seedData.doubtClearance).map((entry) => withCompany(entry)),
    complaints: (data.complaints || seedData.complaints).map((entry) => withCompany(entry)),
    tasks: (data.tasks || seedData.tasks).map(normalizeTask),
    billing: (data.billing || seedData.billing).map(normalizeBillingEntry),
    users: (data.users || seedData.users).map(normalizeUser)
  };
}

function ensureDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2));
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
    // Fallback if db.json is corrupted
    return normalizeDb(seedData);
  }
}

export function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    cachedDb = data;
    dbLastRead = Date.now();
    return data;
  } catch (err) {
    console.error("Error writing database:", err);
    throw err;
  }
}

export function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

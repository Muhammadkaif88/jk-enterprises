import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve("src/data/db.json");

const seedData = {
  staff: [
    {
      id: 1,
      fullName: "Muhammed Kaif",
      email: "owner@jkcompy.local",
      role: "admin",
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
      expertise: "Soldering, inventory handling, Arduino labs",
      attendanceStatus: "Present",
      assignedTask: "Drawer audit",
      salary: 28000
    }
  ],
  inventory: [
    {
      id: 1,
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
      transactionType: "income",
      amount: 45000,
      description: "Client payment for line follower robot batch",
      createdAt: "2026-03-18T10:00:00.000Z"
    },
    {
      id: 2,
      transactionType: "purchase",
      amount: 12500,
      description: "Bulk purchase of lab consumables",
      createdAt: "2026-03-19T09:00:00.000Z"
    },
    {
      id: 3,
      transactionType: "expense",
      amount: 8000,
      description: "Electricity and rent allocation",
      createdAt: "2026-03-20T09:00:00.000Z"
    }
  ],
  projects: [
    {
      id: 1,
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
  users: [
    {
      id: 1,
      email: "owner@jkcompy.local",
      password: "admin", // Plain text for now as per minimal requirements, can be hashed later
      role: "admin",
      fullName: "Muhammed Kaif"
    }
  ]
};

function normalizeProject(project) {
  return {
    documentationLink: "",
    firmwareLink: "",
    circuitDiagramLink: "",
    codeLink: "",
    componentNotes: "",
    projectDetails: "",
    imageAttachments: [],
    bom: [],
    ...project
  };
}

function normalizeDb(data) {
  return {
    ...seedData,
    ...data,
    staff: data.staff || seedData.staff,
    inventory: data.inventory || seedData.inventory,
    finance: data.finance || seedData.finance,
    projects: (data.projects || seedData.projects).map(normalizeProject),
    notes: data.notes || seedData.notes,
    attendanceLogs: data.attendanceLogs || seedData.attendanceLogs,
    doubtClearance: data.doubtClearance || seedData.doubtClearance,
    complaints: data.complaints || seedData.complaints,
    users: data.users || seedData.users
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

export function readDb() {
  ensureDb();
  const db = normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf-8")));
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return db;
}

export function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  return data;
}

export function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

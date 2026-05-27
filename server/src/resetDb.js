import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(moduleDir, "../.env") });

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

async function reset() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Supabase URL:", supabaseUrl);
  if (supabaseUrl && supabaseServiceRoleKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
    console.log("Resetting database state in Supabase...");
    const { error } = await supabase
      .from("erms_db")
      .upsert({ id: 1, data: seedData });

    if (error) {
      console.error("Failed to reset Supabase database:", error);
    } else {
      console.log("Successfully reset database state in Supabase!");
    }
  } else {
    console.warn("Supabase credentials not found. Local reset only.");
  }

  // Also write locally
  const dataDir = path.resolve(moduleDir, "../../.erms-data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "db.json");
  fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2));
  console.log("Successfully reset local db.json!");
}

reset();

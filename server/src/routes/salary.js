import express from 'express';
import { readDb, writeDb, nextId } from '../data/store.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Helper to map attendance status to work units
const statusToUnits = (status) => {
  switch (status) {
    case 'Present': return 1.0;
    case 'Three Quarters': return 0.75;
    case 'Late': return 0.75; // Mapping Late to 0.75 as per user's 3/4 day concept
    case 'Half Day': return 0.5;
    case 'Absent': return 0;
    default: return 1.0; // Default to full day if Present but not specifically mapped
  }
};

// GET /api/salaries - Get all salaries for a month/year
router.get('/', authorize('technician'), (req, res) => {
  const { month, year } = req.query;
  const db = readDb();
  
  let filtered = db.salaries || [];
  if (month) filtered = filtered.filter(s => s.month === Number(month));
  if (year) filtered = filtered.filter(s => s.year === Number(year));
  
  // Role-based filtering
  if (req.role === 'technician') {
    // Technicians only see their own salary
    // Match by staff entry linked to user email
    const staffMember = db.staff.find(s => String(s.email).toLowerCase() === String(req.user.email).toLowerCase());
    if (staffMember) {
      filtered = filtered.filter(s => s.staffId === staffMember.id);
    } else {
      filtered = [];
    }
  } else if (req.role === 'manager') {
    // Managers only see their company's staff
    filtered = filtered.filter(s => s.companyId === req.user.companyId);
  }

  res.json(filtered);
});

// POST /api/salaries/calculate - Generate/Sync salaries for a month
router.post('/calculate', authorize('manager'), (req, res) => {
  const { month, year, companyId } = req.body;
  if (!month || !year) return res.status(400).json({ message: "Month and year required" });

  const db = readDb();
  const staffToProcess = db.staff.filter(s => !companyId || s.companyId === Number(companyId));
  const logs = db.attendanceLogs.filter(l => {
    const logDate = new Date(l.date);
    return (logDate.getMonth() + 1) === Number(month) && logDate.getFullYear() === Number(year);
  });

  const updatedSalaries = [...db.salaries];
  
  staffToProcess.forEach(staff => {
    const staffLogs = logs.filter(l => l.staffId === staff.id);
    const workUnits = staffLogs.reduce((sum, log) => sum + statusToUnits(log.status), 0);
    
    // Check if record exists
    const existingIndex = updatedSalaries.findIndex(s => 
      s.staffId === staff.id && s.month === Number(month) && s.year === Number(year)
    );

    const salaryData = {
      staffId: staff.id,
      staffName: staff.fullName,
      companyId: staff.companyId,
      companyName: staff.companyName,
      month: Number(month),
      year: Number(year),
      workUnits,
      dailyWage: staff.dailyWage || 0,
      baseAmount: workUnits * (staff.dailyWage || 0),
      status: 'pending'
    };

    if (existingIndex > -1) {
      // Only update if not paid
      if (updatedSalaries[existingIndex].status !== 'paid') {
        updatedSalaries[existingIndex] = { ...updatedSalaries[existingIndex], ...salaryData };
      }
    } else {
      updatedSalaries.push({
        id: nextId(updatedSalaries),
        ...salaryData,
        bonus: 0,
        deduction: 0,
        finalAmount: salaryData.baseAmount
      });
    }
  });

  db.salaries = updatedSalaries;
  writeDb(db);
  res.json({ message: "Salaries calculated successfully", count: staffToProcess.length });
});

// PATCH /api/salaries/:id - Update salary (manual overrides)
router.patch('/:id', authorize('manager'), (req, res) => {
  const db = readDb();
  const index = db.salaries.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Salary record not found" });

  // Only update if not paid
  if (db.salaries[index].status === 'paid') {
    return res.status(400).json({ message: "Cannot edit paid salary" });
  }

  db.salaries[index] = { ...db.salaries[index], ...req.body };
  
  // Re-calculate final amount if not manually provided
  if (req.body.bonus !== undefined || req.body.deduction !== undefined || req.body.baseAmount !== undefined) {
    const s = db.salaries[index];
    if (req.body.finalAmount === undefined) {
      db.salaries[index].finalAmount = Number(s.baseAmount) + Number(s.bonus || 0) - Number(s.deduction || 0);
    }
  }

  writeDb(db);
  res.json(db.salaries[index]);
});

// POST /api/salaries/:id/approve - Approve salary
router.post('/:id/approve', authorize('manager'), (req, res) => {
  const db = readDb();
  const index = db.salaries.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Salary record not found" });

  db.salaries[index].status = 'approved';
  writeDb(db);
  res.json(db.salaries[index]);
});

// POST /api/salaries/:id/pay - Mark as paid and log finance
router.post('/:id/pay', authorize('manager'), (req, res) => {
  const db = readDb();
  const index = db.salaries.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Salary record not found" });

  const salary = db.salaries[index];
  if (salary.status === 'paid') return res.status(400).json({ message: "Already paid" });

  // Mark as paid
  db.salaries[index].status = 'paid';
  db.salaries[index].paidAt = new Date().toISOString();

  // Create finance entry
  const financeEntry = {
    id: nextId(db.finance),
    companyId: salary.companyId,
    companyName: salary.companyName,
    transactionType: 'expense',
    amount: salary.finalAmount,
    description: `Salary Payment - ${salary.staffName} (${salary.month}/${salary.year})`,
    category: 'Salary',
    createdAt: new Date().toISOString()
  };
  db.finance.push(financeEntry);

  writeDb(db);
  res.json({ salary: db.salaries[index], financeEntry });
});

export const salaryRouter = router;

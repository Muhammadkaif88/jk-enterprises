import { useEffect, useMemo, useRef, useState } from "react";
import RecycleBinSection from "./RecycleBinSection";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const sections = [
  { id: "overview", icon: "OV", label: "Overview" },
  { id: "inventory", icon: "IN", label: "Components" },
  { id: "finance", icon: "AC", label: "Accounting" },
  { id: "investments", icon: "IV", label: "Investment" },
  { id: "billing", icon: "BL", label: "Billing" },
  { id: "projects", icon: "PR", label: "Projects" },
  { id: "notes", icon: "ID", label: "Idea Lab" },
  { id: "team", icon: "TM", label: "Team" },
  { id: "staffTracking", icon: "ST", label: "Staff Tracking" },
  { id: "salary", icon: "SY", label: "Staff Salary" },
  { id: "tasks", icon: "TK", label: "Tasks" },
  { id: "recycleBin", icon: "DB", label: "Deleted Items" }
];

const staffRoleOptions = [
  { value: "account-staff", label: "Account Staff" },
  { value: "trainer", label: "Trainer" },
  { value: "internship", label: "Internship" },
  { value: "robotic-engineer", label: "Robotic Engineer" },
  { value: "technician", label: "Technician" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" }
];

const sectionAccessByRole = {
  admin: sections.map((section) => section.id),
  manager: ["inventory", "finance", "investments", "billing", "projects", "notes", "team", "staffTracking", "salary", "tasks"],
  "Account Staff": ["inventory", "finance", "investments", "billing", "staffTracking", "salary", "tasks"],
  Accountant: ["inventory", "finance", "investments", "billing", "staffTracking", "salary", "tasks"],
  Trainer: ["inventory", "projects", "notes", "team", "staffTracking", "tasks"],
  Freelancer: ["inventory", "projects", "notes", "team", "tasks"],
  Internship: ["projects", "notes", "team", "staffTracking", "tasks"],
  "Robotic Engineer": ["inventory", "projects", "notes", "team", "staffTracking", "tasks"],
  technician: ["inventory", "projects", "notes", "team", "staffTracking", "salary", "tasks"]
};

const companyProfiles = {
  Edukkit: "Electronics and robotics education, components and modules sales, and prototype development.",
  "3D.Objex": "3D printing services and 3D printed product sales.",
  "Qisa Cafe": "Cafe operations, food service, and hospitality sales."
};

const staffCategoryOptions = ["Account Staff", "Trainer", "Internship", "Robotic Engineer"];
const approvalAccessOptions = [
  { value: "Trainer", label: "Trainer" },
  { value: "Internship", label: "Internship" },
  { value: "Accountant", label: "Accountant" },
  { value: "Robotic Engineer", label: "Robotic Engineer" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "manager", label: "Manager" }
];
const teamRoleOptions = [
  { value: "technician", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" }
];
const employeeCategoryOptions = [
  { value: "Accountant", label: "Accountant" },
  { value: "Trainer", label: "Trainer" },
  { value: "Internship", label: "Internship" },
  { value: "Robotic Engineer", label: "Robotic Engineer" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Manager", label: "Manager" }
];
const attendanceStatusOptions = [
  { value: "Pending Assignment", label: "Pending Assignment" },
  { value: "Present", label: "Present" },
  { value: "Three Quarters", label: "Three Quarters" },
  { value: "Late", label: "Late" },
  { value: "Half Day", label: "Half Day" },
  { value: "Absent", label: "Absent" },
  { value: "Leave", label: "Leave" }
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getIndiaDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
}

function parseList(value) {
  return String(value || "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const TASK_STATUS_WEIGHTS = {
  todo: 30,
  "in-progress": 60,
  review: 80,
  done: 100
};

function getPerformanceBand(score) {
  if (score < 40) {
    return "low";
  }
  if (score < 70) {
    return "medium";
  }
  return "high";
}

function parseLineItems(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [description, qty, price] = line.split("|").map((part) => part.trim());
      return {
        description,
        qty: Number(qty || 0),
        price: Number(price || 0),
        total: Number(qty || 0) * Number(price || 0)
      };
    });
}

function SectionCard({ title, kicker, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function TrendChart({ title, data }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((entry) => [Math.abs(entry.profit || 0), Math.abs(entry.expenses || 0)])
  );

  return (
    <SectionCard title={title} kicker="Financial trend">
      <div className="chart-list">
        {data.length ? (
          data.map((entry) => (
            <div key={entry.label} className="chart-row">
              <div className="chart-labels">
                <strong>{entry.label}</strong>
                <span>Profit {currency(entry.profit)} / Expense {currency(entry.expenses)}</span>
              </div>
              <div className="chart-bars">
                <div className="chart-bar-track">
                  <div className="chart-bar profit" style={{ width: `${(Math.abs(entry.profit) / maxValue) * 100}%` }} />
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar expense" style={{ width: `${(Math.abs(entry.expenses) / maxValue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="task-empty">No trend data available.</div>
        )}
      </div>
    </SectionCard>
  );
}

function BrandLogo() {
  return (
    <div className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 100 100" role="img">
        <path d="M38 20v64c0 10-6 16-16 16" />
        <path d="M60 20v80" />
        <path d="M60 60l28-40" />
        <path d="M60 60l28 40" />
      </svg>
    </div>
  );
}

function DataTable({ columns, rows, onEdit, onDelete, canEdit, canDelete = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditData(row);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = () => {
    onEdit(editData);
    setEditingId(null);
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {canEdit || canDelete ? <th style={{ textAlign: "right" }}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {editingId === row.id && column.editable !== false ? (
                      column.options ? (
                        <select
                          className="edit-input"
                          value={editData[column.key] ?? ""}
                          onChange={(event) => setEditData({ ...editData, [column.key]: event.target.value })}
                        >
                          {column.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="edit-input"
                          value={editData[column.key] ?? ""}
                          onChange={(event) => setEditData({ ...editData, [column.key]: event.target.value })}
                          type={column.type || "text"}
                        />
                      )
                    ) : column.render ? (
                      column.render(row)
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
                {canEdit || canDelete ? (
                  <td className="td-actions">
                    {editingId === row.id && canEdit ? (
                      <>
                        <button className="save-row-btn" onClick={handleSave}>Save</button>
                        <button className="cancel-row-btn" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {canEdit ? <button className="btn-icon" onClick={() => startEdit(row)}>Edit</button> : null}
                        {canDelete ? <button className="btn-icon delete" onClick={() => onDelete(row.id)}>Delete</button> : null}
                      </>
                    )}
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (canEdit || canDelete ? 1 : 0)} className="empty-cell">
                No records yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Authentication failed.");
      }

      if (isLogin) {
        onLogin(result);
      } else {
        setIsLogin(true);
        setError("Registration submitted. Wait for admin approval before logging in.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
        <p>{isLogin ? "Log in to control operations." : "Add a new staff login for ERMS."}</p>
        {error ? <div className="alert">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin ? <input name="fullName" placeholder="Full Name" required /> : null}
          <input name="email" type="email" placeholder="Email Address" required />
          {!isLogin ? <input name="phone" type="tel" placeholder="Phone Number" required /> : null}
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" className="btn-primary">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>
        <div className="auth-footer">
          {isLogin ? "Need an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Sign Up" : "Log In"}</button>
        </div>
      </div>
    </div>
  );
}

function StaffSelect({ name, team }) {
  return (
    <select name={name} required defaultValue="">
      <option value="" disabled>Select staff</option>
      {team.map((member) => (
        <option key={member.id} value={member.id}>
          {member.fullName}
        </option>
      ))}
    </select>
  );
}

function InvestmentSection({
  investments,
  investorTransactions,
  selectedInvestorId,
  setSelectedInvestorId,
  isTransactionModalOpen,
  setIsTransactionModalOpen,
  currency,
  handleAction,
  role,
  isAdmin,
  selectedCompany,
  companies,
  refreshAll
}) {
  const [view, setView] = useState("portfolio"); // portfolio, distribution, history
  const [activeTxInvestor, setActiveTxInvestor] = useState(null);
  const [txType, setTxType] = useState("Investment In");
  const [txMethod, setTxMethod] = useState("Cash");

  const openTransactionModal = (investor, defaultType = "Investment In") => {
    setActiveTxInvestor(investor);
    setTxType(defaultType);
    setTxMethod("Cash");
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setActiveTxInvestor(null);
    setIsTransactionModalOpen(false);
  };

  const handleRecordTransaction = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const result = await handleAction("POST", "/investments/transaction", {
      ...data,
      investorId: activeTxInvestor.id
    });

    if (result) {
      closeTransactionModal();
      refreshAll(true);
    }
  };

  const selectedInvestorHistory = investments.find(inv => inv.id === selectedInvestorId);
  const filteredTransactions = investorTransactions.filter(t => t.investorId === selectedInvestorId);

  return (
    <div className="section-stack">
      <header className="section-header-row">
        <div>
          <p className="kicker">Corporate Funding</p>
          <h2 className="section-title">Investor & Fund Management</h2>
        </div>
        <div className="tab-group">
          <button className={view === "portfolio" ? "tab-btn active" : "tab-btn"} onClick={() => setView("portfolio")}>Investment Portfolio</button>
          <button className={view === "distribution" ? "tab-btn active" : "tab-btn"} onClick={() => setView("distribution")}>Profit Distribution</button>
          <button className={view === "history" ? "tab-btn active" : "tab-btn"} onClick={() => setView("history")}>Transaction History</button>
        </div>
      </header>

      {view === "portfolio" && (
        <>
          <SectionCard title="Investment Portfolio" kicker="Capital & Equity Tracking">
            <DataTable
              columns={[
                { key: "investorName", label: "Investor" },
                { key: "investedFund", label: "Invested", type: "number", render: (row) => currency(row.investedFund) },
                { key: "returnedFund", label: "Returned", type: "number", render: (row) => currency(row.returnedFund) },
                { key: "equityPct", label: "Equity (%)", type: "number", render: (row) => `${row.equityPct}%` },
                { key: "monthlyProfitShare", label: "Monthly Profit", editable: false, render: (row) => currency(row.monthlyProfitShare) },
                { key: "cumulativeROI", label: "ROI", editable: false, render: (row) => `${row.cumulativeROI}%` },
                {
                  key: "actions",
                  label: "Actions",
                  editable: false,
                  render: (row) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="save-row-btn" onClick={() => openTransactionModal(row, "Investment In")}>Add Capital</button>
                      <button className="btn-icon" onClick={() => { setSelectedInvestorId(row.id); setView("history"); }}>History</button>
                    </div>
                  )
                }
              ]}
              rows={investments}
              canEdit={isAdmin}
              canDelete={isAdmin}
              onEdit={(data) => handleAction("PUT", `/investments/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/investments/${id}`)}
            />

            <SectionCard title="Register New Investor" kicker="Onboarding">
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target));
                if (selectedCompany !== "all") {
                  data.companyId = Number(selectedCompany);
                } else {
                  data.companyId = Number(data.companyId);
                }
                if (!data.companyId || isNaN(data.companyId)) {
                  alert("Please select a valid company before adding an investor.");
                  return;
                }
                handleAction("POST", "/investments", data);
                e.target.reset();
              }}>
                <input name="investorName" placeholder="Investor Name" required />
                <input name="contactNumber" placeholder="Contact Number" />
                {selectedCompany === "all" ? (
                  <select name="companyId" required defaultValue="">
                    <option value="" disabled>Select company</option>
                    {(companies || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : null}
                <input name="investedFund" type="number" step="0.01" placeholder="Initial Investment Amount" required defaultValue="0" />
                <input name="equityPct" type="number" step="0.01" placeholder="Equity Share (%)" required defaultValue="0" />
                <input name="investedDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                <input name="notes" placeholder="Onboarding Notes" className="wide" />
                <button type="submit">Add Investor</button>
              </form>
            </SectionCard>
          </SectionCard>
        </>
      )}

      {view === "distribution" && (
        <SectionCard title="Profit Distribution" kicker="Automated split based on equity">
          <div className="distribution-summary-card">
            <p className="kicker">Current Month Net Profit</p>
            <h2>{currency(investments[0]?.netProfitForMonth || 0)}</h2>
            <p className="muted-copy">This profit is split automatically among investors based on their current equity holdings.</p>
          </div>

          <DataTable
            columns={[
              { key: "investorName", label: "Investor" },
              { key: "equityPct", label: "Share %", render: (row) => `${row.equityPct}%` },
              { key: "monthlyProfitShare", label: "Profit Share", render: (row) => currency(row.monthlyProfitShare) },
              {
                key: "action",
                label: "Action",
                render: (row) => <button className="save-row-btn" onClick={() => openTransactionModal(row, "Profit Payout Out")}>Pay Dividend</button>
              }
            ]}
            rows={investments}
            canEdit={false}
          />
        </SectionCard>
      )}

      {view === "history" && (
        <SectionCard title="Transaction History" kicker={selectedInvestorHistory ? `History for ${selectedInvestorHistory.investorName}` : "Select an investor"}>
          {!selectedInvestorId ? (
            <div className="task-empty">Select an investor from the Portfolio tab to view detailed history.</div>
          ) : (
            <DataTable
              columns={[
                { key: "date", label: "Date" },
                { key: "type", label: "Type" },
                { key: "amount", label: "Amount", render: (row) => currency(row.amount) },
                { key: "method", label: "Method" },
                { key: "details", label: "Voucher/TXID", render: (row) => row.method === 'UPI' ? row.transactionId : row.receiptNumber }
              ]}
              rows={filteredTransactions || []}
              canEdit={false}
            />
          )}
        </SectionCard>
      )}

      {isTransactionModalOpen && activeTxInvestor && (
        <div className="modal-overlay">
          <div className="panel payment-method-box">
            <div className="modal-head">
              <h3>Record Transaction: {activeTxInvestor.investorName}</h3>
              <button className="btn-icon" onClick={closeTransactionModal}>✕</button>
            </div>
            <form onSubmit={handleRecordTransaction} className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group wide">
                <label>Fund Direction</label>
                <select name="type" required value={txType} onChange={(e) => setTxType(e.target.value)}>
                  <option value="Investment In">Investment In (Add Capital)</option>
                  <option value="Profit Payout Out">Profit Payout (Dividend)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input name="amount" type="number" required placeholder="0" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select name="method" required value={txMethod} onChange={(e) => setTxMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              {txMethod === 'UPI' && (
                <>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input name="upiId" placeholder="upi@handle" required />
                  </div>
                  <div className="form-group">
                    <label>Transaction ID</label>
                    <input name="transactionId" placeholder="UTR Number" required />
                  </div>
                </>
              )}

              {txMethod === 'Cash' && (
                <div className="form-group wide">
                  <label>Receipt Number / Handover Note</label>
                  <input name="receiptNumber" placeholder="Receipt #" required />
                </div>
              )}

              <div className="modal-footer wide">
                <button type="button" className="cancel-row-btn" onClick={closeTransactionModal}>Cancel</button>
                <button type="submit" className="save-row-btn">Save Transaction & Sync Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [activeSection, setActiveSection] = useState("overview");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return savedUser?.role === "admin" ? "all" : String(savedUser?.companyId || "all");
  });
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [finance, setFinance] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [financeSearchDate, setFinanceSearchDate] = useState("");
  const [investments, setInvestments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [investorTransactions, setInvestorTransactions] = useState([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [billingLines, setBillingLines] = useState([{ inventoryId: "", description: "", qty: 1, price: 0 }]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [taskView, setTaskView] = useState("add");
  const [staffTrackingView, setStaffTrackingView] = useState("home");
  const [notes, setNotes] = useState([]);
  const [team, setTeam] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staffTracking, setStaffTracking] = useState({
    attendance: [],
    doubts: [],
    complaints: [],
    summary: null
  });
  const [salaries, setSalaries] = useState([]);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const refreshInFlight = useRef(false);

  const role = user?.role || "guest";
  const staffCategory = user?.staffCategory || "";
  const isAdmin = role === "admin";
  const canManagePeople = ["admin", "manager"].includes(role);
  const requestRole = !isAdmin && staffCategory === "Account Staff" ? "manager" : role;
  const allowedSectionIds = new Set(
    sectionAccessByRole[isAdmin ? "admin" : role === "manager" ? "manager" : staffCategory || "technician"] ||
      sectionAccessByRole.technician
  );
  const availableCompanies = isAdmin
    ? companies
    : companies.filter((company) => Number(company.id) === Number(user?.companyId));
  const showCompanyColumn = selectedCompany === "all";
  const selectedCompanyInfo = useMemo(
    () => companies.find((entry) => Number(entry.id) === Number(selectedCompany)) || null,
    [companies, selectedCompany]
  );
  const hiddenSectionsByCompanyCode = {
    "qisa-cafe": new Set(["inventory", "billing", "projects"])
  };
  const hiddenSectionIds = selectedCompanyInfo?.code ? hiddenSectionsByCompanyCode[selectedCompanyInfo.code] || new Set() : new Set();
  const companyScopedSections = new Set(["inventory", "finance", "billing", "projects", "staffTracking", "tasks"]);
  const visibleSections = sections.filter(
    (section) =>
      allowedSectionIds.has(section.id) &&
      !hiddenSectionIds.has(section.id) &&
      (isAdmin || section.id !== "overview") &&
      (selectedCompany !== "all" || !companyScopedSections.has(section.id))
  );
  const currentStaffMember = useMemo(
    () =>
      team.find(
        (member) =>
          member.email === user?.email ||
          (member.fullName === user?.fullName && Number(member.companyId) === Number(user?.companyId))
      ) || null,
    [team, user?.companyId, user?.email, user?.fullName]
  );
  const currentStaffName = currentStaffMember?.fullName || user?.fullName || "";
  const visibleAttendanceRows = canManagePeople
    ? staffTracking.attendance
    : staffTracking.attendance.filter((entry) => Number(entry.staffId) === Number(currentStaffMember?.id));
  const visibleDoubtRows = canManagePeople
    ? staffTracking.doubts
    : staffTracking.doubts.filter((entry) => Number(entry.staffId) === Number(currentStaffMember?.id));
  const visibleComplaintRows = canManagePeople
    ? staffTracking.complaints
    : staffTracking.complaints.filter((entry) => Number(entry.staffId) === Number(currentStaffMember?.id));
  const todayDateKey = getIndiaDateKey();
  const todayAttendanceRecord = useMemo(
    () =>
      currentStaffMember
        ? [...staffTracking.attendance]
            .filter(
              (entry) => Number(entry.staffId) === Number(currentStaffMember.id) && String(entry.date || "") === todayDateKey
            )
            .sort((left, right) => Number(right.id) - Number(left.id))[0] || null
        : null,
    [currentStaffMember, staffTracking.attendance, todayDateKey]
  );

  async function api(path, options = {}) {
    const url = new URL(`${API_URL}${path}`);
    if (!path.startsWith("/auth") && path !== "/companies") {
      url.searchParams.set("companyId", selectedCompany);
    }
    const method = String(options.method || "GET").toUpperCase();
    if (method === "GET") {
      url.searchParams.set("_ts", String(Date.now()));
    }

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-role": requestRole,
        "x-company-id": selectedCompany,
        "x-user-name": user?.fullName || "",
        "x-user-email": user?.email || ""
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed." }));
      if (
        (response.status === 401 || response.status === 403) &&
        /log in again|removed|session/i.test(String(error.message || ""))
      ) {
        setUser(null);
        setToken(null);
        setSelectedCompany("all");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      throw new Error(error.message || "Request failed.");
    }

    return response.status === 204 ? null : response.json();
  }

  async function refreshAll(force = false) {
    if (!token) {
      return;
    }

    if (refreshInFlight.current && !force) {
      return;
    }

    refreshInFlight.current = true;

    try {
      const baseRequests = await Promise.all([
        api("/companies"),
        api("/overview"),
        api("/inventory"),
        api("/projects"),
        api("/notes"),
        api("/team"),
        api("/staff-tracking/attendance"),
        api("/staff-tracking/doubts"),
        api("/staff-tracking/complaints"),
        api("/staff-tracking/summary"),
        api("/tasks")
      ]);

      setCompanies(baseRequests[0]);
      setOverview(baseRequests[1]);
      setInventory(baseRequests[2]);
      setProjects(baseRequests[3]);
      setNotes(baseRequests[4]);
      setTeam(baseRequests[5]);
      setStaffTracking({
        attendance: baseRequests[6],
        doubts: baseRequests[7],
        complaints: baseRequests[8],
        summary: baseRequests[9]
      });
      setTasks(baseRequests[10]);

      if (["admin", "manager"].includes(requestRole)) {
        const [financeRows, financeTotals, investmentRows, billingRows] = await Promise.all([
          api("/finance"),
          api("/finance/summary"),
          api("/investments"),
          api("/billing")
        ]);
        setFinance(financeRows);
        setFinanceSummary(financeTotals);
        setInvestments(investmentRows);
        setBilling(billingRows);
      } else {
        setFinance([]);
        setFinanceSummary(null);
        setInvestments([]);
        setBilling([]);
      }

      if (role === "admin") {
        setPendingUsers(await api("/auth/pending"));
      } else {
        setPendingUsers([]);
      }

      const salaryData = await api(`/salaries?month=${salaryMonth}&year=${salaryYear}`);
      setSalaries(salaryData);

      if (activeSection === 'investments' && selectedInvestorId) {
        setInvestorTransactions(await api(`/investments/${selectedInvestorId}/transactions`));
      } else if (activeSection === 'investments') {
        // Fetch all transactions briefly if needed, or just keep it simple
        const allTransactions = await Promise.all(investments.map(inv => api(`/investments/${inv.id}/transactions`)));
        setInvestorTransactions(allTransactions.flat());
      }

      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    refreshAll(true);
  }, [requestRole, role, selectedCompany, token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const pollId = window.setInterval(() => {
      refreshAll();
    }, 5000);

    const handleFocusRefresh = () => {
      refreshAll(true);
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        refreshAll(true);
      }
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [requestRole, selectedCompany, token]);

  useEffect(() => {
    if (!isAdmin && user?.companyId && selectedCompany !== String(user.companyId)) {
      setSelectedCompany(String(user.companyId));
      return;
    }

    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id || "notes");
    }
  }, [activeSection, isAdmin, selectedCompany, user?.companyId, visibleSections]);

  const projectRows = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        usedComponentsText:
          (project.usedComponents || []).join(", ") ||
          (project.bom || [])
            .map((item) => {
              const inventoryItem = inventory.find((entry) => entry.id === item.inventoryId);
              return `${inventoryItem?.partName || "Unknown"} x${item.quantity}`;
            })
            .join(", "),
        fileCount:
          (project.circuitAttachments?.length || 0) +
          (project.projectFiles?.length || 0) +
          (project.imageAttachments?.length || 0)
      })),
    [inventory, projects]
  );
  const selectedProject = useMemo(
    () => projectRows.find((project) => project.id === selectedProjectId) || null,
    [projectRows, selectedProjectId]
  );
  const filteredProjectRows = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) {
      return projectRows;
    }
    return projectRows.filter((project) =>
      [
        project.projectName,
        project.projectDetails,
        project.projectCode,
        project.usedComponentsText,
        ...(project.usedComponents || [])
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [projectRows, projectSearch]);

  const restrictedFinance = !["admin", "manager"].includes(requestRole);
  const canManageTasks = role === "admin" || role === "manager";
  const filteredInventory = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) {
      return inventory;
    }

    return inventory.filter((item) =>
      [
        item.partName,
        item.category,
        item.partValue,
        item.packageType,
        item.supplier,
        item.datasheetUrl
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [inventory, inventorySearch]);
  const filteredFinance = useMemo(() => {
    if (!financeSearchDate) {
      return finance;
    }

    return finance.filter((entry) => {
      const entryDate = entry.entryDate || String(entry.createdAt || "").slice(0, 10);
      return entryDate === financeSearchDate;
    });
  }, [finance, financeSearchDate]);
  const investmentSummary = useMemo(() => {
    const invested = investments.reduce((sum, entry) => sum + Number(entry.investedFund || 0), 0);
    const returned = investments.reduce((sum, entry) => sum + Number(entry.returnedFund || 0), 0);
    return {
      invested,
      returned,
      balance: invested - returned
    };
  }, [investments]);
  const taskColumns = [
    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
    { key: "title", label: "Task" },
    { key: "projectName", label: "Project" },
    { key: "assigneeNames", label: "Assigned Staff", editable: false },
    { key: "priority", label: "Flag" },
    { key: "status", label: "Status" },
    { key: "startDate", label: "Start Date" },
    { key: "dueDate", label: "Due Date" }
  ];
  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      "in-progress": tasks.filter((task) => task.status === "in-progress"),
      review: tasks.filter((task) => task.status === "review"),
      done: tasks.filter((task) => task.status === "done")
    }),
    [tasks]
  );
  const weeklyTaskData = useMemo(() => {
    const ranges = [
      { label: "Feb 7-14", start: "2026-02-07", end: "2026-02-14" },
      { label: "Feb 14-21", start: "2026-02-14", end: "2026-02-21" },
      { label: "Feb 21-28", start: "2026-02-21", end: "2026-02-28" }
    ];
    const series = ranges.map((range) => ({
      label: range.label,
      value: tasks.filter((task) => {
        if (task.status !== "done") {
          return false;
        }
        const marker = task.dueDate || String(task.createdAt || "").slice(0, 10);
        return marker >= range.start && marker <= range.end;
      }).length
    }));
    if (series.every((entry) => entry.value === 0)) {
      const doneCount = tasks.filter((task) => task.status === "done").length;
      return [
        { label: "Feb 7-14", value: Math.max(3, doneCount + 2) },
        { label: "Feb 14-21", value: Math.max(5, doneCount + 4) },
        { label: "Feb 21-28", value: Math.max(4, doneCount + 3) }
      ];
    }
    return series;
  }, [tasks]);
  const employeePerformance = useMemo(() => {
    const staffPool = team.length
      ? team
      : [
          { id: "fallback-ajay", fullName: "Ajay" },
          { id: "fallback-arjun", fullName: "Arjun" },
          { id: "fallback-karthik", fullName: "Karthik" }
        ];

    return staffPool.slice(0, 6).map((member, index) => {
      const assignedTasks = tasks.filter((task) => Number(task.assigneeId) === Number(member.id));
      const score = assignedTasks.length
        ? Math.round(
            assignedTasks.reduce((sum, task) => sum + (TASK_STATUS_WEIGHTS[task.status] || 35), 0) / assignedTasks.length
          )
        : [42, 68, 91, 57, 76, 88][index] || 40;

      return {
        name: member.fullName,
        score,
        band: getPerformanceBand(score)
      };
    });
  }, [tasks, team]);
  const currentEmployee = useMemo(
    () => team.find((member) => member.email === user?.email || member.fullName === user?.fullName) || null,
    [team, user]
  );
  const employeeTasks = useMemo(
    () =>
      currentEmployee
        ? tasks.filter(
            (task) =>
              Number(task.assigneeId) === Number(currentEmployee.id) ||
              Number(task.secondaryAssigneeId || 0) === Number(currentEmployee.id)
          )
        : [],
    [currentEmployee, tasks]
  );
  const todayDate = new Date().toISOString().slice(0, 10);
  const employeeTaskViews = useMemo(
    () => ({
      today: [...employeeTasks].sort((left, right) => {
        const priorityRank = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        const leftToday = left.startDate === todayDate || left.dueDate === todayDate ? 0 : 1;
        const rightToday = right.startDate === todayDate || right.dueDate === todayDate ? 0 : 1;
        return leftToday - rightToday || (priorityRank[left.priority] ?? 4) - (priorityRank[right.priority] ?? 4);
      }),
      myTasks: employeeTasks,
      overdue: employeeTasks.filter((task) => task.dueDate && task.dueDate < todayDate && task.status !== "done"),
      urgent: employeeTasks.filter((task) => String(task.priority).toLowerCase() === "urgent")
    }),
    [employeeTasks, todayDate]
  );
  const employeeDataSheet = useMemo(() => {
    const completed = employeeTasks.filter((task) => task.status === "done").length;
    const inProgress = employeeTasks.filter((task) => task.status === "in-progress").length;
    const review = employeeTasks.filter((task) => task.status === "review").length;
    const overdue = employeeTasks.filter((task) => task.dueDate && task.dueDate < todayDate && task.status !== "done").length;
    const score = employeeTasks.length
      ? Math.round(employeeTasks.reduce((sum, task) => sum + (TASK_STATUS_WEIGHTS[task.status] || 35), 0) / employeeTasks.length)
      : 0;

    return { completed, inProgress, review, overdue, score, band: getPerformanceBand(score || 0) };
  }, [employeeTasks, todayDate]);
  const employeeTaskMenu = useMemo(
    () => [
      {
        key: "today",
        label: "Today",
        kicker: "Priority first",
        value: employeeTaskViews.today.length,
        description: "Open today task only."
      },
      {
        key: "data-sheet",
        label: "Data Sheet",
        kicker: "Performance",
        value: `${employeeDataSheet.score}%`,
        description: "Open your employee performance sheet."
      },
      {
        key: "my-tasks",
        label: "My Tasks",
        kicker: "Assigned works",
        value: employeeTaskViews.myTasks.length,
        description: "Open only your assigned work list."
      },
      {
        key: "over-due",
        label: "Over Due",
        kicker: "Delay tracker",
        value: employeeTaskViews.overdue.length,
        description: "Open only overdue tasks."
      },
      {
        key: "urgent",
        label: "Urgent",
        kicker: "Immediate action",
        value: employeeTaskViews.urgent.length,
        description: "Open urgent tasks only."
      }
    ],
    [employeeDataSheet.score, employeeTaskViews]
  );
  const staffTrackingMenu = useMemo(
    () => [
      {
        key: "attendance",
        label: "Daily Attendance",
        kicker: "Mark presence",
        value: staffTracking.summary?.todayAttendanceCount || 0,
        description: "Open daily attendance entry and records."
      },
      {
        key: "doubts",
        label: "Doubt Clearance",
        kicker: "Support queue",
        value: staffTracking.summary?.openDoubts || 0,
        description: "Open doubt tracking and resolution page."
      },
      {
        key: "complaints",
        label: "Complaint Desk",
        kicker: "Issue desk",
        value: staffTracking.summary?.openComplaints || 0,
        description: "Open staff complaint tracking page."
      },
      ...(!canManagePeople ? [{
        key: "my-stats",
        label: "My Stats Summary",
        kicker: "Performance",
        value: "View",
        description: "Quick summary of recent activity, attendance, and queries."
      }] : [])
    ],
    [staffTracking.summary, canManagePeople]
  );

  useEffect(() => {
    if (!canManageTasks && !["employee-home", "today", "data-sheet", "my-tasks", "over-due", "urgent"].includes(taskView)) {
      setTaskView("employee-home");
    }
  }, [canManageTasks, taskView]);

  function withSelectedCompany(data) {
    return selectedCompany === "all" ? data : { ...data, companyId: Number(selectedCompany) };
  }

  function withCurrentStaff(data) {
    if (canManagePeople) {
      return data;
    }

    if (!currentStaffMember?.id) {
      setMessage("This account does not have a linked staff profile yet.");
      return null;
    }

    return {
      ...data,
      staffId: currentStaffMember.id
    };
  }

  function updateBillingLine(index, key, value) {
    setBillingLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line))
    );
  }

  function selectBillingInventory(index, inventoryId) {
    const selectedItem = inventory.find((item) => Number(item.id) === Number(inventoryId));
    setBillingLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              inventoryId,
              description: selectedItem?.partName || line.description,
              price: selectedItem?.unitCost || line.price
            }
          : line
      )
    );
  }

  function addBillingLine() {
    setBillingLines((current) => [...current, { inventoryId: "", description: "", qty: 1, price: 0 }]);
  }

  function removeBillingLine(index) {
    setBillingLines((current) =>
      current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)
    );
  }

  function printBill(bill) {
    const company = companies.find((entry) => Number(entry.id) === Number(bill.companyId));
    const invoiceWindow = window.open("", "_blank", "width=900,height=700");
    if (!invoiceWindow || !company) return;

    const rows = (bill.lineItems || [])
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.description || ""}</td>
            <td>${item.qty || 0}</td>
            <td>${currency(item.price || 0)}</td>
            <td>${currency(item.total || 0)}</td>
          </tr>
        `
      )
      .join("");

    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${bill.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1d1b16; }
            .head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
            .company { max-width: 45%; }
            .company h1 { margin:0 0 8px; font-size:28px; }
            .muted { color:#655d50; line-height:1.6; }
            .badge { padding:6px 10px; border:1px solid #d6c6b5; border-radius:999px; font-size:12px; }
            .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
            table { width:100%; border-collapse:collapse; margin-bottom:24px; }
            th, td { border-bottom:1px solid #ddd; padding:10px; text-align:left; }
            .totals { margin-left:auto; width:320px; }
            .totals div { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; }
            .footer { margin-top:24px; }
          </style>
        </head>
        <body>
          <div class="head">
            <div class="company">
              <h1>${company.name}</h1>
              <div class="muted">${company.address || ""}<br/>${company.phone || ""}<br/>${company.email || ""}</div>
            </div>
            <div>
              <div class="badge">INVOICE</div>
              <div class="muted" style="margin-top:12px;">Invoice # ${bill.invoiceNumber}<br/>Invoice Date: ${bill.invoiceDate}<br/>Due Date: ${bill.dueDate || "-"}</div>
            </div>
          </div>
          <div class="grid">
            <div>
              <strong>Bill To</strong>
              <div class="muted">${bill.customerName || ""}<br/>${bill.customerAddress || ""}<br/>${bill.customerPhone || ""}</div>
            </div>
            <div>
              <strong>Payment Method</strong>
              <div class="muted">${bill.paymentMethod || "Bank / UPI"}<br/>Bank: ${company.bankName || ""}<br/>A/C: ${company.accountNumber || ""}<br/>IFSC: ${company.ifsc || ""}<br/>UPI: ${company.upiId || ""}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>No</th><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div><span>Sub Total</span><strong>${currency(bill.subtotal)}</strong></div>
            <div><span>Discount</span><strong>${currency(bill.discount || 0)}</strong></div>
            <div><span>Paid</span><strong>${currency(bill.paidAmount || 0)}</strong></div>
            <div><span>Balance Due</span><strong>${currency(bill.balanceDue)}</strong></div>
          </div>
          <div class="footer muted">
            ${bill.description || "Thank you for your business."}
          </div>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    invoiceWindow.print();
  }

  const handleLogin = (data) => {
    setUser(data.user);
    setToken(data.token);
    setSelectedCompany(data.user?.role === "admin" ? "all" : String(data.user?.companyId || "all"));
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSelectedCompany("all");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  async function handleAction(method, path, payload) {
    try {
      const result = await api(path, {
        method,
        body: payload ? JSON.stringify(payload) : undefined
      });
      await refreshAll(true);
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-role": requestRole,
          "x-company-id": selectedCompany,
          "x-user-email": user?.email || ""
        }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jk_compy_backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
      
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.companies)) {
        throw new Error("Invalid backup file format.");
      }

      await handleAction("POST", "/admin/import", payload);
      setMessage("Data imported successfully! The dashboard has been updated.");
      refreshAll(true);
    } catch (error) {
      setMessage("Import failed: " + error.message);
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  function renderEmployeeTaskCard(task) {
    return (
      <article key={task.id} className="task-card">
        <div className="task-card-top">
          <strong>{task.title}</strong>
          <span className={`task-priority task-priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
        </div>
        <p className="task-meta">Staff: {task.assigneeNames || task.assigneeName || "Unassigned"}</p>
        <p className="task-meta">Project: {task.projectName || "No project linked"}</p>
        <p className="task-meta">Status: {task.status}</p>
        <p className="task-meta">Start: {task.startDate || "Not set"}</p>
        <p className="task-meta">Due: {task.dueDate || "No due date"}</p>
        <p className="task-copy">{task.description || "No description provided."}</p>
        <div className="task-card-actions">
          <button
            type="button"
            className="btn-icon"
            disabled={task.status !== "todo"}
            onClick={() => handleAction("PUT", `/tasks/${task.id}`, { status: "in-progress" })}
          >
            In Progress
          </button>
          <button
            type="button"
            className="save-row-btn"
            disabled={!["in-progress", "review"].includes(task.status)}
            onClick={() => handleAction("PUT", `/tasks/${task.id}`, { status: "review" })}
          >
            Review
          </button>
        </div>
        {task.status === "review" ? <p className="task-meta">Waiting for admin approval.</p> : null}
        {task.status === "done" ? <p className="task-meta">Approved complete.</p> : null}
      </article>
    );
  }

  if (!token) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <BrandLogo />
          <p className="brand-eyebrow">JK Enterprises</p>
          <h1>Company Control Panel</h1>
        </div>

        <nav className="nav-list">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              className={activeSection === section.id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-user">{user.fullName}</p>
          <button className="nav-item" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="kicker">Authenticated Session</p>
            <h2>{role.toUpperCase()} access</h2>
          </div>
          <div className="topbar-controls">
            <select value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)}>
              {isAdmin ? <option value="all">All Companies</option> : null}
              {availableCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {message ? <div className="alert">{message}</div> : null}

        {activeSection === "overview" && overview ? (
          <>
            <section className="stat-grid">
              <div className="stat-card">
                <span>Revenue</span>
                <strong>{currency(overview.totals.revenue)}</strong>
              </div>
              <div className="stat-card">
                <span>Purchases</span>
                <strong>{currency(overview.totals.purchases)}</strong>
              </div>
              <div className="stat-card">
                <span>Expenses</span>
                <strong>{currency(overview.totals.expenses)}</strong>
              </div>
              <div className="stat-card accent">
                <span>Real Profit</span>
                <strong>{currency(overview.totals.profit)}</strong>
              </div>
            </section>

            {selectedCompany === "all" ? (
              <div className="section-stack">
                <div className="company-overview-grid">
                  {overview.companyBreakdown.map((company) => (
                    <article key={company.id} className="company-overview-card">
                      <div className="company-overview-head">
                        <div>
                          <p className="kicker">Company Summary</p>
                          <h3>{company.name}</h3>
                        </div>
                      </div>
                      <p className="company-overview-copy">{companyProfiles[company.name] || "Business unit summary."}</p>
                      <div className="company-overview-metrics">
                        <div><span>Revenue</span><strong>{currency(company.revenue)}</strong></div>
                        <div><span>Purchases</span><strong>{currency(company.purchases)}</strong></div>
                        <div><span>Expenses</span><strong>{currency(company.expenses)}</strong></div>
                        <div><span>Profit</span><strong>{currency(company.profit)}</strong></div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="two-col">
                  <TrendChart title="Monthly Profit / Expense" data={overview.monthlyTrend} />
                  <TrendChart title="Yearly Profit / Expense" data={overview.yearlyTrend} />
                </div>

                <SectionCard title="System Data Management" kicker="Admin global controls">
                  <div className="project-card-grid">
                    <article className="project-card">
                      <div className="project-card-head">
                        <div>
                          <p className="kicker">Export</p>
                          <h3>Download Full Backup</h3>
                        </div>
                        <button type="button" className="project-open-btn" onClick={handleExport}>
                          Download
                        </button>
                      </div>
                      <p className="project-copy">Download a complete JSON backup of the system database, including all companies, inventory, staff, projects, and finance records.</p>
                    </article>
                    
                    <article className="project-card">
                      <div className="project-card-head">
                        <div>
                          <p className="kicker">Import</p>
                          <h3>Restore / Upload Data</h3>
                        </div>
                        <label className="project-open-btn" style={{ cursor: "pointer", textAlign: "center", display: "inline-block", margin: 0, padding: "8px 16px", background: "#f1ede5", color: "#1d1b16", border: "1px solid #d6c6b5", borderRadius: "999px", fontSize: "14px", fontWeight: 500 }}>
                          Upload JSON
                          <input type="file" accept="application/json" style={{ display: "none" }} onChange={handleImport} />
                        </label>
                      </div>
                      <p className="project-copy">Upload a previously downloaded JSON backup. <strong>Warning:</strong> This will completely overwrite the existing data!</p>
                    </article>
                  </div>
                </SectionCard>
              </div>
            ) : (
              <div className="two-col">
                <SectionCard title="Low Stock Radar" kicker="Critical inventory">
                  <DataTable
                    columns={[
                      { key: "partName", label: "Part" },
                      { key: "category", label: "Category" },
                      { key: "stockQty", label: "Qty" },
                      { key: "lowStockThreshold", label: "Threshold" }
                    ]}
                    rows={overview.lowStock}
                    canEdit={false} canDelete={isAdmin}
                  />
                </SectionCard>

                <SectionCard title="Operations Snapshot" kicker="Live counters">
                  <div className="snapshot-list">
                    <div className="snapshot-row"><span>Active projects</span><strong>{overview.activeProjects}</strong></div>
                    <div className="snapshot-row"><span>Ideas awaiting conversion</span><strong>{overview.notesAwaitingConversion}</strong></div>
                    <div className="snapshot-row"><span>Present today</span><strong>{overview.presentToday}</strong></div>
                    <div className="snapshot-row"><span>Open doubts</span><strong>{overview.openDoubts}</strong></div>
                    <div className="snapshot-row"><span>Open complaints</span><strong>{overview.openComplaints}</strong></div>
                  </div>
                </SectionCard>
              </div>
            )}
          </>
        ) : null}

        {activeSection === "inventory" ? (
          <SectionCard title="Stock Management" kicker="Inventory Dashboard">
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.target));
                handleAction("POST", "/inventory", withSelectedCompany(data));
                event.target.reset();
              }}
            >
              <input name="partName" placeholder="Part name" required />
              <input name="category" placeholder="Category" required />
              <input name="partValue" placeholder="Value" />
              <input name="stockQty" type="number" placeholder="Qty" required />
              <input name="lowStockThreshold" type="number" placeholder="Low stock limit" required />
              <input name="unitCost" type="number" placeholder="Unit cost" required />
              <button type="submit">Add Component</button>
            </form>

            <div className="inventory-toolbar">
              <input
                value={inventorySearch}
                onChange={(event) => setInventorySearch(event.target.value)}
                placeholder="Search stock item, category, value, package, supplier"
              />
            </div>

            <div className="inventory-alert-grid">
              {inventory.filter((item) => Number(item.stockQty) <= Number(item.lowStockThreshold || 0)).length ? (
                inventory
                  .filter((item) => Number(item.stockQty) <= Number(item.lowStockThreshold || 0))
                  .map((item) => (
                    <div key={item.id} className="inventory-alert-card">
                      <strong>{item.partName}</strong>
                      <span>Qty {item.stockQty} / Low stock {item.lowStockThreshold}</span>
                    </div>
                  ))
              ) : (
                <div className="task-empty">No low stock alerts for this company.</div>
              )}
            </div>

            <DataTable
              columns={[
                ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                { key: "partName", label: "Part" },
                { key: "category", label: "Category" },
                { key: "partValue", label: "Value" },
                { key: "stockQty", label: "Qty", type: "number" },
                { key: "lowStockThreshold", label: "Low Stock", type: "number" },
                {
                  key: "stockAlert",
                  label: "Alert",
                  editable: false,
                  render: (row) => (Number(row.stockQty) <= Number(row.lowStockThreshold || 0) ? "Low Stock" : "OK")
                },
                { key: "unitCost", label: "Unit Cost", type: "number", render: (row) => currency(row.unitCost) }
              ]}
              rows={filteredInventory}
              canEdit={role !== "technician"}
              canDelete={isAdmin}
              onEdit={(data) => handleAction("PUT", `/inventory/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/inventory/${id}`)}
            />
          </SectionCard>
        ) : null}

        {activeSection === "finance" ? (
          restrictedFinance ? (
            <SectionCard title="Accounting Console" kicker="Restricted">
              <p className="muted-copy">Manager or admin access is required for daily and monthly accounting control.</p>
            </SectionCard>
          ) : (
            <div className="section-stack">
              {financeSummary ? (
                <section className="stat-grid">
                  <div className="stat-card">
                    <span>Today Expense</span>
                    <strong>{currency(financeSummary.today.expense)}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Month Expense</span>
                    <strong>{currency(financeSummary.month.expense)}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Today Profit</span>
                    <strong>{currency(financeSummary.today.profit)}</strong>
                  </div>
                  <div className="stat-card accent">
                    <span>Month Profit</span>
                    <strong>{currency(financeSummary.month.profit)}</strong>
                  </div>
                </section>
              ) : null}

              <SectionCard title="Expense and Cash Tracking" kicker="Daily and monthly accounting">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/finance", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <select name="transactionType" required defaultValue="expense">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="purchase">Purchase</option>
                  </select>
                  <input name="category" placeholder="Category" required />
                  <input name="entryDate" type="date" required />
                  <input name="amount" type="number" placeholder="Amount" required />
                  <input name="description" placeholder="Description" className="wide" required />
                  <button type="submit">Log Entry</button>
                </form>

                <div className="finance-toolbar">
                  <input
                    type="date"
                    value={financeSearchDate}
                    onChange={(event) => setFinanceSearchDate(event.target.value)}
                  />
                </div>

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "entryDate", label: "Date" },
                    { key: "transactionType", label: "Type" },
                    { key: "category", label: "Category" },
                    { key: "description", label: "Description" },
                    { key: "amount", label: "Amount", type: "number", render: (row) => currency(row.amount) }
                  ]}
                  rows={filteredFinance}
                  canEdit={role !== "technician"}
                  canDelete={isAdmin}
                  onEdit={(data) => handleAction("PUT", `/finance/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/finance/${id}`)}
                />
              </SectionCard>
            </div>
          )
        ) : null}

        {activeSection === "investments" ? (
          <InvestmentSection
            investments={investments}
            investorTransactions={investorTransactions}
            selectedInvestorId={selectedInvestorId}
            setSelectedInvestorId={setSelectedInvestorId}
            isTransactionModalOpen={isTransactionModalOpen}
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            currency={currency}
            handleAction={handleAction}
            role={role}
            isAdmin={isAdmin}
            selectedCompany={selectedCompany}
            companies={companies}
            refreshAll={refreshAll}
          />
        ) : null}

        {activeSection === "billing" ? (
          restrictedFinance ? (
            <SectionCard title="Billing Desk" kicker="Restricted">
              <p className="muted-copy">Manager or admin access is required for billing and invoice control.</p>
            </SectionCard>
          ) : (
            <div className="section-stack">
              {selectedCompanyInfo ? (
                <SectionCard title="Company Payment Details" kicker="Used automatically in bills">
                  <div className="billing-payment-preview">
                    <div className="payment-method-box">
                      <h3>PAYMENT METHOD</h3>
                      <div className="payment-lines">
                        <div><strong>Bank</strong><span>{selectedCompanyInfo.bankName || "-"}</span></div>
                        <div><strong>AC NO</strong><span>{selectedCompanyInfo.accountNumber || "-"}</span></div>
                        <div><strong>IFSC</strong><span>{selectedCompanyInfo.ifsc || "-"}</span></div>
                        <div><strong>UPI ID</strong><span>{selectedCompanyInfo.upiId || "-"}</span></div>
                        <div><strong>Email</strong><span>{selectedCompanyInfo.email || "-"}</span></div>
                      </div>
                      <p className="payment-thanks">THANK YOU FOR YOUR BUSINESS</p>
                    </div>
                  </div>

                  <form
                    className="form-grid"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = Object.fromEntries(new FormData(event.target));
                      handleAction("PUT", `/companies/${selectedCompanyInfo.id}`, data);
                    }}
                  >
                    <input name="name" defaultValue={selectedCompanyInfo.name} placeholder="Company name" />
                    <input name="phone" defaultValue={selectedCompanyInfo.phone || ""} placeholder="Phone" />
                    <input name="email" defaultValue={selectedCompanyInfo.email || ""} placeholder="Email" />
                    <input name="bankName" defaultValue={selectedCompanyInfo.bankName || ""} placeholder="Bank name" />
                    <input name="accountNumber" defaultValue={selectedCompanyInfo.accountNumber || ""} placeholder="Account number" />
                    <input name="ifsc" defaultValue={selectedCompanyInfo.ifsc || ""} placeholder="IFSC" />
                    <input name="totalValuation" type="number" defaultValue={selectedCompanyInfo.totalValuation || 10000000} placeholder="Total Company Valuation" />
                    <input name="upiId" defaultValue={selectedCompanyInfo.upiId || ""} placeholder="UPI ID" className="wide" />
                    <textarea name="address" defaultValue={selectedCompanyInfo.address || ""} placeholder="Company address" className="wide tall" />
                    <button type="submit">Update Company Billing Details</button>
                  </form>
                </SectionCard>
              ) : null}

              <SectionCard title="Billing Desk" kicker="Simple invoice format">
                <p className="muted-copy">Invoice number is generated automatically in continuous order when you create the bill.</p>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    data.lineItems = billingLines.map((line) => ({
                      inventoryId: line.inventoryId ? Number(line.inventoryId) : null,
                      description: line.description,
                      qty: Number(line.qty || 0),
                      price: Number(line.price || 0),
                      total: Number(line.qty || 0) * Number(line.price || 0)
                    }));
                    handleAction("POST", "/billing", withSelectedCompany(data));
                    setBillingLines([{ inventoryId: "", description: "", qty: 1, price: 0 }]);
                    event.target.reset();
                  }}
                >
                  <input name="customerName" placeholder="Bill to / customer name" required />
                  <input name="customerPhone" placeholder="Customer phone" />
                  <input name="invoiceDate" type="date" required />
                  <input name="dueDate" type="date" />
                  <input name="billType" placeholder="Bill type" required />
                  <input name="paymentMethod" defaultValue="Bank / UPI" placeholder="Payment method" />
                  <select name="status" defaultValue="Draft">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                  <input name="discount" type="number" placeholder="Discount" />
                  <input name="paidAmount" type="number" placeholder="Paid amount" />
                  <textarea name="customerAddress" placeholder="Customer address" className="wide tall" />
                  <textarea name="description" placeholder="Footer note / thank you note" className="wide tall" />
                  <button type="submit">Create Printable Bill</button>
                </form>

                <div className="billing-line-editor">
                  <div className="billing-line-head">
                    <strong>Bill Items</strong>
                    <button className="print-btn" type="button" onClick={addBillingLine}>Add Row</button>
                  </div>
                  <p className="muted-copy">Select a component to auto-fill description and price. Saved paid bills update inventory stock and accounting income automatically.</p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Component</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingLines.map((line, index) => (
                          <tr key={`line-${index}`}>
                            <td>{index + 1}</td>
                            <td>
                              <select
                                className="edit-input"
                                value={line.inventoryId}
                                onChange={(event) => selectBillingInventory(index, event.target.value)}
                              >
                                <option value="">Custom Item</option>
                                {inventory.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.partName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="edit-input"
                                value={line.description}
                                onChange={(event) => updateBillingLine(index, "description", event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="edit-input"
                                type="number"
                                value={line.qty}
                                onChange={(event) => updateBillingLine(index, "qty", event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="edit-input"
                                type="number"
                                value={line.price}
                                onChange={(event) => updateBillingLine(index, "price", event.target.value)}
                              />
                            </td>
                            <td>{currency(Number(line.qty || 0) * Number(line.price || 0))}</td>
                            <td>
                              <button className="btn-icon delete" type="button" onClick={() => removeBillingLine(index)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>

              <div className="billing-card-grid">
                {billing.map((bill) => {
                  const company = companies.find((entry) => Number(entry.id) === Number(bill.companyId));
                  return (
                    <article key={bill.id} className="billing-card">
                      <div className="billing-card-head">
                        <div>
                          <p className="kicker">Invoice</p>
                          <h3>{bill.invoiceNumber}</h3>
                        </div>
                        <div className="billing-card-actions">
                          <button className="print-btn" onClick={() => printBill(bill)}>Print</button>
                          {isAdmin ? <button className="btn-icon delete" onClick={() => handleAction("DELETE", `/billing/${bill.id}`)}>Delete</button> : null}
                        </div>
                      </div>

                      <div className="billing-meta-grid">
                        <div>
                          <strong>{company?.name || bill.companyName}</strong>
                          <p>{company?.address || ""}</p>
                          <p>{company?.phone || ""}</p>
                          <p>{company?.email || ""}</p>
                        </div>
                        <div>
                          <strong>Bill To</strong>
                          <p>{bill.customerName}</p>
                          <p>{bill.customerAddress || ""}</p>
                          <p>{bill.customerPhone || ""}</p>
                        </div>
                      </div>

                      <div className="billing-meta-grid">
                        <div>
                          <strong>Invoice Date</strong>
                          <p>{bill.invoiceDate}</p>
                        </div>
                        <div>
                          <strong>Due Date</strong>
                          <p>{bill.dueDate || "-"}</p>
                        </div>
                        <div>
                          <strong>Status</strong>
                          <p>{bill.status}</p>
                        </div>
                        <div>
                          <strong>Payment Method</strong>
                          <p>{bill.paymentMethod}</p>
                        </div>
                      </div>

                      <div className="billing-auto-strip">
                        <div className="billing-auto-item">
                          <strong>Accounting Sync</strong>
                          <span>{bill.financeLogId ? `Income posted: ${currency(bill.paidAmount || bill.amount)}` : "Not posted yet"}</span>
                        </div>
                        <div className="billing-auto-item">
                          <strong>Stock Sync</strong>
                          <span>
                            {bill.inventoryAdjustments?.length
                              ? bill.inventoryAdjustments.map((item) => `${item.partName} -${item.qty}`).join(", ")
                              : "No inventory items linked"}
                          </span>
                        </div>
                      </div>

                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bill.lineItems || []).map((item, index) => (
                              <tr key={`${bill.id}-${index}`}>
                                <td>{index + 1}</td>
                                <td>{item.description}</td>
                                <td>{item.qty}</td>
                                <td>{currency(item.price)}</td>
                                <td>{currency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="billing-summary">
                        <div><span>Sub Total</span><strong>{currency(bill.subtotal)}</strong></div>
                        <div><span>Discount</span><strong>{currency(bill.discount || 0)}</strong></div>
                        <div><span>Paid</span><strong>{currency(bill.paidAmount || 0)}</strong></div>
                        <div><span>Balance Due</span><strong>{currency(bill.balanceDue)}</strong></div>
                      </div>

                      <div className="billing-foot">
                        <p>{bill.description || "Thank you for your business."}</p>
                        {company ? (
                          <p>
                            Bank: {company.bankName} | A/C: {company.accountNumber} | IFSC: {company.ifsc} | UPI: {company.upiId}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )
        ) : null}

        {activeSection === "projects" ? (
          <SectionCard title="Project Vault" kicker="Simple project document">
            <form
              className="project-form"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const data = {
                  projectName: formData.get("projectName"),
                  projectDetails: formData.get("projectDetails"),
                  projectCode: formData.get("projectCode"),
                  usedComponents: parseList(formData.get("usedComponents")),
                  circuitAttachments: await filesToDataUrls(event.target.circuitFiles.files),
                  projectFiles: await filesToDataUrls(event.target.projectFiles.files),
                  imageAttachments: []
                };
                await handleAction("POST", "/projects", withSelectedCompany(data));
                event.target.reset();
              }}
            >
              <div className="project-form-section">
                <p className="kicker">Project Name</p>
                <input name="projectName" placeholder="Project name" required />
              </div>

              <div className="project-form-section">
                <p className="kicker">Project Circuit Diagram</p>
                <label className="upload-box">
                  <span>Upload circuit diagram files</span>
                  <small>Images and PDF documents</small>
                  <input name="circuitFiles" type="file" accept="image/*,.pdf" multiple />
                </label>
              </div>

              <div className="project-form-section">
                <p className="kicker">Project Code</p>
                <textarea name="projectCode" placeholder="Paste source code or firmware notes" className="project-code-area" />
              </div>

              <div className="project-form-section">
                <p className="kicker">Project Details</p>
                <textarea name="projectDetails" placeholder="Project details and explanation" className="project-details-area" />
              </div>

              <div className="project-form-section">
                <p className="kicker">Used Components List</p>
                <textarea
                  name="usedComponents"
                  placeholder={"ESP32\nRelay Module\n16x2 LCD"}
                  className="project-components-area"
                />
              </div>

              <div className="project-form-section">
                <p className="kicker">File Upload Area</p>
                <label className="upload-box">
                  <span>Upload project files</span>
                  <small>Reports, code files, PDFs, images</small>
                  <input name="projectFiles" type="file" multiple />
                </label>
              </div>

              <button type="submit">Create Project</button>
            </form>

            <div className="project-toolbar">
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search any project"
                className="project-search"
              />
              {selectedProject ? (
                <button type="button" className="project-close-btn" onClick={() => setSelectedProjectId(null)}>
                  Close Opened Project
                </button>
              ) : null}
            </div>

            <DataTable
              columns={[
                ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                { key: "projectName", label: "Project" },
                { key: "usedComponentsText", label: "Used Components", editable: false },
                { key: "fileCount", label: "Files", editable: false }
              ]}
              rows={filteredProjectRows}
              canEdit={role !== "technician"} canDelete={isAdmin}
              onEdit={(data) => handleAction("PUT", `/projects/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/projects/${id}`)}
            />

            <div className="project-card-grid">
              {filteredProjectRows.length ? (
                filteredProjectRows.map((project) => (
                  <article
                    key={project.id}
                    className={`project-card${selectedProject?.id === project.id ? " active" : ""}`}
                  >
                    <div className="project-card-head">
                      <div>
                        <p className="kicker">Project Record</p>
                        <h3>{project.projectName}</h3>
                      </div>
                      <button type="button" className="project-open-btn" onClick={() => setSelectedProjectId(project.id)}>
                        Open
                      </button>
                    </div>
                    <div className="project-block">
                      <strong>Used components</strong>
                      <p>{project.usedComponentsText || "No component detail added yet."}</p>
                    </div>
                    <div className="project-block">
                      <strong>Files</strong>
                      <p>{project.fileCount} attachment(s)</p>
                    </div>
                    <div className="project-block">
                      <strong>Saved On</strong>
                      <p>{new Date(project.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="task-empty">No matching projects found.</div>
              )}
            </div>

            {selectedProject ? (
              <article className="project-document">
                <div className="project-document-head">
                  <div>
                    <p className="kicker">Project Document</p>
                    <h3>{selectedProject.projectName}</h3>
                  </div>
                  <span className="project-badge">Saved Record</span>
                </div>

                <div className="project-document-section">
                  <strong>Project Details</strong>
                  <p>{selectedProject.projectDetails || "No project details added."}</p>
                </div>

                <div className="project-document-section">
                  <strong>Used Components List</strong>
                  {(selectedProject.usedComponents?.length || selectedProject.usedComponentsText) ? (
                    <div className="tag-list">
                      {(selectedProject.usedComponents?.length
                        ? selectedProject.usedComponents
                        : selectedProject.usedComponentsText.split(",").map((entry) => entry.trim()).filter(Boolean)
                      ).map((component) => (
                        <span key={`${selectedProject.id}-${component}`} className="tag">
                          {component}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No components listed.</p>
                  )}
                </div>

                <div className="project-document-section">
                  <strong>Project Code</strong>
                  <pre className="project-code-block">{selectedProject.projectCode || "No project code added."}</pre>
                </div>

                <div className="project-document-section">
                  <strong>Circuit Diagram Files</strong>
                  {(selectedProject.circuitAttachments?.length || selectedProject.imageAttachments?.length) ? (
                    <div className="project-file-grid">
                      {(selectedProject.circuitAttachments?.length ? selectedProject.circuitAttachments : selectedProject.imageAttachments).map((file, index) => (
                        <div key={`${selectedProject.id}-circuit-${index}`} className="project-file-card">
                          {String(file.type || "").startsWith("image/") ? (
                            <img src={file.dataUrl} alt={file.name || `Circuit file ${index + 1}`} />
                          ) : (
                            <div className="project-file-icon">PDF</div>
                          )}
                          <a href={file.dataUrl} download={file.name || `circuit-${index + 1}`}>{file.name || `Circuit File ${index + 1}`}</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No circuit diagram uploaded.</p>
                  )}
                </div>

                <div className="project-document-section">
                  <strong>Project Files</strong>
                  {selectedProject.projectFiles?.length ? (
                    <div className="project-file-list">
                      {selectedProject.projectFiles.map((file, index) => (
                        <a key={`${selectedProject.id}-file-${index}`} href={file.dataUrl} download={file.name || `project-file-${index + 1}`}>
                          {file.name || `Project File ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p>No extra files uploaded.</p>
                  )}
                </div>
              </article>
            ) : null}
          </SectionCard>
        ) : null}

        {activeSection === "notes" ? (
          <SectionCard title="Idea Lab" kicker="Engineering notes">
            <form
              className="form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const data = {
                  title: formData.get("title"),
                  details: formData.get("details"),
                  ideaFiles: await filesToDataUrls(event.target.ideaFiles.files)
                };
                await handleAction("POST", "/notes", withSelectedCompany(data));
                event.target.reset();
              }}
            >
              <input name="title" placeholder="Idea title" required />
              <textarea name="details" placeholder="Idea details and explanation" className="wide" rows="3" />
              <label className="upload-box wide">
                <span>Upload idea details</span>
                <small>Supporting documents and images</small>
                <input name="ideaFiles" type="file" multiple />
              </label>
              <button type="submit">Save Idea</button>
            </form>

            <DataTable
              columns={[
                ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                { key: "title", label: "Title" },
                { key: "details", label: "Explanation" },
                { key: "ideaFiles", label: "Files", editable: false, render: (row) => `${(row.ideaFiles || []).length} file(s)` }
              ]}
              rows={notes}
              canEdit={true}
              canDelete={isAdmin}
              onEdit={(data) => handleAction("PUT", `/notes/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/notes/${id}`)}
            />

            <div className="project-card-grid">
              {notes.length ? (
                notes.map((note) => (
                  <article
                    key={note.id}
                    className={`project-card${selectedNoteId === note.id ? " active" : ""}`}
                  >
                    <div className="project-card-head">
                      <div>
                        <p className="kicker">Idea</p>
                        <h3>{note.title}</h3>
                      </div>
                      <button type="button" className="project-open-btn" onClick={() => setSelectedNoteId(selectedNoteId === note.id ? null : note.id)}>
                        {selectedNoteId === note.id ? "Close" : "Open"}
                      </button>
                    </div>
                    <div className="project-block">
                      <strong>Details</strong>
                      <p>{note.details ? note.details.slice(0, 120) + (note.details.length > 120 ? "…" : "") : "No details added."}</p>
                    </div>
                    <div className="project-block">
                      <strong>Files</strong>
                      <p>{(note.ideaFiles || []).length} attachment(s)</p>
                    </div>
                    <div className="project-block">
                      <strong>Saved On</strong>
                      <p>{new Date(note.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>

                    {selectedNoteId === note.id ? (
                      <div className="project-document" style={{ marginTop: 0 }}>
                        <div className="project-document-section">
                          <strong>Full Details</strong>
                          <p style={{ whiteSpace: "pre-wrap" }}>{note.details || "No details added."}</p>
                        </div>
                        {(note.ideaFiles || []).length ? (
                          <div className="project-document-section">
                            <strong>Uploaded Files</strong>
                            <div className="project-file-grid">
                              {note.ideaFiles.map((file, index) => (
                                <div key={`${note.id}-file-${index}`} className="project-file-card">
                                  {String(file.type || "").startsWith("image/") ? (
                                    <img src={file.dataUrl} alt={file.name || `File ${index + 1}`} />
                                  ) : (
                                    <div className="project-file-icon">FILE</div>
                                  )}
                                  <a href={file.dataUrl} download={file.name || `idea-file-${index + 1}`}>{file.name || `File ${index + 1}`}</a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="task-empty">No ideas saved yet.</div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "salary" ? (
          <div className="section-stack">
            {canManagePeople ? (
              <SectionCard title="Salary Management" kicker="Automated payroll">
                <div className="salary-controls">
                  <select value={salaryMonth} onChange={(e) => setSalaryMonth(Number(e.target.value))}>
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={salaryYear} onChange={(e) => setSalaryYear(Number(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button 
                    type="button" 
                    className="save-row-btn"
                    onClick={() => handleAction("POST", "/salaries/calculate", { month: salaryMonth, year: salaryYear, companyId: selectedCompany })}
                  >
                    Sync / Calculate Salaries
                  </button>
                </div>

                <div className="salary-card-grid" style={{ marginTop: "24px" }}>
                  {salaries.length ? (
                    salaries.map(salary => (
                      <article key={salary.id} className="project-card">
                        <div className="project-card-head">
                          <div>
                            <p className="kicker">{salary.companyName}</p>
                            <h3>{salary.staffName}</h3>
                          </div>
                          <span className={`task-badge status-${salary.status}`}>
                            {salary.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="salary-metrics">
                          <div className="salary-metric">
                            <span>Days Worked</span>
                            <strong>{salary.workUnits}</strong>
                          </div>
                          <div className="salary-metric">
                            <span>Per Day</span>
                            <strong>{currency(salary.dailyWage)}</strong>
                          </div>
                          <div className="salary-metric accent">
                            <span>Base Total</span>
                            <strong>{currency(salary.baseAmount)}</strong>
                          </div>
                        </div>

                        {salary.status !== 'paid' && (
                          <div className="salary-edit-fields">
                            <div className="input-group">
                              <label>Bonus</label>
                              <input 
                                type="number" 
                                defaultValue={salary.bonus} 
                                onBlur={(e) => handleAction("PATCH", `/salaries/${salary.id}`, { bonus: Number(e.target.value) })}
                              />
                            </div>
                            <div className="input-group">
                              <label>Deduction</label>
                              <input 
                                type="number" 
                                defaultValue={salary.deduction} 
                                onBlur={(e) => handleAction("PATCH", `/salaries/${salary.id}`, { deduction: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        )}

                        <div className="salary-total-row">
                          <span>Net Payable</span>
                          <strong>{currency(salary.finalAmount)}</strong>
                        </div>

                        <div className="salary-actions">
                          {salary.status === 'pending' && (
                            <button className="save-row-btn" onClick={() => handleAction("POST", `/salaries/${salary.id}/approve`)}>
                              Approve
                            </button>
                          )}
                          {salary.status === 'approved' && (
                            <button className="btn-primary" onClick={() => handleAction("POST", `/salaries/${salary.id}/pay`)}>
                              Mark as Paid
                            </button>
                          )}
                        </div>
                        
                        {salary.status === 'paid' && (
                          <p className="muted-copy" style={{ marginTop: "12px" }}>
                            Paid on {new Date(salary.paidAt).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="task-empty">No salary records found for this period. Click Sync to generate.</div>
                  )}
                </div>
              </SectionCard>
            ) : (
              // Employee Salary View
              <SectionCard title="My Salary & Pay Slips" kicker="Personal Payroll">
                <div className="salary-controls">
                  <select value={salaryMonth} onChange={(e) => setSalaryMonth(Number(e.target.value))}>
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={salaryYear} onChange={(e) => setSalaryYear(Number(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="salary-card-grid" style={{ marginTop: "24px" }}>
                  {salaries.length ? (
                    salaries.map(salary => (
                      <article key={salary.id} className="project-card">
                        <div className="project-card-head">
                          <div>
                            <p className="kicker">{months.find(m => m.value === salary.month)?.label} {salary.year}</p>
                            <h3>Pay Slip</h3>
                          </div>
                          <span className={`task-badge status-${salary.status}`}>
                            {salary.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="project-block">
                          <strong>Days Logged & Base Wage</strong>
                          <p>{salary.workUnits} days @ {currency(salary.dailyWage)} = {currency(salary.baseAmount)}</p>
                        </div>
                        
                        <div className="project-block">
                          <strong>Adjustments</strong>
                          <p>Bonus: {currency(salary.bonus || 0)} | Deductions: {currency(salary.deduction || 0)}</p>
                        </div>

                        <div className="salary-total-row">
                          <span>Net Payable</span>
                          <strong>{currency(salary.finalAmount)}</strong>
                        </div>
                        
                        {salary.status === 'paid' && (
                          <div className="project-block" style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                            <strong>Paid On</strong>
                            <p>{new Date(salary.paidAt).toLocaleDateString("en-IN")}</p>
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="task-empty">No salary records generated for this period yet. Check back later.</div>
                  )}
                </div>
              </SectionCard>
            )}
          </div>
        ) : null}

        {activeSection === "team" ? (
          <div className="section-stack">
            {role === "admin" ? (
              <SectionCard title="Signup Approvals" kicker="Admin acceptance required">
                <div className="approval-card-grid">
                  {pendingUsers.length ? (
                    pendingUsers.map((pendingUser) => (
                      <article key={pendingUser.id} className="approval-card">
                        <div className="approval-card-head">
                          <div>
                            <p className="kicker">Pending Signup</p>
                            <h3>{pendingUser.fullName}</h3>
                          </div>
                          <span className="project-badge">Pending</span>
                        </div>
                        <p className="project-copy">{pendingUser.email}</p>
                        <div className="project-block">
                          <strong>Assigned Company</strong>
                          <select name="companyId" defaultValue={companies[0]?.id ?? ""} form={`approve-user-${pendingUser.id}`} required>
                            <option value="" disabled>Select company</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="project-block">
                          <strong>Employee Category</strong>
                          <select
                            name="accessProfile"
                            defaultValue={approvalAccessOptions[0].value}
                            form={`approve-user-${pendingUser.id}`}
                            required
                          >
                            {approvalAccessOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="project-block">
                          <strong>Status</strong>
                          <p>Waiting for admin company and category assignment.</p>
                        </div>
                        <form
                          id={`approve-user-${pendingUser.id}`}
                          className="approval-actions"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const data = Object.fromEntries(new FormData(event.target));
                            handleAction("POST", `/auth/pending/${pendingUser.id}/approve`, data);
                          }}
                        >
                          <button type="submit" className="save-row-btn">
                            Approve
                          </button>
                          <button type="button" className="btn-icon delete" onClick={() => handleAction("POST", `/auth/pending/${pendingUser.id}/reject`)}>
                            Reject
                          </button>
                        </form>
                      </article>
                    ))
                  ) : (
                    <div className="task-empty">No pending signup approvals.</div>
                  )}
                </div>
              </SectionCard>
            ) : null}

            <SectionCard title="Team Control" kicker="Staff management">
              {isAdmin ? (
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/team", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <input name="fullName" placeholder="Full name" required />
                  <input name="email" type="email" placeholder="Email" required />
                  <input name="phone" type="tel" placeholder="Phone number" required />
                  <input name="password" type="password" placeholder="Login password" required />
                  <select name="role" defaultValue="technician">
                    {teamRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select name="staffCategory" defaultValue="Trainer">
                    {employeeCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isAdmin ? (
                    <select name="companyId" required defaultValue="">
                      <option value="" disabled>Select company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  ) : null}
                  <input name="dailyWage" type="number" placeholder="Per Day Wage" required />
                  <button type="submit">Add Staff</button>
                </form>
              ) : (
                <div className="task-empty">Team details are view-only for employee accounts.</div>
              )}

              <DataTable
                columns={[
                  ...((showCompanyColumn || !isAdmin) ? [{ key: "companyName", label: "Company", editable: false }] : []),
                  { key: "fullName", label: "Name" },
                  { key: "email", label: "Email" },
                  ...(isAdmin ? [{ key: "phone", label: "Phone" }] : []),
                  ...(isAdmin ? [{ key: "role", label: "Role", options: teamRoleOptions }] : []),
                  { key: "staffCategory", label: "Category", options: employeeCategoryOptions },
                  { key: "dailyWage", label: "Daily Wage", type: "number", render: (row) => currency(row.dailyWage), editable: isAdmin },
                  { key: "attendanceStatus", label: "Current Status", editable: false }
                ]}
                rows={team}
                canEdit={role === "admin" || role === "manager"} canDelete={isAdmin}
                onEdit={async (data) => {
                  const result = await handleAction("PUT", `/team/${data.id}`, data);
                  if (result && user?.email === data.email && user?.fullName !== data.fullName) {
                    const updatedUser = { ...user, fullName: data.fullName };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                  }
                }}
                onDelete={(id) => handleAction("DELETE", `/team/${id}`)}
              />
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "staffTracking" ? (
          <div className="section-stack">
            {staffTracking.summary && canManagePeople ? (
              <section className="stat-grid">
                <div className="stat-card">
                  <span>Attendance Logged Today</span>
                  <strong>{staffTracking.summary.todayAttendanceCount}</strong>
                </div>
                <div className="stat-card">
                  <span>Present Today</span>
                  <strong>{staffTracking.summary.presentToday}</strong>
                </div>
                <div className="stat-card">
                  <span>Open Doubts</span>
                  <strong>{staffTracking.summary.openDoubts}</strong>
                </div>
                <div className="stat-card accent">
                  <span>Open Complaints</span>
                  <strong>{staffTracking.summary.openComplaints}</strong>
                </div>
              </section>
            ) : null}

            {staffTrackingView === "home" ? (
              <div className="employee-launcher-grid">
                {staffTrackingMenu.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="employee-launcher-card"
                    onClick={() => setStaffTrackingView(item.key)}
                  >
                    <div className="employee-launcher-head">
                      <p className="kicker">{item.kicker}</p>
                      <strong>{item.value}</strong>
                    </div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="employee-page-head">
                <div>
                  <p className="kicker">Staff Tracking</p>
                  <h3>{staffTrackingMenu.find((item) => item.key === staffTrackingView)?.label || "Tracking Page"}</h3>
                </div>
                <button type="button" className="employee-back-btn" onClick={() => setStaffTrackingView("home")}>
                  Back
                </button>
              </div>
            )}

            {staffTrackingView === "attendance" ? (
              <SectionCard title="Daily Attendance" kicker="Check in and check out">
                <div className="attendance-action-grid">
                  <form
                    className="attendance-action-card"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = withCurrentStaff(withSelectedCompany(Object.fromEntries(new FormData(event.target))));
                      if (!data) {
                        return;
                      }
                      handleAction("POST", "/staff-tracking/attendance", data);
                      event.target.reset();
                    }}
                  >
                    <p className="kicker">Check In</p>
                    <h3>{currentStaffName || "Linked account required"}</h3>
                    <div className="attendance-meta">
                      <span>Date</span>
                      <strong>{todayDateKey}</strong>
                    </div>
                    <div className="attendance-meta">
                      <span>Time</span>
                      <strong>{todayAttendanceRecord?.checkIn || "Auto on check in"}</strong>
                    </div>
                    <select name="status" defaultValue="Present" disabled={!currentStaffMember || Boolean(todayAttendanceRecord)}>
                      <option value="Present">Present</option>
                      <option value="Leave">Leave</option>
                    </select>
                    <button type="submit" disabled={!currentStaffMember || Boolean(todayAttendanceRecord)}>
                      Check In
                    </button>
                  </form>

                  <div className="attendance-action-card">
                    <p className="kicker">Check Out</p>
                    <h3>{currentStaffName || "Linked account required"}</h3>
                    <div className="attendance-meta">
                      <span>Checked In</span>
                      <strong>{todayAttendanceRecord?.checkIn || "No check in yet"}</strong>
                    </div>
                    <div className="attendance-meta">
                      <span>Checked Out</span>
                      <strong>{todayAttendanceRecord?.checkOut || "Auto on check out"}</strong>
                    </div>
                    <div className="attendance-meta">
                      <span>Worked Hours</span>
                      <strong>{todayAttendanceRecord?.workedDuration || "Calculated on check out"}</strong>
                    </div>
                    <div className="attendance-meta">
                      <span>Day Status</span>
                      <strong>{todayAttendanceRecord?.dayApprovalStatus || "Pending approval"}</strong>
                    </div>
                    <button
                      type="button"
                      disabled={
                        !currentStaffMember ||
                        !todayAttendanceRecord ||
                        Boolean(todayAttendanceRecord.checkOut) ||
                        String(todayAttendanceRecord.status || "").toLowerCase() === "leave"
                      }
                      onClick={() => handleAction("POST", "/staff-tracking/attendance/check-out", withSelectedCompany({}))}
                    >
                      Check Out
                    </button>
                  </div>
                </div>

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "staffName", label: "Name", editable: false },
                    { key: "date", label: "Date", editable: false },
                    { key: "status", label: "Status", editable: false },
                    { key: "checkIn", label: "Check In", editable: false },
                    { key: "checkOut", label: "Check Out", editable: false },
                    { key: "workedDuration", label: "Worked Hours", editable: false },
                    { key: "dayApprovalStatus", label: "Day Approval", editable: false }
                  ]}
                  rows={visibleAttendanceRows}
                  canEdit={false} canDelete={isAdmin}
                  onEdit={(data) => handleAction("PUT", `/staff-tracking/attendance/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/staff-tracking/attendance/${id}`)}
                />
              </SectionCard>
            ) : null}

            {staffTrackingView === "doubts" ? (
              <SectionCard title="Doubt Clearance" kicker="Technical support queue">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = withCurrentStaff(withSelectedCompany(Object.fromEntries(new FormData(event.target))));
                    if (!data) {
                      return;
                    }
                    handleAction("POST", "/staff-tracking/doubts", data);
                    event.target.reset();
                  }}
                >
                  {canManagePeople ? (
                    <StaffSelect name="staffId" team={team} />
                  ) : (
                    <input value={currentStaffName} readOnly />
                  )}
                  <input name="topic" placeholder="Topic" required />
                  <select name="priority" defaultValue="Medium">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <input name="question" placeholder="Question" className="wide" required />
                  <input name="response" placeholder="Response / resolution" className="wide" />
                  <button type="submit">Add Doubt</button>
                </form>

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "staffName", label: "Staff", editable: false },
                    { key: "topic", label: "Topic" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                    { key: "response", label: "Response" }
                  ]}
                  rows={visibleDoubtRows}
                  canEdit={role !== "technician"} canDelete={isAdmin}
                  onEdit={(data) => handleAction("PUT", `/staff-tracking/doubts/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/staff-tracking/doubts/${id}`)}
                />
              </SectionCard>
            ) : null}

            {staffTrackingView === "complaints" ? (
              <SectionCard title="Complaint Desk" kicker="Staff complaint tracking">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = withCurrentStaff(withSelectedCompany(Object.fromEntries(new FormData(event.target))));
                    if (!data) {
                      return;
                    }
                    handleAction("POST", "/staff-tracking/complaints", data);
                    event.target.reset();
                  }}
                >
                  {canManagePeople ? (
                    <StaffSelect name="staffId" team={team} />
                  ) : (
                    <input value={currentStaffName} readOnly />
                  )}
                  <input name="complaintType" placeholder="Complaint type" required />
                  <input name="subject" placeholder="Subject" required />
                  <input name="description" placeholder="Description" className="wide" required />
                  <input name="resolution" placeholder="Resolution / manager note" className="wide" />
                  <button type="submit">Add Complaint</button>
                </form>

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "staffName", label: "Staff", editable: false },
                    { key: "complaintType", label: "Type" },
                    { key: "subject", label: "Subject" },
                    { key: "status", label: "Status" },
                    { key: "resolution", label: "Resolution" }
                  ]}
                  rows={visibleComplaintRows}
                  canEdit={role !== "technician"} canDelete={isAdmin}
                  onEdit={(data) => handleAction("PUT", `/staff-tracking/complaints/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/staff-tracking/complaints/${id}`)}
                />
              </SectionCard>
            ) : null}

            {staffTrackingView === "my-stats" ? (
              <div className="analytics-card">
                <div className="analytics-card-head">
                  <div>
                    <p className="kicker">Personal Summary</p>
                    <h3>My Stats</h3>
                  </div>
                </div>
                
                <section className="stat-grid" style={{ marginBottom: "24px" }}>
                  <div className="stat-card">
                    <span>Days Worked This Month</span>
                    <strong>{visibleAttendanceRows.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}</strong>
                  </div>
                  <div className="stat-card">
                    <span>My Open Doubts</span>
                    <strong>{visibleDoubtRows.filter(r => r.status !== 'Resolved').length}</strong>
                  </div>
                  <div className="stat-card accent">
                    <span>My Open Complaints</span>
                    <strong>{visibleComplaintRows.filter(r => r.status !== 'Resolved').length}</strong>
                  </div>
                </section>
                
                <div className="project-card-grid">
                  <article className="project-card">
                    <div className="project-card-head">
                      <div>
                        <p className="kicker">Today's Attendance</p>
                        <h3>{todayAttendanceRecord ? todayAttendanceRecord.status : "Not Logged Yet"}</h3>
                      </div>
                      <span className={`task-badge ${todayAttendanceRecord ? (todayAttendanceRecord.checkOut ? "status-paid" : "status-in-progress") : "status-todo"}`}>
                        {todayAttendanceRecord ? (todayAttendanceRecord.checkOut ? "COMPLETED" : "IN PROGRESS") : "PENDING"}
                      </span>
                    </div>
                    {todayAttendanceRecord && (
                      <>
                        <div className="project-block">
                          <strong>Check In</strong>
                          <p>{todayAttendanceRecord.checkIn}</p>
                        </div>
                        <div className="project-block">
                          <strong>Check Out</strong>
                          <p>{todayAttendanceRecord.checkOut || "---"}</p>
                        </div>
                        <div className="project-block">
                          <strong>Worked Hours</strong>
                          <p>{todayAttendanceRecord.workedDuration || "---"}</p>
                        </div>
                      </>
                    )}
                  </article>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSection === "tasks" ? (
          <div className="section-stack">
            <SectionCard title="Task Control" kicker="Company-scoped work assignment">
              {canManageTasks ? (
                <div className="task-topbar">
                  {[
                    ["add", "Add Task"],
                    ["board", "Board"],
                    ["data", "Task Data"],
                    ["worksheet", "Employee Worksheet"]
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={taskView === key ? "task-view-btn active" : "task-view-btn"}
                      onClick={() => setTaskView(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : taskView === "employee-home" ? (
                <div className="employee-launcher-grid">
                  {employeeTaskMenu.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="employee-launcher-card"
                      onClick={() => setTaskView(item.key)}
                    >
                      <div className="employee-launcher-head">
                        <p className="kicker">{item.kicker}</p>
                        <strong>{item.value}</strong>
                      </div>
                      <h3>{item.label}</h3>
                      <p>{item.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="employee-page-head">
                  <div>
                    <p className="kicker">Employee Workspace</p>
                    <h3>{employeeTaskMenu.find((item) => item.key === taskView)?.label || "Task Page"}</h3>
                  </div>
                  <button type="button" className="employee-back-btn" onClick={() => setTaskView("employee-home")}>
                    Back
                  </button>
                </div>
              )}

              {taskView === "add" && canManageTasks ? (
                <form
                  className="task-create-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/tasks", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <div className="task-form-card">
                    <p className="kicker">Task Define Area</p>
                    <input name="title" placeholder="Task name" required />
                    <select name="projectName" defaultValue="">
                      <option value="">Assign project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.projectName}>
                          {project.projectName}
                        </option>
                      ))}
                    </select>
                    <input name="startDate" type="date" required />
                    <input name="dueDate" type="date" required />
                    <select name="priority" defaultValue="High">
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Low">Low</option>
                    </select>
                    <StaffSelect name="assigneeId" team={team} />
                    <select name="secondaryAssigneeId" defaultValue="">
                      <option value="">Select second staff (optional)</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName}
                        </option>
                      ))}
                    </select>
                    <textarea name="description" placeholder="Task description" className="task-description-area" required />
                    <button type="submit">Create Task</button>
                  </div>
                </form>
              ) : null}

              {taskView === "board" ? (
                <div className="task-board">
                  {[
                    ["todo", "To Do"],
                    ["in-progress", "In Progress"],
                    ["review", "Review"],
                    ["done", "Complete"]
                  ].map(([statusKey, label]) => (
                    <section key={statusKey} className="task-column">
                      <div className="task-column-head">
                        <h3>{label}</h3>
                        <span>{tasksByStatus[statusKey].length}</span>
                      </div>
                      <div className="task-column-list">
                        {tasksByStatus[statusKey].length ? (
                          tasksByStatus[statusKey].map((task) => (
                            <article key={task.id} className="task-card">
                              <div className="task-card-top">
                                <strong>{task.title}</strong>
                                <span className={`task-priority task-priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
                              </div>
                              <p className="task-meta">Staff: {task.assigneeNames || task.assigneeName || "Unassigned"}</p>
                              <p className="task-meta">Project: {task.projectName || "No project linked"}</p>
                              <p className="task-meta">Start: {task.startDate || "Not set"}</p>
                              <p className="task-meta">Due: {task.dueDate || "No due date"}</p>
                              <p className="task-copy">{task.description || "No description provided."}</p>
                              {statusKey === "review" && isAdmin ? (
                                <div className="task-card-actions">
                                  <button
                                    type="button"
                                    className="save-row-btn"
                                    onClick={() => handleAction("PUT", `/tasks/${task.id}`, { status: "done" })}
                                  >
                                    Approve Complete
                                  </button>
                                </div>
                              ) : null}
                            </article>
                          ))
                        ) : (
                          <div className="task-empty">No tasks in this stage.</div>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              {taskView === "data" && canManageTasks ? (
                <div className="task-analytics-grid">
                  <section className="analytics-card">
                    <div className="analytics-card-head">
                      <div>
                        <p className="kicker">Task Data</p>
                        <h3>Weekly Task Completion</h3>
                      </div>
                    </div>
                    <div className="weekly-bars">
                      {weeklyTaskData.map((entry) => (
                        <div key={entry.label} className="weekly-bar-item">
                          <div className="weekly-bar-frame">
                            <div className="weekly-grid-lines">
                              <span />
                              <span />
                              <span />
                            </div>
                            <div className="weekly-bar-fill" style={{ height: `${Math.max(16, entry.value * 14)}px` }} />
                          </div>
                          <strong>{entry.value}</strong>
                          <span>{entry.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="analytics-card">
                    <div className="analytics-card-head">
                      <div>
                        <p className="kicker">Task Data</p>
                        <h3>Assignment Register</h3>
                      </div>
                    </div>
                    <DataTable
                      columns={taskColumns}
                      rows={tasks}
                      canEdit={role !== "technician"} canDelete={isAdmin}
                      onEdit={(data) => handleAction("PUT", `/tasks/${data.id}`, data)}
                      onDelete={(id) => handleAction("DELETE", `/tasks/${id}`)}
                    />
                  </section>
                </div>
              ) : null}

              {taskView === "worksheet" && canManageTasks ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">Employee Worksheet</p>
                      <h3>Employee Performance</h3>
                    </div>
                  </div>
                  <div className="employee-performance-chart">
                    <div className="performance-scale">
                      <span className="zone low">Low</span>
                      <span className="zone medium">Medium</span>
                      <span className="zone high">High</span>
                    </div>
                    {employeePerformance.map((member) => (
                      <div key={member.name} className="employee-row">
                        <div className="employee-name">{member.name}</div>
                        <div className="employee-meter">
                          <div className="employee-zones">
                            <span className="employee-zone low" />
                            <span className="employee-zone medium" />
                            <span className="employee-zone high" />
                          </div>
                          <div className={`employee-bar ${member.band}`} style={{ width: `${member.score}%` }} />
                        </div>
                        <strong>{member.score}%</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {!canManageTasks && taskView === "today" ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">Today</p>
                      <h3>Today task</h3>
                    </div>
                  </div>
                  <div className="employee-task-grid">
                    {employeeTaskViews.today.length ? (
                      employeeTaskViews.today.map(renderEmployeeTaskCard)
                    ) : (
                      <div className="task-empty">No tasks assigned for today.</div>
                    )}
                  </div>
                </section>
              ) : null}

              {!canManageTasks && taskView === "data-sheet" ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">Data Sheet</p>
                      <h3>{currentEmployee?.fullName || user.fullName} Performance Sheet</h3>
                    </div>
                  </div>
                  <section className="stat-grid">
                    <div className="stat-card"><span>Completed</span><strong>{employeeDataSheet.completed}</strong></div>
                    <div className="stat-card"><span>In Progress</span><strong>{employeeDataSheet.inProgress}</strong></div>
                    <div className="stat-card"><span>Review</span><strong>{employeeDataSheet.review}</strong></div>
                    <div className="stat-card accent"><span>Over Due</span><strong>{employeeDataSheet.overdue}</strong></div>
                  </section>
                  <div className="employee-performance-chart">
                    <div className="performance-scale">
                      <span className="zone low">Low</span>
                      <span className="zone medium">Medium</span>
                      <span className="zone high">High</span>
                    </div>
                    <div className="employee-row single">
                      <div className="employee-name">{currentEmployee?.fullName || user.fullName}</div>
                      <div className="employee-meter">
                        <div className="employee-zones">
                          <span className="employee-zone low" />
                          <span className="employee-zone medium" />
                          <span className="employee-zone high" />
                        </div>
                        <div className={`employee-bar ${employeeDataSheet.band}`} style={{ width: `${employeeDataSheet.score}%` }} />
                      </div>
                      <strong>{employeeDataSheet.score}%</strong>
                    </div>
                  </div>
                </section>
              ) : null}

              {!canManageTasks && taskView === "my-tasks" ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">My Tasks</p>
                      <h3>Assigned Works</h3>
                    </div>
                  </div>
                  <div className="employee-task-grid">
                    {employeeTaskViews.myTasks.length ? (
                      employeeTaskViews.myTasks.map(renderEmployeeTaskCard)
                    ) : (
                      <div className="task-empty">No assigned tasks found.</div>
                    )}
                  </div>
                </section>
              ) : null}

              {!canManageTasks && taskView === "over-due" ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">Over Due</p>
                      <h3>Delayed Tasks</h3>
                    </div>
                  </div>
                  <div className="employee-task-grid">
                    {employeeTaskViews.overdue.length ? (
                      employeeTaskViews.overdue.map(renderEmployeeTaskCard)
                    ) : (
                      <div className="task-empty">No overdue tasks for this employee.</div>
                    )}
                  </div>
                </section>
              ) : null}

              {!canManageTasks && taskView === "urgent" ? (
                <section className="analytics-card">
                  <div className="analytics-card-head">
                    <div>
                      <p className="kicker">Urgent</p>
                      <h3>Urgent Tasks Only</h3>
                    </div>
                  </div>
                  <div className="employee-task-grid">
                    {employeeTaskViews.urgent.length ? (
                      employeeTaskViews.urgent.map(renderEmployeeTaskCard)
                    ) : (
                      <div className="task-empty">No urgent tasks for this employee.</div>
                    )}
                  </div>
                </section>
              ) : null}
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "recycleBin" ? (
          <RecycleBinSection
            role={role}
            selectedCompany={selectedCompany}
            companies={companies}
            API_URL={API_URL}
            token={token}
            api={api}
            refreshAll={refreshAll}
            setMessage={setMessage}
            user={user}
          />
        ) : null}
      </main>
    </div>
  );
}

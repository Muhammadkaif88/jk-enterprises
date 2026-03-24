import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const sections = [
  { id: "overview", icon: "OV", label: "Overview" },
  { id: "inventory", icon: "IN", label: "Components" },
  { id: "finance", icon: "AC", label: "Accounting" },
  { id: "billing", icon: "BL", label: "Billing" },
  { id: "projects", icon: "PR", label: "Projects" },
  { id: "notes", icon: "ID", label: "Idea Lab" },
  { id: "team", icon: "TM", label: "Team" },
  { id: "staffTracking", icon: "ST", label: "Staff Tracking" },
  { id: "tasks", icon: "TK", label: "Tasks" }
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
  manager: ["inventory", "finance", "billing", "projects", "notes", "team", "staffTracking", "tasks"],
  "Account Staff": ["inventory", "finance", "billing", "staffTracking", "tasks"],
  Accountant: ["inventory", "finance", "billing", "staffTracking", "tasks"],
  Trainer: ["inventory", "projects", "notes", "team", "staffTracking", "tasks"],
  Freelancer: ["inventory", "projects", "notes", "team", "tasks"],
  Internship: ["projects", "notes", "team", "staffTracking", "tasks"],
  "Robotic Engineer": ["inventory", "projects", "notes", "team", "staffTracking", "tasks"],
  technician: ["inventory", "projects", "notes", "team", "staffTracking", "tasks"]
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
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "Leave", label: "Leave" }
];

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
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

function DataTable({ columns, rows, onEdit, onDelete, canEdit }) {
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
            {canEdit ? <th style={{ textAlign: "right" }}>Actions</th> : null}
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
                {canEdit ? (
                  <td className="td-actions">
                    {editingId === row.id ? (
                      <>
                        <button className="save-row-btn" onClick={handleSave}>Save</button>
                        <button className="cancel-row-btn" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-icon" onClick={() => startEdit(row)}>Edit</button>
                        <button className="btn-icon delete" onClick={() => onDelete(row.id)}>Delete</button>
                      </>
                    )}
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (canEdit ? 1 : 0)} className="empty-cell">
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
  const [billing, setBilling] = useState([]);
  const [billingLines, setBillingLines] = useState([{ inventoryId: "", description: "", qty: 1, price: 0 }]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
  const [message, setMessage] = useState("");

  const role = user?.role || "guest";
  const staffCategory = user?.staffCategory || "";
  const isAdmin = role === "admin";
  const requestRole = !isAdmin && staffCategory === "Account Staff" ? "manager" : role;
  const allowedSectionIds = new Set(
    sectionAccessByRole[isAdmin ? "admin" : role === "manager" ? "manager" : staffCategory || "technician"] ||
      sectionAccessByRole.technician
  );
  const availableCompanies = isAdmin
    ? companies
    : companies.filter((company) => Number(company.id) === Number(user?.companyId));
  const showCompanyColumn = selectedCompany === "all";
  const companyScopedSections = new Set(["inventory", "finance", "billing", "projects", "staffTracking", "tasks"]);
  const visibleSections = sections.filter(
    (section) =>
      allowedSectionIds.has(section.id) &&
      (isAdmin || section.id !== "overview") &&
      (selectedCompany !== "all" || !companyScopedSections.has(section.id))
  );

  async function api(path, options = {}) {
    const url = new URL(`${API_URL}${path}`);
    if (!path.startsWith("/auth") && path !== "/companies") {
      url.searchParams.set("companyId", selectedCompany);
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-role": requestRole,
        "x-company-id": selectedCompany,
        "x-user-name": user?.fullName || ""
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed." }));
      throw new Error(error.message || "Request failed.");
    }

    return response.status === 204 ? null : response.json();
  }

  async function refreshAll() {
    if (!token) {
      return;
    }

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
        const [financeRows, financeTotals, billingRows] = await Promise.all([
          api("/finance"),
          api("/finance/summary"),
          api("/billing")
        ]);
        setFinance(financeRows);
        setFinanceSummary(financeTotals);
        setBilling(billingRows);
      } else {
        setFinance([]);
        setFinanceSummary(null);
        setBilling([]);
      }

      if (role === "admin") {
        setPendingUsers(await api("/auth/pending"));
      } else {
        setPendingUsers([]);
      }

      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [requestRole, role, selectedCompany, token]);

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
  const selectedCompanyInfo = useMemo(
    () => companies.find((entry) => Number(entry.id) === Number(selectedCompany)) || null,
    [companies, selectedCompany]
  );
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
      }
    ],
    [staffTracking.summary]
  );

  useEffect(() => {
    if (!canManageTasks && !["employee-home", "today", "data-sheet", "my-tasks", "over-due", "urgent"].includes(taskView)) {
      setTaskView("employee-home");
    }
  }, [canManageTasks, taskView]);

  function withSelectedCompany(data) {
    return selectedCompany === "all" ? data : { ...data, companyId: Number(selectedCompany) };
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
      await refreshAll();
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    }
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
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-user">{user.fullName}</p>
          <button className="nav-item" onClick={handleLogout}>
            <span>OUT</span> Sign Out
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
                    canEdit={false}
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
          <SectionCard title="Component Registry" kicker="Electronics inventory">
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
              rows={inventory}
              canEdit={role !== "technician"}
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

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "entryDate", label: "Date" },
                    { key: "transactionType", label: "Type" },
                    { key: "category", label: "Category" },
                    { key: "description", label: "Description" },
                    { key: "amount", label: "Amount", type: "number", render: (row) => currency(row.amount) }
                  ]}
                  rows={finance}
                  canEdit={role !== "technician"}
                  onEdit={(data) => handleAction("PUT", `/finance/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/finance/${id}`)}
                />
              </SectionCard>
            </div>
          )
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
                          <button className="btn-icon delete" onClick={() => handleAction("DELETE", `/billing/${bill.id}`)}>Delete</button>
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
              canEdit={role !== "technician"}
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
              onSubmit={(event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.target));
                if (data.tags) {
                  data.tags = data.tags.split(",").map((tag) => tag.trim());
                }
                handleAction("POST", "/notes", withSelectedCompany(data));
                event.target.reset();
              }}
            >
              <input name="title" placeholder="Idea title" required />
              <input name="tags" placeholder="Tags (comma separated)" />
              <button type="submit">Save Idea</button>
            </form>

            <DataTable
              columns={[
                ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                { key: "title", label: "Title" },
                { key: "tags", label: "Tags", render: (row) => (row.tags || []).join(", ") }
              ]}
              rows={notes}
              canEdit={true}
              onEdit={(data) => handleAction("PUT", `/notes/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/notes/${id}`)}
            />
          </SectionCard>
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
                <button type="submit">Add Staff</button>
              </form>

              <DataTable
                columns={[
                  ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                  { key: "fullName", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role", options: teamRoleOptions },
                  { key: "staffCategory", label: "Category", options: employeeCategoryOptions },
                  { key: "attendanceStatus", label: "Current Status", options: attendanceStatusOptions }
                ]}
                rows={team}
                canEdit={role === "admin"}
                onEdit={(data) => handleAction("PUT", `/team/${data.id}`, data)}
                onDelete={(id) => handleAction("DELETE", `/team/${id}`)}
              />
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "staffTracking" ? (
          <div className="section-stack">
            {staffTracking.summary ? (
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
              <SectionCard title="Daily Attendance" kicker="Mark staff presence">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/staff-tracking/attendance", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <StaffSelect name="staffId" team={team} />
                  <input name="date" type="date" required />
                  <select name="status" defaultValue="Present">
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                  </select>
                  <input name="checkIn" type="time" />
                  <input name="checkOut" type="time" />
                  <input name="notes" placeholder="Notes" className="wide" />
                  <button type="submit">Add Attendance</button>
                </form>

                <DataTable
                  columns={[
                    ...(showCompanyColumn ? [{ key: "companyName", label: "Company", editable: false }] : []),
                    { key: "staffName", label: "Staff", editable: false },
                    { key: "date", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "checkIn", label: "In" },
                    { key: "checkOut", label: "Out" }
                  ]}
                  rows={staffTracking.attendance}
                  canEdit={role !== "technician"}
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
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/staff-tracking/doubts", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <StaffSelect name="staffId" team={team} />
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
                  rows={staffTracking.doubts}
                  canEdit={role !== "technician"}
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
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/staff-tracking/complaints", withSelectedCompany(data));
                    event.target.reset();
                  }}
                >
                  <StaffSelect name="staffId" team={team} />
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
                  rows={staffTracking.complaints}
                  canEdit={role !== "technician"}
                  onEdit={(data) => handleAction("PUT", `/staff-tracking/complaints/${data.id}`, data)}
                  onDelete={(id) => handleAction("DELETE", `/staff-tracking/complaints/${id}`)}
                />
              </SectionCard>
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
                      canEdit={role !== "technician"}
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
                      employeeTaskViews.today.map((task) => (
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
                        </article>
                      ))
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
                      employeeTaskViews.myTasks.map((task) => (
                        <article key={task.id} className="task-card">
                          <div className="task-card-top">
                            <strong>{task.title}</strong>
                            <span className={`task-priority task-priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
                          </div>
                          <p className="task-meta">Staff: {task.assigneeNames || task.assigneeName || "Unassigned"}</p>
                          <p className="task-meta">Project: {task.projectName || "No project linked"}</p>
                          <p className="task-meta">Status: {task.status}</p>
                          <p className="task-meta">Due: {task.dueDate || "No due date"}</p>
                          <p className="task-copy">{task.description || "No description provided."}</p>
                        </article>
                      ))
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
                      employeeTaskViews.overdue.map((task) => (
                        <article key={task.id} className="task-card">
                          <div className="task-card-top">
                            <strong>{task.title}</strong>
                            <span className={`task-priority task-priority-${String(task.priority).toLowerCase()}`}>{task.priority}</span>
                          </div>
                          <p className="task-meta">Staff: {task.assigneeNames || task.assigneeName || "Unassigned"}</p>
                          <p className="task-meta">Project: {task.projectName || "No project linked"}</p>
                          <p className="task-meta">Due: {task.dueDate}</p>
                          <p className="task-copy">{task.description || "No description provided."}</p>
                        </article>
                      ))
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
                      employeeTaskViews.urgent.map((task) => (
                        <article key={task.id} className="task-card">
                          <div className="task-card-top">
                            <strong>{task.title}</strong>
                            <span className="task-priority task-priority-urgent">{task.priority}</span>
                          </div>
                          <p className="task-meta">Staff: {task.assigneeNames || task.assigneeName || "Unassigned"}</p>
                          <p className="task-meta">Project: {task.projectName || "No project linked"}</p>
                          <p className="task-meta">Due: {task.dueDate || "No due date"}</p>
                          <p className="task-copy">{task.description || "No description provided."}</p>
                        </article>
                      ))
                    ) : (
                      <div className="task-empty">No urgent tasks for this employee.</div>
                    )}
                  </div>
                </section>
              ) : null}
            </SectionCard>
          </div>
        ) : null}
      </main>
    </div>
  );
}

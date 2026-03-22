import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:4000/api";
const sections = [
  { id: "overview", icon: "OV", label: "Overview" },
  { id: "inventory", icon: "IN", label: "Components" },
  { id: "finance", icon: "AC", label: "Accounting" },
  { id: "projects", icon: "PR", label: "Projects" },
  { id: "notes", icon: "ID", label: "Idea Lab" },
  { id: "team", icon: "TM", label: "Team" },
  { id: "staffTracking", icon: "ST", label: "Staff Tracking" }
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
          reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
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
                      <input
                        className="edit-input"
                        value={editData[column.key] ?? ""}
                        onChange={(event) => setEditData({ ...editData, [column.key]: event.target.value })}
                        type={column.type || "text"}
                      />
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
        setError("Registration complete. Log in with the new account.");
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
          {!isLogin ? (
            <select name="role" defaultValue="technician">
              <option value="technician">Technician</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          ) : null}
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
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [finance, setFinance] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [team, setTeam] = useState([]);
  const [staffTracking, setStaffTracking] = useState({
    attendance: [],
    doubts: [],
    complaints: [],
    summary: null
  });
  const [message, setMessage] = useState("");

  const role = user?.role || "guest";

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-role": role
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
        api("/overview"),
        api("/inventory"),
        api("/projects"),
        api("/notes"),
        api("/team"),
        api("/staff-tracking/attendance"),
        api("/staff-tracking/doubts"),
        api("/staff-tracking/complaints"),
        api("/staff-tracking/summary")
      ]);

      setOverview(baseRequests[0]);
      setInventory(baseRequests[1]);
      setProjects(baseRequests[2]);
      setNotes(baseRequests[3]);
      setTeam(baseRequests[4]);
      setStaffTracking({
        attendance: baseRequests[5],
        doubts: baseRequests[6],
        complaints: baseRequests[7],
        summary: baseRequests[8]
      });

      if (role === "admin" || role === "manager") {
        const [financeRows, financeTotals] = await Promise.all([
          api("/finance"),
          api("/finance/summary")
        ]);
        setFinance(financeRows);
        setFinanceSummary(financeTotals);
      } else {
        setFinance([]);
        setFinanceSummary(null);
      }

      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [token, role]);

  const projectRows = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        bomText: (project.bom || [])
          .map((item) => {
            const inventoryItem = inventory.find((entry) => entry.id === item.inventoryId);
            return `${inventoryItem?.partName || "Unknown"} x${item.quantity}`;
          })
          .join(", ")
      })),
    [inventory, projects]
  );

  const restrictedFinance = role !== "admin" && role !== "manager";

  const handleLogin = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  async function handleAction(method, path, payload) {
    try {
      await api(path, {
        method,
        body: payload ? JSON.stringify(payload) : undefined
      });
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!token) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="brand-eyebrow">JK COMPY</p>
          <h1>ERMS Control Tower</h1>
          <p className="sidebar-copy">Unified command surface for stock, cash flow, R&D, and staff operations.</p>
        </div>

        <nav className="nav-list">
          {sections.map((section) => (
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
          </>
        ) : null}

        {activeSection === "inventory" ? (
          <SectionCard title="Component Registry" kicker="Electronics inventory">
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.target));
                handleAction("POST", "/inventory", data);
                event.target.reset();
              }}
            >
              <input name="partName" placeholder="Part name" required />
              <input name="category" placeholder="Category" required />
              <input name="partValue" placeholder="Value / spec" />
              <input name="stockQty" type="number" placeholder="Qty" required />
              <input name="unitCost" type="number" placeholder="Unit cost" required />
              <button type="submit">Add Component</button>
            </form>

            <DataTable
              columns={[
                { key: "partName", label: "Part" },
                { key: "category", label: "Category" },
                { key: "partValue", label: "Value" },
                { key: "stockQty", label: "Qty", type: "number" },
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
                    handleAction("POST", "/finance", data);
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

        {activeSection === "projects" ? (
          <SectionCard title="Project Vault" kicker="R&D tracking">
            <form
              className="form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.target));
                if (data.bom) {
                  data.bom = data.bom.split(",").map((pair) => {
                    const [inventoryId, quantity] = pair.split(":");
                    return { inventoryId: Number(inventoryId), quantity: Number(quantity) };
                  });
                }
                data.imageAttachments = await filesToDataUrls(event.target.imageFiles.files);
                handleAction("POST", "/projects", data);
                event.target.reset();
              }}
            >
              <input name="projectName" placeholder="Project name" required />
              <input name="clientName" placeholder="Client" />
              <select name="status" defaultValue="rd">
                <option value="rd">R&D</option>
                <option value="prototyping">Prototyping</option>
                <option value="testing">Testing</option>
                <option value="delivered">Delivered</option>
              </select>
              <input name="bom" placeholder="BOM (id:qty, id:qty)" className="wide" />
              <input name="documentationLink" placeholder="Project document link" />
              <input name="circuitDiagramLink" placeholder="Circuit diagram link" />
              <input name="codeLink" placeholder="Code repository / firmware link" className="wide" />
              <input name="componentNotes" placeholder="Used components details" className="wide" />
              <textarea name="projectDetails" placeholder="Project details, working logic, client notes" className="wide tall" />
              <textarea name="notes" placeholder="Extra build notes" className="wide tall" />
              <input name="imageFiles" type="file" accept="image/*" multiple className="wide" />
              <button type="submit">Create Project</button>
            </form>

            <DataTable
              columns={[
                { key: "projectName", label: "Project" },
                { key: "clientName", label: "Client" },
                { key: "status", label: "Status" },
                { key: "bomText", label: "Used Components", editable: false }
              ]}
              rows={projectRows}
              canEdit={role !== "technician"}
              onEdit={(data) => handleAction("PUT", `/projects/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/projects/${id}`)}
            />

            <div className="project-card-grid">
              {projectRows.map((project) => (
                <article key={project.id} className="project-card">
                  <div className="project-card-head">
                    <div>
                      <p className="kicker">Project Record</p>
                      <h3>{project.projectName}</h3>
                    </div>
                    <span className="project-badge">{project.status}</span>
                  </div>
                  <p className="project-meta">Client: {project.clientName || "Internal"}</p>
                  <p className="project-copy">{project.projectDetails || project.notes || "No project details added yet."}</p>
                  <div className="project-links">
                    {project.documentationLink ? <a href={project.documentationLink} target="_blank" rel="noreferrer">Docs</a> : null}
                    {project.circuitDiagramLink ? <a href={project.circuitDiagramLink} target="_blank" rel="noreferrer">Circuit</a> : null}
                    {project.codeLink || project.firmwareLink ? (
                      <a href={project.codeLink || project.firmwareLink} target="_blank" rel="noreferrer">Code</a>
                    ) : null}
                  </div>
                  <div className="project-block">
                    <strong>Used components</strong>
                    <p>{project.componentNotes || project.bomText || "No component detail added yet."}</p>
                  </div>
                  <div className="project-block">
                    <strong>Additional notes</strong>
                    <p>{project.notes || "No additional notes."}</p>
                  </div>
                  {project.imageAttachments?.length ? (
                    <div className="project-gallery">
                      {project.imageAttachments.map((image, index) => (
                        <figure key={`${project.id}-${index}`} className="project-image-card">
                          <img src={image.dataUrl} alt={image.name || `${project.projectName} image ${index + 1}`} />
                          <figcaption>{image.name || `Image ${index + 1}`}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
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
                handleAction("POST", "/notes", data);
                event.target.reset();
              }}
            >
              <input name="title" placeholder="Idea title" required />
              <input name="tags" placeholder="Tags (comma separated)" />
              <button type="submit">Save Idea</button>
            </form>

            <DataTable
              columns={[
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
          <SectionCard title="Team Control" kicker="Staff management">
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(event.target));
                handleAction("POST", "/team", data);
                event.target.reset();
              }}
            >
              <input name="fullName" placeholder="Full name" required />
              <input name="email" type="email" placeholder="Email" required />
              <select name="role" defaultValue="technician">
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">Add Staff</button>
            </form>

            <DataTable
              columns={[
                { key: "fullName", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "attendanceStatus", label: "Current Status" }
              ]}
              rows={team}
              canEdit={role === "admin"}
              onEdit={(data) => handleAction("PUT", `/team/${data.id}`, data)}
              onDelete={(id) => handleAction("DELETE", `/team/${id}`)}
            />
          </SectionCard>
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

            <div className="two-col">
              <SectionCard title="Daily Attendance" kicker="Mark staff presence">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/staff-tracking/attendance", data);
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
                    { key: "staffName", label: "Staff", editable: false },
                    { key: "date", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "checkIn", label: "In" },
                    { key: "checkOut", label: "Out" }
                  ]}
                  rows={staffTracking.attendance}
                  canEdit={role !== "technician"}
                  onEdit={(data) => handleAction("PUT", `/staff-tracking/attendance/${data.id}`, data)}
                  onDelete={() => {}}
                />
              </SectionCard>

              <SectionCard title="Doubt Clearance" kicker="Technical support queue">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = Object.fromEntries(new FormData(event.target));
                    handleAction("POST", "/staff-tracking/doubts", data);
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
            </div>

            <SectionCard title="Complaint Desk" kicker="Staff complaint tracking">
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = Object.fromEntries(new FormData(event.target));
                  handleAction("POST", "/staff-tracking/complaints", data);
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
          </div>
        ) : null}
      </main>
    </div>
  );
}

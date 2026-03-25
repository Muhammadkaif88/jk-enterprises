import { useState, useEffect } from "react";

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

// Recycle Bin section for admin panel
export default function RecycleBinSection({ role, selectedCompany, companies, API_URL, token, api, refreshAll, setMessage, user }) {
  const [recycleBinItems, setRecycleBinItems] = useState([]);
  const [recycleBinStats, setRecycleBinStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  const isAdmin = role === "admin";

  async function fetchRecycleBin() {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        api(`/recycle-bin/?companyId=${selectedCompany}`, { method: "GET" }),
        api("/recycle-bin/stats", { method: "GET" })
      ]);
      setRecycleBinItems(itemsData);
      setRecycleBinStats(statsData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecycleBin();
  }, [selectedCompany, token]);

  async function handleRestore(collection, itemId) {
    try {
      await api(`/recycle-bin/${collection}/${itemId}/restore`, {
        method: "POST",
        body: JSON.stringify({ email: user?.email })
      });
      setMessage(`Item restored from ${collection}`);
      await refreshAll(true);
      fetchRecycleBin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handlePermanentDelete(collection, itemId) {
    try {
      await api(`/recycle-bin/${collection}/${itemId}/permanent`, {
        method: "DELETE"
      });
      setMessage(`Item permanently deleted from ${collection}`);
      setDeleteConfirm(null);
      await refreshAll(true);
      fetchRecycleBin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleEmptyRecycleBin() {
    if (!emptyConfirm) return;
    try {
      await api("/recycle-bin/empty-all", {
        method: "POST",
        body: JSON.stringify({ confirm: true })
      });
      setMessage("Recycle bin emptied - all items permanently deleted");
      setEmptyConfirm(false);
      await refreshAll(true);
      fetchRecycleBin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!isAdmin) {
    return (
      <SectionCard title="Recycle Bin" kicker="Restricted">
        <p className="muted-copy">Admin access is required to manage deleted items and recycle bin.</p>
      </SectionCard>
    );
  }

  return (
    <>
      {recycleBinStats && (
        <section className="stat-grid">
          <div className="stat-card">
            <span>Deleted Items</span>
            <strong>{recycleBinStats.totalDeleted}</strong>
          </div>
          <div className="stat-card">
            <span>Can Restore</span>
            <strong>{recycleBinStats.canRestore}</strong>
          </div>
          <div className="stat-card">
            <span>Auto-Delete Soon</span>
            <strong>{recycleBinStats.willAutoDelete}</strong>
          </div>
          <div className="stat-card accent">
            <span>Days to Auto-Cleanup</span>
            <strong>10 Days</strong>
          </div>
        </section>
      )}

      <SectionCard title="Recycle Bin Management" kicker="Restore or permanently delete">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <p className="muted-copy">
            💡 Deleted items stay here for 10 days before being permanently removed automatically. You can restore or permanently delete items manually.
          </p>
          {recycleBinStats?.totalDeleted > 0 && (
            <button 
              className={emptyConfirm ? "print-btn" : "btn-icon delete"}
              onClick={() => setEmptyConfirm(!emptyConfirm)}
              style={{ whiteSpace: "nowrap", marginLeft: "12px" }}
            >
              {emptyConfirm ? "Cancel" : "Empty Bin"}
            </button>
          )}
        </div>

        {emptyConfirm && (
          <div className="task-card" style={{ background: "rgba(205, 56, 56, 0.08)", borderColor: "rgba(205, 56, 56, 0.16)", marginBottom: "18px" }}>
            <p className="task-copy">⚠️ This will permanently delete ALL {recycleBinStats?.totalDeleted} items in the recycle bin. This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn-icon delete"
                onClick={handleEmptyRecycleBin}
              >
                Yes, Delete Everything
              </button>
              <button 
                className="print-btn"
                onClick={() => setEmptyConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="task-empty">Loading recycle bin...</div>
        ) : recycleBinItems.length === 0 ? (
          <div className="task-empty">✨ Recycle bin is empty. All deleted items have been permanently removed or restored.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {recycleBinItems.map((item) => (
              <article key={`${item.collection}-${item.id}`} className="task-card">
                <div className="task-card-top">
                  <div>
                    <p className="kicker">{item.collection}</p>
                    <h3 style={{ margin: "4px 0", fontSize: "16px", lineHeight: "1.4" }}>{item.name}</h3>
                  </div>
                  <span className={`task-priority ${item.isExpired ? "task-priority-urgent" : "task-priority-high"}`}>
                    {item.isExpired ? "Expires!" : `${Math.max(0, 10 - item.daysInBin)}d left`}
                  </span>
                </div>

                <div className="task-meta">
                  <strong>Collection:</strong> {item.collection}
                </div>
                <div className="task-meta">
                  <strong>Company:</strong> {item.companyName}
                </div>
                <div className="task-meta">
                  <strong>Deleted By:</strong> {item.deletedBy || "system"}
                </div>
                <div className="task-meta">
                  <strong>Deleted On:</strong> {new Date(item.deletedAt).toLocaleDateString("en-IN")}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <div style={{ height: "4px", background: "var(--line)", borderRadius: "2px", overflow: "hidden", marginBottom: "4px" }}>
                    <div style={{
                      height: "100%",
                      width: `${(item.daysInBin / 10) * 100}%`,
                      background: item.isExpired ? "#c85c2e" : "#215f45",
                      transition: "width 0.2s"
                    }}></div>
                  </div>
                  <p className="muted-copy" style={{ margin: "0", fontSize: "12px" }}>
                    {item.isExpired 
                      ? "⚠️ Will be deleted during next cleanup"
                      : `${Math.max(0, 10 - item.daysInBin)} days remaining before auto-delete`
                    }
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {deleteConfirm === `${item.collection}-${item.id}` ? (
                    <>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handlePermanentDelete(item.collection, item.id)}
                        style={{ flex: 1, fontSize: "12px" }}
                      >
                        Confirm Delete
                      </button>
                      <button 
                        className="print-btn"
                        onClick={() => setDeleteConfirm(null)}
                        style={{ flex: 1, fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="save-row-btn"
                        onClick={() => handleRestore(item.collection, item.id)}
                        style={{ flex: 1, fontSize: "12px" }}
                      >
                        ↺ Restore
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => setDeleteConfirm(`${item.collection}-${item.id}`)}
                        style={{ flex: 1, fontSize: "12px" }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

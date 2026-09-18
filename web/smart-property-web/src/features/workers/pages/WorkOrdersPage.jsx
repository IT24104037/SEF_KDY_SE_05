import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkOrders } from "../services/workerService.js";

function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  async function fetchOrders(statusFilter) {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkOrders({ status: statusFilter });
      setWorkOrders(data);
    } catch (err) {
      setError(err.message || "Failed to load work orders.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
            <p style={styles.eyebrow}>Owner & Worker Operations</p>
            <span style={styles.phaseBadge}>Phase 5: Work Order Execution</span>
          </div>
          <h1 style={styles.title}>Work Orders</h1>
          <p style={styles.muted}>
            Track and manage official work orders, execution progress, and completion evidence.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/owner/approval" style={styles.primary}>
            Review Recommendations
          </Link>
          <Link to="/owner" style={styles.secondary}>
            Dashboard
          </Link>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filters}>
        <button
          style={filter === "" ? styles.activeFilter : styles.filter}
          onClick={() => setFilter("")}
        >
          All
        </button>
        {["Assigned", "InProgress", "Completed", "Cancelled"].map((status) => (
          <button
            key={status}
            style={filter === status ? styles.activeFilter : styles.filter}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading work orders...
        </div>
      ) : workOrders.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ margin: 0, fontWeight: 600 }}>No work orders found.</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
            Approved recommendations will automatically generate assigned work orders here.
          </p>
        </div>
      ) : (
        <section style={styles.list}>
          {workOrders.map((workOrder) => (
            <Link
              key={workOrder.id}
              to={`/owner/work-orders/${workOrder.id}`}
              style={styles.card}
            >
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={styles.priority}>
                    {workOrder.isEmergency ? "EMERGENCY" : workOrder.priority || "NORMAL"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Order #{workOrder.id} · Request #{workOrder.maintenanceRequestId}
                  </span>
                </div>
                <h2 style={styles.cardTitle}>
                  {workOrder.requestTitle || workOrder.description || "Work Order"}
                </h2>
                <p style={styles.muted}>
                  {workOrder.propertyName} · Unit {workOrder.unitLabel}
                  {workOrder.tenantName && ` · Tenant: ${workOrder.tenantName}`}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
                  Technician: <strong>{workOrder.workerName}</strong>
                </p>
              </div>

              <div style={styles.meta}>
                <span style={statusStyle(workOrder.status)}>{workOrder.status}</span>
                <small style={{ color: "#64748b" }}>
                  {workOrder.scheduledDate
                    ? `Scheduled: ${new Date(workOrder.scheduledDate).toLocaleDateString()}`
                    : `Created: ${new Date(workOrder.createdAt).toLocaleDateString()}`}
                </small>
                {workOrder.completedAt && (
                  <span style={styles.evidenceBadge}>✓ Evidence Attached</span>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function statusStyle(status) {
  switch (status) {
    case "Completed":
      return { padding: "6px 12px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", fontSize: "12px", fontWeight: 700 };
    case "InProgress":
      return { padding: "6px 12px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: 700 };
    case "Cancelled":
      return { padding: "6px 12px", borderRadius: "999px", background: "#fee2e2", color: "#b91c1c", fontSize: "12px", fontWeight: 700 };
    default:
      return { padding: "6px 12px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: 700 };
  }
}

const styles = {
  page: { minHeight: "100vh", padding: "36px 5vw", background: "#f8fafc", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "24px" },
  eyebrow: { color: "#0f766e", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 },
  phaseBadge: { background: "#ccfbf1", color: "#115e59", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
  title: { color: "#0f172a", margin: "4px 0 6px", fontSize: "24px" },
  muted: { color: "#64748b", margin: 0, fontSize: "14px" },
  primary: { padding: "9px 16px", borderRadius: "6px", background: "#0f766e", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "14px" },
  secondary: { padding: "9px 16px", borderRadius: "6px", background: "#fff", color: "#475569", border: "1px solid #cbd5e1", textDecoration: "none", fontWeight: 600, fontSize: "14px" },
  error: { padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px" },
  filters: { display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" },
  filter: { padding: "8px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff", color: "#475569", cursor: "pointer", fontWeight: 500, fontSize: "13px" },
  activeFilter: { padding: "8px 14px", border: "1px solid #0f766e", borderRadius: "6px", background: "#ccfbf1", color: "#115e59", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
  list: { display: "grid", gap: "14px" },
  card: { display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "center", padding: "20px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "inherit", textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardTitle: { margin: "6px 0", color: "#0f172a", fontSize: "17px" },
  priority: { color: "#7c3aed", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" },
  meta: { display: "grid", gap: "8px", justifyItems: "end", flexShrink: 0 },
  evidenceBadge: { fontSize: "11px", color: "#15803d", fontWeight: 600 },
  empty: { padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" },
};

export default WorkOrdersPage;

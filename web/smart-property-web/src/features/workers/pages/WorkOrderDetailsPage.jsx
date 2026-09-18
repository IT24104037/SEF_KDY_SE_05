import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createExternalArrangement,
  getWorkOrder,
  updateWorkOrderStatus,
} from "../services/workerService.js";

function WorkOrderDetailsPage() {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states for completion & notes
  const [actionNotes, setActionNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionEvidenceUrl, setCompletionEvidenceUrl] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // External fallback form
  const [external, setExternal] = useState({
    providerName: "",
    contactPhone: "",
    estimatedArrival: "",
    note: "",
  });

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const data = await getWorkOrder(id);
      setWorkOrder(data);
    } catch (err) {
      setError(err.message || "Failed to load work order.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartJob() {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWorkOrderStatus(id, "InProgress", "", "", actionNotes);
      setWorkOrder(updated);
      setMessage("Job started! Status transitioned to 'InProgress'.");
      setActionNotes("");
    } catch (err) {
      setError(err.message || "Failed to start job.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteJob(e) {
    e.preventDefault();
    if (!completionNotes.trim()) {
      setError("Completion notes are mandatory to complete a work order.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWorkOrderStatus(
        id,
        "Completed",
        completionNotes,
        completionEvidenceUrl,
        actionNotes
      );
      setWorkOrder(updated);
      setShowCompleteModal(false);
      setMessage("Work order successfully marked Completed with evidence recorded!");
    } catch (err) {
      setError(err.message || "Failed to complete work order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelJob() {
    const reason = prompt("Enter a reason for cancelling this work order:");
    if (!reason) return;

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateWorkOrderStatus(id, "Cancelled", "", "", reason);
      setWorkOrder(updated);
      setMessage("Work order marked as Cancelled.");
    } catch (err) {
      setError(err.message || "Failed to cancel work order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExternal(e) {
    e.preventDefault();
    try {
      await createExternalArrangement({
        maintenanceRequestId: workOrder.maintenanceRequestId,
        ...external,
      });
      setMessage("External maintenance arrangement saved for owner follow-up.");
      setExternal({ providerName: "", contactPhone: "", estimatedArrival: "", note: "" });
    } catch (err) {
      setError(err.message || "Failed to save external arrangement.");
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: "#64748b" }}>Loading work order details...</p>
      </main>
    );
  }

  if (!workOrder) {
    return (
      <main style={styles.page}>
        <p style={{ color: "#991b1b" }}>Work order not found.</p>
        <Link to="/owner/work-orders" style={styles.back}>
          ← Back to work orders
        </Link>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <Link to="/owner/work-orders" style={styles.back}>
        ← Back to work orders
      </Link>

      <header style={styles.header}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
            <p style={styles.eyebrow}>Work Order #{workOrder.id}</p>
            <span style={styles.phaseBadge}>Phase 5: Execution & Evidence</span>
          </div>
          <h1 style={styles.title}>
            {workOrder.requestTitle || workOrder.description || "Work Order Details"}
          </h1>
          <p style={styles.muted}>
            {workOrder.propertyName} · Unit {workOrder.unitLabel}
            {workOrder.tenantName && ` · Tenant: ${workOrder.tenantName}`}
          </p>
        </div>
        <span style={statusStyle(workOrder.status)}>{workOrder.status}</span>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <section style={styles.grid}>
        {/* Job Details Card */}
        <article style={styles.card}>
          <p style={styles.label}>Job & Assignment Details</p>
          <div style={{ margin: "12px 0" }}>
            <strong style={{ fontSize: "12px", color: "#64748b" }}>Description:</strong>
            <p style={{ margin: "4px 0 12px", lineHeight: 1.5 }}>{workOrder.description}</p>
          </div>

          <div style={styles.detailsGrid}>
            <div>
              <span style={styles.detailLabel}>Assigned Technician:</span>
              <strong style={styles.detailVal}>{workOrder.workerName}</strong>
              {workOrder.workerEmail && (
                <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>
                  {workOrder.workerEmail}
                </span>
              )}
            </div>
            <div>
              <span style={styles.detailLabel}>Priority:</span>
              <strong style={styles.detailVal}>
                {workOrder.isEmergency ? "EMERGENCY" : workOrder.priority}
              </strong>
            </div>
            <div>
              <span style={styles.detailLabel}>Scheduled Date:</span>
              <strong style={styles.detailVal}>
                {workOrder.scheduledDate
                  ? new Date(workOrder.scheduledDate).toLocaleString()
                  : "Not specified"}
              </strong>
            </div>
            <div>
              <span style={styles.detailLabel}>Started At:</span>
              <strong style={styles.detailVal}>
                {workOrder.startedAt
                  ? new Date(workOrder.startedAt).toLocaleString()
                  : "Not started yet"}
              </strong>
            </div>
            <div>
              <span style={styles.detailLabel}>Completed At:</span>
              <strong style={styles.detailVal}>
                {workOrder.completedAt
                  ? new Date(workOrder.completedAt).toLocaleString()
                  : "Not completed"}
              </strong>
            </div>
          </div>
        </article>

        {/* Execution Actions Card */}
        <article style={styles.card}>
          <p style={styles.label}>Execution Actions</p>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.4 }}>
            Lifecycle transitions are verified and logged server-side:
            <br />
            <code>Assigned → InProgress → Completed</code>
          </p>

          <div style={styles.actions}>
            {workOrder.status === "Assigned" && (
              <button
                style={styles.primary}
                onClick={handleStartJob}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Start Job (In Progress)"}
              </button>
            )}

            {workOrder.status === "InProgress" && (
              <button
                style={styles.completeBtn}
                onClick={() => setShowCompleteModal(true)}
                disabled={submitting}
              >
                Submit Completion Evidence & Finish
              </button>
            )}

            {workOrder.status !== "Completed" && workOrder.status !== "Cancelled" && (
              <button
                style={styles.cancelBtn}
                onClick={handleCancelJob}
                disabled={submitting}
              >
                Cancel Work Order
              </button>
            )}

            {workOrder.status === "Completed" && (
              <div style={styles.completedBadge}>
                ✓ Job marked Completed. Request closed.
              </div>
            )}
          </div>

          {/* Completion Evidence Section (if already completed) */}
          {workOrder.status === "Completed" && (
            <div style={styles.evidenceBox}>
              <h4 style={{ margin: "0 0 6px", color: "#15803d", fontSize: "14px" }}>
                Completion Evidence Recorded
              </h4>
              <p style={{ margin: "0 0 6px", fontSize: "13px" }}>
                <strong>Notes:</strong> {workOrder.completionNotes}
              </p>
              {workOrder.completionEvidenceUrl && (
                <div style={{ marginTop: "6px" }}>
                  <strong style={{ fontSize: "12px", color: "#64748b" }}>Evidence Image / Doc:</strong>
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={workOrder.completionEvidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0f766e", fontSize: "13px", fontWeight: 600 }}
                    >
                      View Evidence Attachment ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </article>
      </section>

      {/* Complete Job Evidence Modal / Form */}
      {showCompleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
              Submit Job Completion Evidence
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Provide clear notes describing the work performed. Completion notes are mandatory.
            </p>

            <form onSubmit={handleCompleteJob}>
              <label style={styles.modalField}>
                Completion Notes (Required):
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Replaced leaking valve, tested water pressure for 15 minutes with no leaks."
                  required
                  rows={3}
                  style={styles.textarea}
                />
              </label>

              <label style={styles.modalField}>
                Evidence Photo / Document URL (Optional):
                <input
                  type="url"
                  value={completionEvidenceUrl}
                  onChange={(e) => setCompletionEvidenceUrl(e.target.value)}
                  placeholder="https://example.com/uploads/photo_after_repair.jpg"
                  style={styles.input}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  style={styles.secondary}
                  onClick={() => setShowCompleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.completeBtn}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Confirm & Complete Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* External Maintenance Arrangement preview (Phase 6 boundary) */}
      <section style={styles.card}>
        <p style={styles.label}>External Maintenance Arrangement (Fallback)</p>
        <p style={styles.muted}>
          Arrange external vendor handling if the internal technician cannot complete the work.
        </p>
        <form onSubmit={handleExternal} style={styles.form}>
          <label style={styles.field}>
            Provider Name:
            <input
              type="text"
              value={external.providerName}
              onChange={(e) => setExternal({ ...external, providerName: e.target.value })}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            Contact Phone:
            <input
              type="text"
              value={external.contactPhone}
              onChange={(e) => setExternal({ ...external, contactPhone: e.target.value })}
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            Estimated Arrival / Date:
            <input
              type="text"
              value={external.estimatedArrival}
              onChange={(e) => setExternal({ ...external, estimatedArrival: e.target.value })}
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            Notes:
            <input
              type="text"
              value={external.note}
              onChange={(e) => setExternal({ ...external, note: e.target.value })}
              style={styles.input}
            />
          </label>
          <button style={styles.secondary} type="submit">
            Save External Arrangement
          </button>
        </form>
      </section>
    </main>
  );
}

function statusStyle(status) {
  switch (status) {
    case "Completed":
      return { padding: "8px 14px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", fontSize: "12px", fontWeight: 700 };
    case "InProgress":
      return { padding: "8px 14px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: 700 };
    case "Cancelled":
      return { padding: "8px 14px", borderRadius: "999px", background: "#fee2e2", color: "#b91c1c", fontSize: "12px", fontWeight: 700 };
    default:
      return { padding: "8px 14px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: 700 };
  }
}

const styles = {
  page: { minHeight: "100vh", padding: "36px 5vw", background: "#f8fafc", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif" },
  back: { color: "#0f766e", fontWeight: 600, fontSize: "14px", textDecoration: "none" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", margin: "18px 0 24px", flexWrap: "wrap" },
  eyebrow: { color: "#0f766e", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 },
  phaseBadge: { background: "#ccfbf1", color: "#115e59", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
  title: { color: "#0f172a", margin: "4px 0", fontSize: "24px" },
  muted: { color: "#64748b", margin: 0, fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" },
  card: { padding: "24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  label: { color: "#64748b", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 12px" },
  detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  detailLabel: { display: "block", fontSize: "11px", color: "#64748b" },
  detailVal: { display: "block", fontSize: "14px", color: "#0f172a", marginTop: "2px" },
  actions: { display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" },
  primary: { padding: "10px 18px", border: 0, borderRadius: "6px", background: "#0f766e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
  completeBtn: { padding: "10px 18px", border: 0, borderRadius: "6px", background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
  cancelBtn: { padding: "10px 14px", border: "1px solid #f87171", borderRadius: "6px", background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
  secondary: { padding: "9px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff", color: "#334155", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
  completedBadge: { padding: "10px 14px", background: "#dcfce7", color: "#15803d", borderRadius: "6px", fontWeight: 600, fontSize: "13px" },
  evidenceBox: { marginTop: "16px", padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" },
  error: { padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px" },
  success: { padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "6px", marginBottom: "16px" },
  form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginTop: "14px", alignItems: "end" },
  field: { display: "grid", gap: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" },
  input: { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" },
  textarea: { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", resize: "vertical" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { background: "#fff", borderRadius: "10px", padding: "28px", maxWidth: "520px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
  modalField: { display: "grid", gap: "6px", fontWeight: 600, fontSize: "13px", color: "#334155", marginBottom: "14px" },
};

export default WorkOrderDetailsPage;

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getApprovalRequest,
  getPendingApprovals,
  submitApprovalDecision,
} from "../../workers/services/workerService.js";

function ApprovalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get("requestId");

  const [request, setRequest] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [selectedId, setSelectedId] = useState(requestIdParam || "");
  const [decision, setDecision] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData(requestIdParam);
  }, [requestIdParam]);

  async function loadData(targetId) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // Load all pending for owner to populate selector
      const pending = await getPendingApprovals();
      setPendingList(pending);

      const activeId = targetId || (pending.length > 0 ? pending[0].id : null);
      setSelectedId(activeId ? String(activeId) : "");

      const data = await getApprovalRequest(activeId);
      setRequest(data);
    } catch (err) {
      setError(err.message || "Failed to load technician recommendation.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRequest(e) {
    const newId = e.target.value;
    setSelectedId(newId);
    setSearchParams(newId ? { requestId: newId } : {});
  }

  async function handleDecision(nextDecision) {
    if (!request) return;
    if ((nextDecision === "Reject" || nextDecision === "Request Revision") && !note.trim()) {
      setError("Please provide a note or reason for rejection or revision request.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await submitApprovalDecision(
        request.id,
        nextDecision,
        note,
        request.proposedTime,
        request.recommendedWorkerId
      );

      setDecision(result.decision);
      if (result.createdWorkOrder) {
        setMessage(
          `Approved successfully! Official Work Order #${result.workOrderId || ""} has been created and assigned.`
        );
      } else {
        setMessage(`${nextDecision} recorded successfully.`);
      }

      // Refresh data
      loadData(selectedId);
    } catch (err) {
      setError(err.message || "Failed to record approval decision.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Running deterministic worker matching...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.eyebrow}>Owner Workspace</span>
            <span style={styles.phaseBadge}>Phase 4: Worker Recommendation & Approval</span>
          </div>
          <h1 style={styles.title}>Technician Recommendation & Work Order Approval</h1>
          <p style={styles.muted}>
            A matching recommendation is not an assignment until you review and approve it.
            Only property owners can officially create an internal work order.
          </p>
        </div>
        <div style={styles.headerActions}>
          <Link to="/owner/work-orders" style={styles.linkButton}>
            View Work Orders
          </Link>
          <Link to="/owner" style={styles.secondaryButton}>
            Dashboard
          </Link>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {message && <div style={styles.successBanner}>{message}</div>}

      {pendingList.length > 1 && (
        <div style={styles.selectorCard}>
          <label style={styles.selectorLabel}>
            Select Maintenance Request:
            <select
              value={selectedId}
              onChange={handleSelectRequest}
              style={styles.select}
            >
              {pendingList.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.property} ({p.unit}) - {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!request ? (
        <section style={styles.card}>
          <p style={styles.emptyState}>
            No pending maintenance recommendations found for your properties.
          </p>
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <Link to="/owner" style={styles.primary}>
              Return to Owner Dashboard
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section style={styles.grid}>
            {/* Maintenance Request Card */}
            <article style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.label}>Maintenance Request #{request.id}</span>
                <span
                  style={{
                    ...styles.priorityBadge,
                    background:
                      request.isEmergency || request.priority === "Emergency"
                        ? "#fee2e2"
                        : "#e0e7ff",
                    color:
                      request.isEmergency || request.priority === "Emergency"
                        ? "#b91c1c"
                        : "#3730a3",
                  }}
                >
                  {request.priority || (request.isEmergency ? "Emergency" : "Normal")}
                </span>
              </div>
              <h2 style={styles.requestTitle}>{request.title}</h2>
              <p style={styles.metaLine}>
                <strong>Property:</strong> {request.property} · <strong>Unit:</strong> {request.unit}
              </p>
              <p style={styles.metaLine}>
                <strong>Tenant:</strong> {request.tenant}
              </p>
              <div style={styles.descBox}>
                <strong style={{ fontSize: "12px", color: "#475569" }}>Description:</strong>
                <p style={{ margin: "4px 0 0", color: "#1e293b", lineHeight: 1.5 }}>
                  {request.description}
                </p>
              </div>
            </article>

            {/* Recommendation Card */}
            <article style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.label}>Matched Technician</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: request.hasAvailableWorker ? "#dcfce7" : "#fee2e2",
                    color: request.hasAvailableWorker ? "#15803d" : "#b91c1c",
                  }}
                >
                  {request.validationStatus ||
                    (request.hasAvailableWorker ? "Validated" : "No Worker Available")}
                </span>
              </div>

              {request.hasAvailableWorker ? (
                <>
                  <h2 style={styles.workerTitle}>{request.recommendedWorker}</h2>
                  <div style={styles.specGrid}>
                    <div>
                      <span style={styles.specLabel}>Required Skill:</span>
                      <strong style={styles.specVal}>{request.workerSkill}</strong>
                    </div>
                    <div>
                      <span style={styles.specLabel}>Hourly Rate:</span>
                      <strong style={styles.specVal}>
                        {request.hourlyRate ? `$${request.hourlyRate}/hr` : "Standard Rate"}
                      </strong>
                    </div>
                    <div>
                      <span style={styles.specLabel}>Service Area:</span>
                      <strong style={styles.specVal}>{request.serviceArea}</strong>
                    </div>
                    <div>
                      <span style={styles.specLabel}>Proposed Schedule:</span>
                      <strong style={styles.specVal}>
                        {request.proposedTime
                          ? new Date(request.proposedTime).toLocaleString()
                          : "Immediate"}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.validationNotice}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>{request.validationSummary || "Deterministic validation passed."}</span>
                  </div>
                </>
              ) : (
                <div style={styles.noWorkerBox}>
                  <p style={styles.noWorkerHeading}>
                    {request.isEmergency
                      ? "⚠️ NO AVAILABLE EMERGENCY WORKER"
                      : "⚠️ NO SUITABLE WORKER FOUND"}
                  </p>
                  <p style={styles.noWorkerText}>{request.message}</p>
                  {request.isEmergency ? (
                    <Link
                      to={`/owner/external-maintenance?requestId=${request.id}`}
                      style={styles.externalButton}
                    >
                      Arrange External Emergency Maintenance
                    </Link>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <button
                        onClick={() => loadData(selectedId)}
                        style={styles.retryButton}
                      >
                        Retry Matching
                      </button>
                      <Link
                        to={`/owner/external-maintenance?requestId=${request.id}`}
                        style={styles.externalButton}
                      >
                        Handle Externally
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </article>
          </section>

          {/* Owner Decision Action Panel */}
          <section style={styles.card}>
            <h3 style={styles.decisionHeading}>Owner Approval Decision</h3>
            <label style={styles.field}>
              Decision Note / Reason:
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes for the work order or reason for rejection/revision..."
                rows={3}
                style={styles.textarea}
              />
            </label>

            <div style={styles.actions}>
              <button
                style={styles.reject}
                onClick={() => handleDecision("Reject")}
                disabled={submitting}
              >
                Reject
              </button>
              <button
                style={styles.revise}
                onClick={() => handleDecision("Request Revision")}
                disabled={submitting}
              >
                Request Revision
              </button>
              {request.hasAvailableWorker && (
                <button
                  style={styles.primary}
                  onClick={() => handleDecision("Approve")}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Approve & Create Work Order"}
                </button>
              )}
            </div>

            {decision && (
              <p style={styles.decisionRecord}>
                Recorded decision: <strong>{decision}</strong>
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "36px 5vw",
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#0f766e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontWeight: 600,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  badgeRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "8px",
  },
  eyebrow: {
    color: "#0f766e",
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  phaseBadge: {
    background: "#ccfbf1",
    color: "#115e59",
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 700,
  },
  title: {
    color: "#0f172a",
    margin: "0 0 8px 0",
    fontSize: "24px",
  },
  muted: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.5,
    maxWidth: "650px",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  linkButton: {
    padding: "9px 16px",
    background: "#0f766e",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  secondaryButton: {
    padding: "9px 16px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  errorBanner: {
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "18px",
    fontWeight: 500,
  },
  successBanner: {
    padding: "14px 18px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    marginBottom: "18px",
    fontWeight: 600,
    border: "1px solid #86efac",
  },
  selectorCard: {
    background: "#fff",
    padding: "14px 20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "18px",
  },
  selectorLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: 600,
    color: "#334155",
    fontSize: "14px",
  },
  select: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  label: {
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  priorityBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },
  requestTitle: {
    margin: "0 0 12px 0",
    color: "#0f172a",
    fontSize: "18px",
  },
  workerTitle: {
    margin: "0 0 14px 0",
    color: "#0f172a",
    fontSize: "18px",
  },
  metaLine: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#475569",
  },
  descBox: {
    marginTop: "14px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #f1f5f9",
  },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  specLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
  },
  specVal: {
    display: "block",
    fontSize: "13px",
    color: "#1e293b",
    marginTop: "2px",
  },
  validationNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f0fdf4",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "12px",
    fontWeight: 600,
  },
  checkIcon: {
    color: "#16a34a",
    fontWeight: 900,
  },
  noWorkerBox: {
    background: "#fef2f2",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    textAlign: "center",
  },
  noWorkerHeading: {
    fontWeight: 700,
    color: "#991b1b",
    fontSize: "13px",
    margin: "0 0 8px 0",
  },
  noWorkerText: {
    color: "#7f1d1d",
    fontSize: "12px",
    lineHeight: 1.4,
    margin: "0 0 12px 0",
  },
  externalButton: {
    display: "inline-block",
    padding: "9px 14px",
    background: "#dc2626",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "13px",
  },
  retryButton: {
    padding: "9px 14px",
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
  decisionHeading: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    color: "#0f172a",
  },
  field: {
    display: "grid",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontFamily: "inherit",
    fontSize: "14px",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  primary: {
    padding: "10px 18px",
    border: 0,
    borderRadius: "6px",
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  },
  reject: {
    padding: "10px 16px",
    border: 0,
    borderRadius: "6px",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
  revise: {
    padding: "10px 16px",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    background: "#fff",
    color: "#b45309",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
  decisionRecord: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    color: "#64748b",
    padding: "30px 0",
    fontSize: "15px",
  },
};

export default ApprovalPage;

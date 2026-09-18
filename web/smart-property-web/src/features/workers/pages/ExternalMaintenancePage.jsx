import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createExternalArrangement,
  getExternalArrangements,
  confirmExternalArrangement,
} from "../services/workerService.js";

function ExternalMaintenancePage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [arrangements, setArrangements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form state
  const [providerName, setProviderName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (requestId) {
      loadArrangements();
    }
  }, [requestId]);

  async function loadArrangements() {
    setLoading(true);
    setError("");
    try {
      const list = await getExternalArrangements(requestId);
      setArrangements(list);
    } catch (err) {
      setError(err.message || "Failed to load external arrangements.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!requestId) {
      setError("Please specify a maintenance request ID.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        maintenanceRequestId: Number(requestId),
        providerName,
        contactPhone,
        contactEmail,
        estimatedArrival,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        note,
      };

      const result = await createExternalArrangement(payload);
      setMessage(
        `External maintenance arrangement with "${result.providerName}" created successfully!`
      );
      setProviderName("");
      setContactPhone("");
      setContactEmail("");
      setEstimatedArrival("");
      setEstimatedCost("");
      setNote("");
      loadArrangements();
    } catch (err) {
      setError(err.message || "Failed to create external arrangement.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(id) {
    const confirmedEta = prompt("Enter confirmed ETA or arrival time:", "Within 1 hour");
    if (confirmedEta === null) return;

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await confirmExternalArrangement(id, {
        estimatedArrival: confirmedEta,
        note: "Confirmed by property owner.",
      });
      setMessage("External arrangement confirmed! Tenant has been notified with confirmed ETA.");
      loadArrangements();
    } catch (err) {
      setError(err.message || "Failed to confirm external arrangement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <Link to={requestId ? `/owner/approval?requestId=${requestId}` : "/owner/work-orders"} style={styles.back}>
        ← Back to {requestId ? "Recommendation Review" : "Work Orders"}
      </Link>

      <header style={styles.header}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
            <p style={styles.eyebrow}>Owner Maintenance Operations</p>
            <span style={styles.phaseBadge}>Phase 6: External Arrangement</span>
          </div>
          <h1 style={styles.title}>External Maintenance Arrangement</h1>
          <p style={styles.muted}>
            Use external specialist vendors when internal technicians are unavailable or for emergency repairs.
            External contractors are managed without creating fake system workers.
          </p>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      {!requestId ? (
        <div style={styles.card}>
          <p style={{ color: "#b91c1c", fontWeight: 600 }}>No Maintenance Request Specified</p>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Please select an active maintenance request from the Owner Approval page to arrange external maintenance.
          </p>
          <Link to="/owner/approval" style={styles.primaryBtn}>
            Go to Owner Approval
          </Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* New External Arrangement Form */}
          <section style={styles.card}>
            <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px" }}>
              Arrange External Vendor for Request #{requestId}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px" }}>
              Fill in the external contractor details. The tenant will receive the provider and ETA updates once confirmed.
            </p>

            <form onSubmit={handleCreate} style={styles.form}>
              <label style={styles.field}>
                Provider / Company Name (Required):
                <input
                  type="text"
                  required
                  placeholder="e.g. QuickFix Emergency Plumbing Ltd"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  style={styles.input}
                />
              </label>

              <div style={styles.row}>
                <label style={styles.field}>
                  Contact Phone:
                  <input
                    type="tel"
                    placeholder="e.g. +94 77 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.field}>
                  Contact Email:
                  <input
                    type="email"
                    placeholder="contact@quickfix.lk"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.row}>
                <label style={styles.field}>
                  Estimated Arrival / ETA:
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow 10:00 AM or Within 45 mins"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.field}>
                  Estimated Cost (LKR):
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 7500"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    style={styles.input}
                  />
                </label>
              </div>

              <label style={styles.field}>
                Notes & Scope of Work:
                <textarea
                  rows={3}
                  placeholder="Specify details, warranty terms, or special access instructions..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={styles.textarea}
                />
              </label>

              <button
                type="submit"
                style={styles.primaryBtn}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save External Arrangement"}
              </button>
            </form>
          </section>

          {/* Existing Arrangements List */}
          <section style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>
                Arranged Providers ({arrangements.length})
              </h3>
              <button onClick={loadArrangements} style={styles.refreshBtn}>
                Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#64748b" }}>Loading external arrangements...</p>
            ) : arrangements.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={{ margin: 0, fontWeight: 600 }}>No external arrangements yet.</p>
                <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                  Save an arrangement using the form on the left.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {arrangements.map((a) => (
                  <div key={a.id} style={styles.arrangementItem}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={a.isEmergency ? styles.emergencyBadge : styles.normalBadge}>
                            {a.isEmergency ? "EMERGENCY" : "NORMAL"}
                          </span>
                          <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                            {a.providerName}
                          </strong>
                        </div>
                        {a.contactPhone && (
                          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                            📞 {a.contactPhone} {a.contactEmail && `· ✉️ ${a.contactEmail}`}
                          </p>
                        )}
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                          <strong>ETA:</strong> {a.estimatedArrival || "Pending confirmation"}
                          {a.estimatedCost && ` · LKR ${a.estimatedCost.toLocaleString()}`}
                        </p>
                        {a.note && (
                          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#334155", fontStyle: "italic" }}>
                            "{a.note}"
                          </p>
                        )}
                      </div>
                      <span style={statusBadgeStyle(a.status)}>{a.status}</span>
                    </div>

                    {a.status !== "Confirmed" && a.status !== "Completed" && (
                      <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleConfirm(a.id)}
                          style={styles.confirmBtn}
                          disabled={submitting}
                        >
                          ✓ Confirm Provider & ETA
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function statusBadgeStyle(status) {
  switch (status) {
    case "Confirmed":
      return { padding: "4px 10px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", fontSize: "12px", fontWeight: 700 };
    case "Completed":
      return { padding: "4px 10px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: 700 };
    default:
      return { padding: "4px 10px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: 700 };
  }
}

const styles = {
  page: { minHeight: "100vh", padding: "36px 5vw", background: "#f8fafc", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif" },
  back: { color: "#0f766e", fontWeight: 600, fontSize: "14px", textDecoration: "none" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", margin: "16px 0 24px", flexWrap: "wrap" },
  eyebrow: { color: "#0f766e", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 },
  phaseBadge: { background: "#ccfbf1", color: "#115e59", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
  title: { color: "#0f172a", margin: "4px 0", fontSize: "24px" },
  muted: { color: "#64748b", margin: 0, fontSize: "14px", maxWidth: "650px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" },
  card: { padding: "24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  form: { display: "grid", gap: "14px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  field: { display: "grid", gap: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" },
  input: { padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" },
  textarea: { padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", resize: "vertical" },
  primaryBtn: { padding: "10px 18px", border: 0, borderRadius: "6px", background: "#0f766e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px" },
  confirmBtn: { padding: "7px 14px", border: 0, borderRadius: "6px", background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "12px" },
  refreshBtn: { padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", color: "#475569", cursor: "pointer", fontSize: "12px" },
  emptyBox: { padding: "30px", background: "#f8fafc", borderRadius: "6px", textAlign: "center", color: "#64748b" },
  arrangementItem: { padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" },
  emergencyBadge: { fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" },
  normalBadge: { fontSize: "11px", fontWeight: 700, color: "#4338ca", background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px" },
  error: { padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px" },
  success: { padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "6px", marginBottom: "16px" },
};

export default ExternalMaintenancePage;

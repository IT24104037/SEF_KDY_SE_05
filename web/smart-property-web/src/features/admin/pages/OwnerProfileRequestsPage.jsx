import { useEffect, useState } from "react";
import {
  getPendingProfileChangeRequests,
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
} from "../../../api/ownerProfileAdminApi.js";

export default function OwnerProfileRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      const data = await getPendingProfileChangeRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || "Failed to load pending profile change requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleApprove(requestId) {
    try {
      setError("");
      setMessage("");
      setProcessingId(requestId);
      await approveProfileChangeRequest(requestId);
      setMessage("Profile change request approved successfully. User record updated.");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Failed to approve profile change request.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(requestId) {
    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setProcessingId(requestId);
      await rejectProfileChangeRequest(requestId, rejectionReason.trim());
      setMessage("Profile change request rejected.");
      setRejectingRequestId(null);
      setRejectionReason("");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Failed to reject profile change request.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Owner Profile Change Requests</h1>
      <p style={styles.pageSubtitle}>
        Review and approve or reject profile update requests submitted by verified property owners.
      </p>

      {loading && <p style={{ color: "#6b7280" }}>Loading pending requests...</p>}
      {error && <div style={styles.errorBox}>{error}</div>}
      {message && <div style={styles.successBox}>{message}</div>}

      {!loading && !error && requests.length === 0 && (
        <div style={styles.emptyCard}>
          <p style={{ margin: 0, color: "#4b5563" }}>No pending profile change requests.</p>
        </div>
      )}

      {requests.map((req) => (
        <section key={req.requestId} style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Request #{req.requestId} - Owner #{req.ownerId}</h2>
            <span style={styles.badge}>Pending Review</span>
          </div>

          <div style={styles.comparisonGrid}>
            <div style={styles.column}>
              <h3 style={styles.columnHeader}>Current Profile</h3>
              <div style={styles.detailRow}>
                <span style={styles.label}>Full Name:</span>
                <span>{req.currentFullName}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Email:</span>
                <span>{req.currentEmail || "—"}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Mobile:</span>
                <span>{req.currentMobile || "—"}</span>
              </div>
            </div>

            <div style={styles.columnHighlight}>
              <h3 style={styles.columnHeaderHighlight}>Requested Changes</h3>
              <div style={styles.detailRow}>
                <span style={styles.label}>Requested Name:</span>
                <strong style={req.requestedFullName !== req.currentFullName ? styles.changedText : {}}>
                  {req.requestedFullName}
                </strong>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Requested Email:</span>
                <strong style={req.requestedEmail !== req.currentEmail ? styles.changedText : {}}>
                  {req.requestedEmail || "—"}
                </strong>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Requested Mobile:</span>
                <strong style={req.requestedMobile !== req.currentMobile ? styles.changedText : {}}>
                  {req.requestedMobile || "—"}
                </strong>
              </div>
            </div>
          </div>

          <p style={styles.timestamp}>
            Submitted: {new Date(req.createdAt).toLocaleString()}
          </p>

          <div style={styles.actions}>
            <button
              onClick={() => handleApprove(req.requestId)}
              disabled={processingId === req.requestId}
              style={styles.approveButton}
            >
              {processingId === req.requestId ? "Processing..." : "Approve Changes"}
            </button>
            <button
              onClick={() => {
                setRejectingRequestId(req.requestId);
                setRejectionReason("");
                setError("");
              }}
              disabled={processingId === req.requestId}
              style={styles.rejectButton}
            >
              Reject Request
            </button>
          </div>

          {rejectingRequestId === req.requestId && (
            <div style={styles.rejectionBox}>
              <h3 style={{ marginTop: 0, fontSize: "15px", color: "#991b1b" }}>
                Reject Profile Change Request #{req.requestId}
              </h3>
              <label style={styles.fieldLabel}>
                Rejection Reason (Required):
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  style={styles.textarea}
                  placeholder="Explain why this profile change request is being rejected..."
                  required
                />
              </label>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReject(req.requestId)}
                  disabled={!rejectionReason.trim() || processingId === req.requestId}
                  style={styles.confirmRejectButton}
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setRejectingRequestId(null)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

const styles = {
  pageTitle: {
    marginTop: 0,
    color: "#17324D",
    fontSize: "24px",
    fontWeight: "700",
  },
  pageSubtitle: {
    color: "#6B7280",
    marginBottom: "24px",
    marginTop: "4px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: "20px",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#17324D",
    margin: 0,
  },
  badge: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  column: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "14px",
  },
  columnHighlight: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "14px",
  },
  columnHeader: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  columnHeaderHighlight: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e40af",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    padding: "4px 0",
  },
  label: {
    color: "#6b7280",
  },
  changedText: {
    color: "#1d4ed8",
  },
  timestamp: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "8px 0 16px 0",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  approveButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  rejectionBox: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
  },
  fieldLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    marginTop: "4px",
    boxSizing: "border-box",
  },
  confirmRejectButton: {
    backgroundColor: "#b91c1c",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    color: "#b91c1c",
    marginBottom: "20px",
  },
  successBox: {
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    color: "#166534",
    marginBottom: "20px",
  },
};

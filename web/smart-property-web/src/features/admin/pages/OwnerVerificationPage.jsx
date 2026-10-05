import { useEffect, useState } from "react";
import {
  getAllOwners,
  updateOwnerVerification,
} from "../../../api/ownerVerificationAdminApi.js";

export default function OwnerVerificationPage() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOwners() {
    try {
      setLoading(true);
      setError("");
      setOwners(await getAllOwners());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOwners();
  }, []);

  async function handleDecision(decision) {
    if (!selectedOwner) return;
    try {
      setError("");
      setMessage("");
      await updateOwnerVerification(selectedOwner.ownerId, decision, rejectionReason);
      setMessage(`Owner ${decision === "Verified" ? "approved" : "rejected"} successfully.`);
      setSelectedOwner(null);
      setRejectionReason("");
      await loadOwners();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredOwners = owners.filter((owner) => {
    const matchesSearch =
      !search ||
      owner.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      owner.email?.toLowerCase().includes(search.toLowerCase()) ||
      (owner.mobile && owner.mobile.includes(search));

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "PendingVerification" && (owner.status === "PendingVerification" || owner.status === "UnderReview")) ||
      (statusFilter === "Verified" && (owner.status === "Verified" || owner.status === "Approved")) ||
      (statusFilter === "Rejected" && owner.status === "Rejected");

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin workspace</p>
          <h1 style={styles.title}>Owner Verification</h1>
          <p style={styles.muted}>Review and manage Property Owner account verification records.</p>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search name, email or mobile"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          style={styles.input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PendingVerification">Under Review</option>
          <option value="Verified">Approved / Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p>Loading owner applications...</p>
      ) : filteredOwners.length === 0 ? (
        <p style={styles.empty}>No owner verification records match these filters.</p>
      ) : (
        <div style={styles.cardList}>
          {filteredOwners.map((owner) => (
            <div key={owner.ownerId} style={styles.cardItem}>
              <div style={styles.cardMain}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <strong style={styles.cardTitle}>{owner.fullName}</strong>
                  <p style={styles.cardSub}>
                    {owner.email} {owner.mobile ? `· ${owner.mobile}` : ""}
                  </p>
                </div>
                <div style={styles.cardMeta}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    Submitted: {new Date(owner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={styles.cardRight}>
                <span style={statusStyle(owner.status)}>{formatStatus(owner.status)}</span>
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    setSelectedOwner(owner);
                    setRejectionReason("");
                    setError("");
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOwner && (
        <div style={styles.overlay}>
          <section style={styles.modal}>
            <button style={styles.close} onClick={() => setSelectedOwner(null)}>
              ✕
            </button>
            <p style={styles.eyebrow}>Owner Record #{selectedOwner.ownerId}</p>
            <h2 style={styles.modalTitle}>{selectedOwner.fullName}</h2>
            <p style={{ margin: "4px 0 16px", color: "#6b7280" }}>
              {selectedOwner.email} · {selectedOwner.mobile || "No mobile number"}
            </p>

            <div style={styles.infoGrid}>
              <div>
                <strong>Status:</strong>{" "}
                <span style={statusStyle(selectedOwner.status)}>
                  {formatStatus(selectedOwner.status)}
                </span>
              </div>
              <div>
                <strong>Submitted:</strong> {new Date(selectedOwner.createdAt).toLocaleString()}
              </div>
              {selectedOwner.verifiedAt && (
                <div>
                  <strong>Verified Date:</strong> {new Date(selectedOwner.verifiedAt).toLocaleString()}
                </div>
              )}
            </div>

            {selectedOwner.status === "Rejected" && selectedOwner.rejectionReason && (
              <div style={styles.rejectionNote}>
                <strong>Rejection Reason:</strong> {selectedOwner.rejectionReason}
              </div>
            )}

            {selectedOwner.documents && selectedOwner.documents.length > 0 && (
              <div style={styles.docBox}>
                <strong style={{ fontSize: "12px", color: "#0369a1", textTransform: "uppercase" }}>
                  📄 Verification Documents
                </strong>
                {selectedOwner.documents.map((doc) => (
                  <div key={doc.id} style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{doc.documentType || "Proof Document"}</span>
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocButton}
                    >
                      ↗ Open Document
                    </a>
                  </div>
                ))}
              </div>
            )}

            {(selectedOwner.status === "PendingVerification" || selectedOwner.status === "UnderReview") && (
              <>
                <label style={styles.field}>
                  Rejection reason
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Required only when rejecting..."
                    rows={3}
                    style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>
                <div style={styles.actions}>
                  <button
                    style={styles.rejectButton}
                    onClick={() => handleDecision("Rejected")}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject
                  </button>
                  <button style={styles.primaryButton} onClick={() => handleDecision("Verified")}>
                    Approve Owner
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatStatus(status) {
  if (status === "PendingVerification" || status === "UnderReview") return "Under Review";
  if (status === "Verified" || status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  return status;
}

function statusStyle(status) {
  const colors = {
    PendingVerification: ["#fff7e6", "#b56b00"],
    UnderReview: ["#fff7e6", "#b56b00"],
    Verified: ["#e8f7ef", "#16804a"],
    Approved: ["#e8f7ef", "#16804a"],
    Rejected: ["#fff1f1", "#b42318"],
  };
  const [background, color] = colors[status] || ["#f5f7fa", "#25313c"];
  return { padding: "4px 8px", borderRadius: "999px", background, color, fontSize: "12px", fontWeight: 700 };
}

const styles = {
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" },
  eyebrow: { margin: 0, color: "#5145cd", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  title: { margin: "8px 0", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  modalTitle: { margin: "0 0 4px", color: "#172033" },
  muted: { color: "#64748b", fontSize: "14px", lineHeight: 1.5 },
  filters: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "22px" },
  input: { minWidth: "220px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#1f2933", background: "#fff", fontFamily: "inherit", fontSize: "13px" },
  primaryButton: { padding: "11px 16px", border: 0, borderRadius: "8px", background: "#15803d", color: "#fff", cursor: "pointer", fontWeight: 700 },
  secondaryButton: { padding: "8px 13px", border: "1px solid #5145cd", borderRadius: "8px", background: "#f4f3ff", color: "#5145cd", cursor: "pointer", fontWeight: 700 },
  rejectButton: { padding: "11px 16px", border: 0, borderRadius: "8px", background: "#b91c1c", color: "#fff", cursor: "pointer", fontWeight: 700 },
  viewDocButton: { padding: "6px 10px", border: "1px solid #c7c3ff", borderRadius: "8px", background: "#f4f3ff", color: "#5145cd", textDecoration: "none", fontWeight: 700, fontSize: "12px" },
  docBox: { margin: "16px 0", padding: "14px", background: "#f7f7ff", border: "1px solid #dedcff", borderRadius: "10px" },
  cardList: { display: "flex", flexDirection: "column", gap: "12px" },
  cardItem: {
    background: "#fff",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
  },
  cardMain: { display: "flex", alignItems: "center", gap: "24px", flex: 1, flexWrap: "wrap" },
  cardTitle: { fontSize: "15px", color: "#172033" },
  cardSub: { margin: "3px 0 0", color: "#64748b", fontSize: "13px" },
  cardMeta: { minWidth: "130px" },
  cardRight: { display: "flex", alignItems: "center", gap: "14px" },
  empty: { padding: "24px", color: "#6b7280" },
  success: { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px" },
  error: { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px 14px", borderRadius: "8px" },
  rejectionNote: { marginTop: "12px", padding: "12px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "14px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "14px 0", fontSize: "14px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(24, 30, 45, .48)", display: "grid", placeItems: "center", padding: "24px", zIndex: 100 },
  modal: { position: "relative", width: "min(600px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "clamp(22px, 4vw, 30px)", background: "#fff", border: "1px solid #e2e7e9", borderRadius: "12px", boxShadow: "0 24px 80px rgba(15, 23, 42, .22)" },
  close: { position: "absolute", top: "18px", right: "18px", border: 0, background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: "18px", fontWeight: "bold" },
  field: { display: "grid", gap: "8px", marginTop: "16px", fontWeight: 700, color: "#334155" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
};

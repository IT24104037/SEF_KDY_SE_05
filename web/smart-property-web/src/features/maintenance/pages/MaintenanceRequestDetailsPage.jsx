import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getMaintenanceRequestById,
  getMaintenanceHistory,
  updateMaintenanceStatus,
} from "../services/maintenanceApi.js";
import {
  startPlannerWorkflow,
  getWorkflowByRequestId,
} from "../../ai-workflow/services/aiWorkflowService.js";

function MaintenanceRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiWorkflow, setAiWorkflow] = useState(null);
  const [startingPlanner, setStartingPlanner] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");

      const [requestData, historyData, workflowData] = await Promise.all([
        getMaintenanceRequestById(id),
        getMaintenanceHistory(id),
        getWorkflowByRequestId(id).catch(() => null),
      ]);

      setRequest(requestData);
      setHistory(historyData || []);
      setAiWorkflow(workflowData || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartPlanner() {
    try {
      setStartingPlanner(true);
      setError("");
      setMessage("");
      const result = await startPlannerWorkflow(id);
      setAiWorkflow(result);
      setMessage("Agent 1 Planner workflow started successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setStartingPlanner(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function handleApprove() {
    try {
      setUpdating(true);
      setError("");
      setMessage("");

      await updateMaintenanceStatus(
        id,
        "Approved",
        "Emergency request approved."
      );

      setMessage("Emergency request approved successfully.");

      await loadDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError(
        "Please enter a reason for rejecting the emergency request."
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      await updateMaintenanceStatus(
        id,
        "Rejected",
        rejectReason.trim()
      );

      setMessage("Emergency request rejected.");

      setRejectReason("");
      setShowRejectBox(false);

      await loadDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  if (loading) {
    return <p>Loading maintenance request...</p>;
  }

  if (error && !request) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!request) {
    return <p>Maintenance request not found.</p>;
  }

  const isEmergency =
    request.requestType === "EMERGENCY";

  const decisionCompleted =
    request.status === "Approved" ||
    request.status === "Rejected";

  return (
    <div>
      <h1>
        {isEmergency
          ? `Emergency Request #${request.id}`
          : `Maintenance Request #${request.id}`}
      </h1>

      {message && (
        <p style={styles.successMessage}>
          {message}
        </p>
      )}

      {error && (
        <p style={styles.errorMessage}>
          {error}
        </p>
      )}

      <div style={styles.grid}>
        {/* REQUEST DETAILS */}
        <div style={styles.card}>
          <h2>Request Details</h2>

          <p>
            <strong>Description:</strong>{" "}
            {request.description}
          </p>

          <p>
            <strong>Type:</strong>{" "}
            {request.requestType}
          </p>

          {isEmergency && (
            <p>
              <strong>Emergency Type:</strong>{" "}
              {request.emergencyType || "-"}
            </p>
          )}

          {!isEmergency && (
            <p>
              <strong>Category:</strong>{" "}
              {request.categoryName || "Not analysed"}
            </p>
          )}

          <p>
            <strong>Priority:</strong>{" "}
            {request.priority ||
              (isEmergency
                ? "Critical"
                : "Pending analysis")}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={
                request.status === "Approved"
                  ? styles.approvedStatus
                  : request.status === "Rejected"
                    ? styles.rejectedStatus
                    : styles.pendingStatus
              }
            >
              {request.status}
            </span>
          </p>

          <p>
            <strong>Property:</strong>{" "}
            {request.propertyName ||
              `#${request.propertyId}`}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {request.propertyAddress || "-"}
          </p>

          <p>
            <strong>Unit:</strong>{" "}
            {request.unitName ||
              `#${request.unitId}`}
          </p>

          <p>
            <strong>Created:</strong>{" "}
            {formatDate(request.createdAt)}
          </p>
        </div>

        {/* PHOTOS */}
        <div style={styles.card}>
          <h2>Photos</h2>

          {request.imageUrls?.length > 0 ? (
            <div style={styles.images}>
              {request.imageUrls.map(
                (url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Maintenance ${index + 1}`}
                    style={styles.image}
                  />
                )
              )}
            </div>
          ) : (
            <p>No photo available.</p>
          )}
        </div>
      </div>

      {/* EMERGENCY APPROVE / REJECT */}
      {isEmergency && (
        <div style={styles.card}>
          <h2>Emergency Request Decision</h2>

          {!decisionCompleted ? (
            <>
              <p style={styles.helpText}>
                Review the emergency request and
                approve or reject it.
              </p>

              <div style={styles.actionButtons}>
                <button
                  type="button"
                  style={styles.approveButton}
                  onClick={handleApprove}
                  disabled={updating}
                >
                  {updating
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  type="button"
                  style={styles.rejectButton}
                  onClick={() => {
                    setShowRejectBox(true);
                    setError("");
                  }}
                  disabled={updating}
                >
                  Reject
                </button>
              </div>

              {showRejectBox && (
                <div style={styles.rejectBox}>
                  <label
                    style={styles.rejectLabel}
                  >
                    Reason for rejection
                  </label>

                  <textarea
                    value={rejectReason}
                    onChange={(e) =>
                      setRejectReason(
                        e.target.value
                      )
                    }
                    placeholder="Explain why this emergency request is being rejected..."
                    style={styles.textarea}
                  />

                  <div
                    style={styles.actionButtons}
                  >
                    <button
                      type="button"
                      style={styles.rejectButton}
                      onClick={handleReject}
                      disabled={updating}
                    >
                      {updating
                        ? "Processing..."
                        : "Confirm Rejection"}
                    </button>

                    <button
                      type="button"
                      style={styles.cancelButton}
                      onClick={() => {
                        setShowRejectBox(false);
                        setRejectReason("");
                        setError("");
                      }}
                      disabled={updating}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : request.status ===
            "Approved" ? (
            <div style={styles.approvedBox}>
              <strong>
                Emergency request approved.
              </strong>

              <p style={styles.resultText}>
                This decision is now recorded in
                the request history.
              </p>
            </div>
          ) : (
            <div style={styles.rejectedBox}>
              <strong>
                Emergency request rejected.
              </strong>

              <p style={styles.resultText}>
                The rejection reason is recorded
                in the request history.
              </p>
            </div>
          )}
        </div>
      )}

      {/* AGENT 1 PLANNING SECTION */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h2>AI Maintenance Planning (Agent 1 - Planner & Coordinator)</h2>
          {aiWorkflow && (
            <span style={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "6px" }}>
              Status: {aiWorkflow.status}
            </span>
          )}
        </div>

        {aiWorkflow ? (
          <div>
            <p style={styles.helpText}>
              Agent 1 has synthesized property & maintenance context for this request.
            </p>
            {aiWorkflow.plannerOutput && (
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 16px", marginTop: "8px" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}>
                  <strong>Assigned Trade:</strong> {aiWorkflow.plannerOutput.requiredTrade} | <strong>Urgency:</strong> {aiWorkflow.plannerOutput.urgency} | <strong>Est. Duration:</strong> {aiWorkflow.plannerOutput.estimatedDuration}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>
                  {aiWorkflow.plannerOutput.summary}
                </p>
              </div>
            )}
            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                style={{ backgroundColor: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                onClick={() => navigate(`/owner/ai-workflow/${aiWorkflow.id}`)}
              >
                View Full AI Planning Details →
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={styles.helpText}>
              No Agent 1 Planning workflow has been started for this maintenance request yet.
            </p>
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                style={{ backgroundColor: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                onClick={handleStartPlanner}
                disabled={startingPlanner}
              >
                {startingPlanner ? "Starting Agent 1 Planner..." : "⚡ Start Agent 1 Planner"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NORMAL MAINTENANCE */}
      {!isEmergency && (
        <div style={styles.card}>
          <h2>Maintenance Request Decision</h2>

          <p style={styles.helpText}>
            This request is waiting for the AI
            workflow and final worker
            recommendation.
          </p>

          <p style={styles.helpText}>
            Approve and Reject actions will be
            available after the AI summary,
            recommended worker and appointment
            time are ready.
          </p>
        </div>
      )}

      {/* STATUS HISTORY */}
      <div style={styles.card}>
        <h2>Status History</h2>

        {history.length === 0 ? (
          <p>No status history available.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    From
                  </th>

                  <th style={styles.th}>
                    To
                  </th>

                  <th style={styles.th}>
                    Note
                  </th>

                  <th style={styles.th}>
                    Changed
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      {item.oldStatus || "-"}
                    </td>

                    <td style={styles.td}>
                      {item.newStatus}
                    </td>

                    <td style={styles.td}>
                      {item.note || "-"}
                    </td>

                    <td style={styles.td}>
                      {formatDate(
                        item.changedAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
  },

  images: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  image: {
    width: "220px",
    maxHeight: "180px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  helpText: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  actionButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "15px",
    flexWrap: "wrap",
  },

  approveButton: {
    padding: "10px 22px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#15803d",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  rejectButton: {
    padding: "10px 22px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#b91c1c",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  cancelButton: {
    padding: "10px 22px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#374151",
    cursor: "pointer",
  },

  rejectBox: {
    marginTop: "22px",
    maxWidth: "650px",
  },

  rejectLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    resize: "vertical",
    boxSizing: "border-box",
  },

  approvedBox: {
    padding: "16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
  },

  rejectedBox: {
    padding: "16px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
  },

  resultText: {
    marginBottom: 0,
  },

  approvedStatus: {
    color: "#15803d",
    fontWeight: "700",
  },

  rejectedStatus: {
    color: "#b91c1c",
    fontWeight: "700",
  },

  pendingStatus: {
    color: "#92400e",
    fontWeight: "600",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  successMessage: {
    padding: "12px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "7px",
    marginBottom: "20px",
  },

  errorMessage: {
    padding: "12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "7px",
    marginBottom: "20px",
  },
};

export default MaintenanceRequestDetailsPage;
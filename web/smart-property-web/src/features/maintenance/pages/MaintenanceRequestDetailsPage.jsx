import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMaintenanceRequestById,
  getMaintenanceHistory,
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


  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  function formatOnlyDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString();
  }

  function formatSchedule(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";

    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();

    if (hours !== 0 || minutes !== 0) {
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      return `${dateStr}, ${hh}:${mm}`;
    }
    return dateStr;
  }

  if (loading) {
    return <p style={styles.loading}>Loading maintenance request...</p>;
  }

  if (error && !request) {
    return <p style={styles.errorMessage}>{error}</p>;
  }

  if (!request) {
    return <p style={styles.loading}>Maintenance request not found.</p>;
  }

  const isEmergency =
    request.requestType === "EMERGENCY";

  return (
    <div style={{ ...styles.page, "--role-accent": sessionStorage.getItem("role") === "PropertyOwner" ? "#0f766e" : "#5145cd" }}>
      <h1 style={{ ...styles.pageTitle, color: isEmergency ? "#b91c1c" : "var(--role-accent, #5145cd)" }}>
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

        {/* TENANT DETAILS */}
        <div style={styles.card}>
          <h2>Tenant Information</h2>

          <p>
            <strong>Tenant Name:</strong>{" "}
            {request.tenantName || "-"}
          </p>

          <p>
            <strong>Tenant Email:</strong>{" "}
            {request.tenantEmail || "-"}
          </p>

          <p>
            <strong>Tenant Mobile:</strong>{" "}
            {request.tenantMobile || "-"}
          </p>
        </div>

        {/* TECHNICIAN ASSIGNMENT */}
        {(request.assignedWorkerName || request.workOrderId) && (
          <div style={styles.card}>
            <h2>Technician Assignment</h2>

            {request.assignedWorkerName && (
              <p>
                <strong>Assigned Worker:</strong>{" "}
                {request.assignedWorkerName}
              </p>
            )}

            {request.assignedWorkerEmail && (
              <p>
                <strong>Worker Email:</strong>{" "}
                {request.assignedWorkerEmail}
              </p>
            )}

            {request.assignedWorkerMobile && (
              <p>
                <strong>Worker Mobile:</strong>{" "}
                {request.assignedWorkerMobile}
              </p>
            )}

            <p>
              <strong>Assignment Status:</strong>{" "}
              {request.workOrderStatus || request.status}
            </p>

            {request.scheduledDate && (
              <p>
                <strong>Scheduled Visit Date:</strong>{" "}
                {formatSchedule(request.scheduledDate)}
              </p>
            )}
          </div>
        )}
      </div>

     

             
                 
                  
               

              
                  
                
                      
                    
          

              
      

      {/* AGENT 1 PLANNING SECTION */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h2>AI Maintenance Planning (Agent 1 - Planner & Coordinator)</h2>
          {aiWorkflow && (
            <span style={{ backgroundColor: "color-mix(in srgb, var(--role-accent, #5145cd) 10%, white)", color: "var(--role-accent, #5145cd)", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px" }}>
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
                style={{ backgroundColor: "var(--role-accent, #5145cd)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
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
                style={{ backgroundColor: "var(--role-accent, #5145cd)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
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
                    <td style={styles.td}>{item.oldStatus || "-"}</td>
                    <td style={styles.td}>{item.newStatus}</td>
                    <td style={styles.td}>{item.note || "-"}</td>
                    <td style={styles.td}>{formatDate(item.changedAt)}</td>
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
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  pageTitle: { margin: "0 0 20px", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  loading: { color: "#64748b", padding: "12px 0" },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "1px solid #e2e7e9",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
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
    color: "#64748b",
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
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
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
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
    boxSizing: "border-box",
  },

  approvedBox: {
    padding: "16px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "8px",
  },

  rejectedBox: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
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
    padding: "13px 14px",
    borderBottom: "1px solid #e2e7e9",
    backgroundColor: "#f3f5f6",
    color: "#526176",
    fontSize: 12,
    fontWeight: 700,
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f3",
    color: "#334155",
    fontSize: 13,
  },

  successMessage: {
    padding: "12px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  errorMessage: {
    padding: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default MaintenanceRequestDetailsPage;
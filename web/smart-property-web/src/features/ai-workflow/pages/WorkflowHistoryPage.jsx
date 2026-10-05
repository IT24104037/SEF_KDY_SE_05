import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkflowByRequestId, getWorkflowById } from "../services/aiWorkflowService";

export default function WorkflowHistoryPage() {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");
  const [searchType, setSearchType] = useState("request"); // 'request' or 'workflow'
  const [resultWorkflow, setResultWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchId.trim() || isNaN(Number(searchId))) {
      setError("Please enter a valid positive numeric ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResultWorkflow(null);
    setSearched(true);

    try {
      let data = null;
      if (searchType === "request") {
        data = await getWorkflowByRequestId(Number(searchId));
      } else {
        data = await getWorkflowById(Number(searchId));
      }
      setResultWorkflow(data);
    } catch (err) {
      setError(err.message || "No AI workflow found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...styles.page, "--role-accent": sessionStorage.getItem("role") === "PropertyOwner" ? "#0f766e" : "#5145cd" }}>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Workflow Search & Inspection</h1>
        <p style={styles.subtitle}>
          Lookup Agentic AI workflows by Maintenance Request ID or Workflow ID.
        </p>
      </div>

      <div style={styles.searchCard}>
        <form onSubmit={handleSearch} style={styles.form}>
          <div style={styles.inputGroup}>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={styles.select}
            >
              <option value="request">Maintenance Request ID</option>
              <option value="workflow">Workflow ID</option>
            </select>
            <input
              type="number"
              min="1"
              placeholder={`Enter ${searchType === "request" ? "Request" : "Workflow"} ID...`}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.buttonPrimary}>
              {loading ? "Searching..." : "Lookup Workflow"}
            </button>
          </div>
        </form>

        {error && <div style={styles.errorBox}>{error}</div>}
      </div>

      {resultWorkflow && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>
                Workflow #{resultWorkflow.id}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                Request #{resultWorkflow.maintenanceRequestId} — Step: {resultWorkflow.currentStep}
              </p>
            </div>
            <span style={styles.statusPill}>{resultWorkflow.status}</span>
          </div>

          {resultWorkflow.plannerOutput && (
            <div style={styles.plannerBox}>
              <p style={{ margin: "0 0 6px 0", fontSize: "13px" }}>
                <strong>Urgency:</strong> {resultWorkflow.plannerOutput.urgency} |{" "}
                <strong>Required Trade:</strong> {resultWorkflow.plannerOutput.requiredTrade}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>
                {resultWorkflow.plannerOutput.summary}
              </p>
            </div>
          )}

          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button
              style={styles.buttonPrimary}

              onClick={() => {
  const role = sessionStorage.getItem("role");

      const basePath =
        role === "Admin"
          ? "/admin/ai-workflow"
          : "/owner/ai-workflow";

      navigate(`${basePath}/${resultWorkflow.id}`);
    }}
                          
            > 
              View Full Planning Details →
            </button>
          </div>
        </div>
      )}

      {searched && !loading && !resultWorkflow && !error && (
        <div style={styles.emptyBox}>
          No active or completed AI workflow exists for this query ID.
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "clamp(18px, 3vw, 30px)",
    maxWidth: "1040px",
    margin: "0 auto",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1f2933",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
    color: "#172033",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  searchCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "clamp(18px, 3vw, 24px)",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    color: "#1f2933",
    fontFamily: "inherit",
  },
  input: {
    flexGrow: 1,
    minWidth: "200px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#1f2933",
    fontFamily: "inherit",
  },
  buttonPrimary: {
    backgroundColor: "var(--role-accent, #5145cd)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    marginTop: "12px",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "clamp(18px, 3vw, 24px)",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  statusPill: {
    backgroundColor: "color-mix(in srgb, var(--role-accent, #5145cd) 10%, white)",
    color: "var(--role-accent, #5145cd)",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  plannerBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "6px",
    padding: "12px",
  },
  emptyBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e2e7e9",
    padding: "24px",
    borderRadius: "8px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
};

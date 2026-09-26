import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAiWorkflowState } from "../store/aiWorkflowStore";
import WorkflowTimeline from "../components/WorkflowTimeline";

function getUrgencyBadgeStyle(urgency) {
  switch (urgency) {
    case "Emergency":
      return { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
    case "High":
      return { backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5" };
    case "Medium":
      return { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #dcfce7" };
    default:
      return { backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" };
  }
}

export default function WorkflowDetailsPage() {
  const { workflowId } = useParams();
  const [searchParams] = useSearchParams();
  const requestIdParam = searchParams.get("requestId");
  const navigate = useNavigate();

  const {
    workflow,
    logs,
    loading,
    error,
    loadWorkflowById,
    loadWorkflowByRequestId,
    loadLogs,
  } = useAiWorkflowState();

  useEffect(() => {
    async function fetchData() {
      let activeWorkflow = null;
      if (workflowId) {
        activeWorkflow = await loadWorkflowById(workflowId);
      } else if (requestIdParam) {
        activeWorkflow = await loadWorkflowByRequestId(requestIdParam);
      }

      if (activeWorkflow && activeWorkflow.id) {
        await loadLogs(activeWorkflow.id);
      }
    }

    fetchData();
  }, [workflowId, requestIdParam, loadWorkflowById, loadWorkflowByRequestId, loadLogs]);

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "12px", color: "#4b5563" }}>Loading AI Workflow details...</p>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <h2 style={{ margin: "0 0 8px 0" }}>Error Loading Workflow</h2>
          <p style={{ margin: "0 0 16px 0" }}>{error}</p>
          <button style={styles.buttonSecondary} onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyBox}>
          <h2>No AI Workflow Found</h2>
          <p>
            No active or historical AI maintenance workflow was found for this reference.
          </p>
          <button style={styles.buttonSecondary} onClick={() => navigate("/owner/maintenance")}>
            ← Back to Maintenance Requests
          </button>
        </div>
      </div>
    );
  }

  const planner = workflow.plannerOutput;
  const urgencyStyle = planner ? getUrgencyBadgeStyle(planner.urgency) : {};

  return (
    <div style={styles.page}>
      {/* HEADER NAV */}
      <div style={styles.topNav}>
        <button style={styles.buttonSecondary} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={styles.tagGroup}>
          <span style={styles.headerTag}>Agentic AI Workflow #{workflow.id}</span>
          <span style={styles.requestTag}>
            Maintenance Request #{workflow.maintenanceRequestId}
          </span>
        </div>
      </div>

      {/* WORKFLOW STATUS CARD */}
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <div>
            <h1 style={styles.pageTitle}>Maintenance Planning & Coordination</h1>
            <p style={styles.statusSub}>
              Current Step: <strong>{workflow.currentStep || "Agent 1 Complete"}</strong>
            </p>
          </div>
          <div style={styles.statusBadgeGroup}>
            <span style={styles.statusPill}>{workflow.status}</span>
          </div>
        </div>
        <div style={styles.metaRow}>
          <span><strong>Created:</strong> {new Date(workflow.createdAt).toLocaleString()}</span>
          <span><strong>Last Updated:</strong> {new Date(workflow.updatedAt).toLocaleString()}</span>
        </div>

        {workflow.maintenanceRequestId && (
          <div style={styles.approvalActionBanner}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "22px" }}>🛡️</span>
              <div>
                <strong style={{ color: "#111827", fontSize: "14px" }}>
                  AI Recommendation &amp; Safety Audit Ready
                </strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#4b5563" }}>
                  All 4 AI agents completed their analysis. Proceed to the Human-in-the-Loop gate to review and dispatch.
                </p>
              </div>
            </div>
            <button
              style={styles.buttonPrimary}
              onClick={() => navigate(`/owner/approval?requestId=${workflow.maintenanceRequestId}`)}
            >
              Review &amp; Approve Recommendation →
            </button>
          </div>
        )}
      </div>

      {/* AGENT 1 PLANNER OUTPUT SECTION */}
      {planner ? (
        <div style={styles.plannerCard}>
          <div style={styles.plannerHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={styles.sectionTitle}>Agent 1 — Planner Output</h2>
              <span style={styles.agentTag}>PlannerCoordinatorAgent</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ ...styles.badgePill, ...urgencyStyle }}>
                Urgency: {planner.urgency || "Normal"}
              </span>
              <span style={styles.tradePill}>
                Trade: {planner.requiredTrade || "General"}
              </span>
              <span style={styles.durationPill}>
                Est: {planner.estimatedDuration || "N/A"}
              </span>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <strong style={styles.label}>Planner Executive Summary</strong>
              <p style={styles.valueText}>{planner.summary}</p>
            </div>
            {planner.relevantContextSummary && (
              <div style={styles.summaryItem}>
                <strong style={styles.label}>Property & Maintenance Context</strong>
                <p style={styles.valueText}>{planner.relevantContextSummary}</p>
              </div>
            )}
          </div>

          {/* RESOLUTION STEPS */}
          {planner.resolutionSteps && planner.resolutionSteps.length > 0 && (
            <div style={styles.resolutionSection}>
              <h3 style={styles.subTitle}>Recommended Resolution Plan</h3>
              <div style={styles.stepsGrid}>
                {planner.resolutionSteps.map((step) => (
                  <div key={step.stepNumber} style={styles.resolutionStepCard}>
                    <div style={styles.resolutionStepHeader}>
                      <span style={styles.stepNumBadge}>Step {step.stepNumber}</span>
                      <h4 style={styles.resolutionTitle}>{step.title}</h4>
                    </div>
                    <p style={styles.resolutionDesc}>{step.description}</p>
                    {step.recommendedAction && (
                      <div style={styles.actionBox}>
                        <strong>Recommended Action:</strong> {step.recommendedAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.plannerCard}>
          <h2 style={styles.sectionTitle}>Agent 1 — Planner Output</h2>
          <p style={{ color: "#6b7280" }}>
            Planning analysis is currently being synthesized by Agent 1...
          </p>
        </div>
      )}

      {/* WORKFLOW TIMELINE */}
      <WorkflowTimeline steps={workflow.steps} />

      {/* AGENT EXECUTION LOGS */}
      {logs && logs.length > 0 && (
        <div style={styles.logsCard}>
          <h3 style={styles.sectionTitle}>Execution Observability Logs</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Summary</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.td}>
                      <strong>{log.agentName}</strong>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: log.status === "Completed" ? "#d1fae5" : "#fee2e2",
                          color: log.status === "Completed" ? "#065f46" : "#991b1b",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={styles.td}>{log.summary}</td>
                    <td style={styles.td}>{log.durationMs ? `${log.durationMs} ms` : "-"}</td>
                    <td style={styles.td}>{new Date(log.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  centerContainer: {
    padding: "60px",
    textAlign: "center",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  tagGroup: {
    display: "flex",
    gap: "10px",
  },
  headerTag: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  requestTag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  statusCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "20px 24px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  statusSub: {
    fontSize: "14px",
    color: "#4b5563",
    margin: 0,
  },
  statusBadgeGroup: {
    display: "flex",
    alignItems: "center",
  },
  statusPill: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  metaRow: {
    display: "flex",
    gap: "24px",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #f3f4f6",
    fontSize: "13px",
    color: "#6b7280",
  },
  plannerCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  plannerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  agentTag: {
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  badgePill: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  tradePill: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  durationPill: {
    backgroundColor: "#f3e8ff",
    color: "#6b21a8",
    border: "1px solid #e9d5ff",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryItem: {
    backgroundColor: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "8px",
    padding: "16px",
  },
  label: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "6px",
  },
  valueText: {
    fontSize: "14px",
    color: "#1f2937",
    margin: 0,
    lineHeight: "1.5",
  },
  resolutionSection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #f3f4f6",
  },
  subTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "14px",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },
  resolutionStepCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  resolutionStepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  stepNumBadge: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  resolutionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  resolutionDesc: {
    fontSize: "13px",
    color: "#4b5563",
    margin: "0 0 10px 0",
    lineHeight: "1.4",
  },
  actionBox: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    fontSize: "12px",
    padding: "8px 10px",
    borderRadius: "6px",
  },
  logsCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "24px",
    marginTop: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    marginTop: "12px",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: "600",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#1f2937",
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    cursor: "pointer",
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "9px 18px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "background-color 0.15s ease",
    whiteSpace: "nowrap",
  },
  approvalActionBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "14px 18px",
    marginTop: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "24px",
    borderRadius: "8px",
    textAlign: "center",
  },
  emptyBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "32px",
    borderRadius: "8px",
    textAlign: "center",
  },
};

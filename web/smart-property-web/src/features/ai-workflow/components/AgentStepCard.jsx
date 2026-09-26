import React from "react";

function getStatusBadgeStyle(status) {
  switch (status) {
    case "Completed":
      return { backgroundColor: "#e6f4ea", color: "#137333", border: "1px solid #ceead6" };
    case "Running":
      return { backgroundColor: "#e8f0fe", color: "#1a73e8", border: "1px solid #d2e3fc" };
    case "Failed":
      return { backgroundColor: "#fce8e6", color: "#c5221f", border: "1px solid #fad2cf" };
    case "Skipped":
      return { backgroundColor: "#f1f3f4", color: "#5f6368", border: "1px solid #dadce0" };
    default:
      return { backgroundColor: "#f8f9fa", color: "#3c4043", border: "1px solid #e8eaed" };
  }
}

export default function AgentStepCard({ step }) {
  if (!step) return null;

  const isAgent1 = step.agentName === "PlannerCoordinatorAgent" || step.stepName === "Planner & Coordinator";
  const badgeStyle = getStatusBadgeStyle(step.status);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.stepBadge}>Step #{step.stepOrder || 1}</span>
          <h3 style={styles.stepTitle}>{step.stepName}</h3>
          {isAgent1 && (
            <span style={styles.agent1Tag}>
              Agent 1 — Property Maintenance Planner & Coordinator
            </span>
          )}
        </div>
        <span style={{ ...styles.statusBadge, ...badgeStyle }}>
          {step.status}
        </span>
      </div>

      <div style={styles.detailsGrid}>
        <p style={styles.detailItem}>
          <strong>Agent:</strong> {step.agentName}
        </p>
        {step.startedAt && (
          <p style={styles.detailItem}>
            <strong>Started:</strong> {new Date(step.startedAt).toLocaleString()}
          </p>
        )}
        {step.completedAt && (
          <p style={styles.detailItem}>
            <strong>Completed:</strong> {new Date(step.completedAt).toLocaleString()}
          </p>
        )}
      </div>

      {step.inputSummary && (
        <div style={styles.section}>
          <strong style={styles.sectionTitle}>Input Reference:</strong>
          <div style={styles.summaryBox}>{step.inputSummary}</div>
        </div>
      )}

      {step.outputSummary && (
        <div style={styles.section}>
          <strong style={{ ...styles.sectionTitle, color: "#15803d" }}>Agent Execution Output:</strong>
          <div style={styles.outputBox}>{step.outputSummary}</div>
        </div>
      )}

      {step.errorSummary && (
        <div style={styles.errorBox}>
          <strong>Error Summary:</strong> {step.errorSummary}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  stepBadge: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  agent1Tag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid #bfdbfe",
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  detailsGrid: {
    display: "flex",
    gap: "20px",
    fontSize: "13px",
    color: "#4b5563",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  detailItem: {
    margin: 0,
  },
  section: {
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "12px",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  summaryBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#1f2937",
    marginTop: "4px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  outputBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #dcfce7",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#14532d",
    marginTop: "4px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: "1.4",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    marginTop: "10px",
  },
};

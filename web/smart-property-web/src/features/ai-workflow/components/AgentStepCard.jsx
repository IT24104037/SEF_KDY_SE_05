import React from "react";

function getStatusBadgeStyle(status) {
  switch (status) {
    case "Completed":
      return { backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
    case "Running":
      return { backgroundColor: "color-mix(in srgb, var(--role-accent, #5145cd) 10%, white)", color: "var(--role-accent, #5145cd)", border: "1px solid color-mix(in srgb, var(--role-accent, #5145cd) 24%, white)" };
    case "Failed":
      return { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
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
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "16px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
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
    backgroundColor: "var(--role-accent, #5145cd)",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  agent1Tag: {
    backgroundColor: "color-mix(in srgb, var(--role-accent, #5145cd) 8%, white)",
    color: "var(--role-accent, #5145cd)",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid color-mix(in srgb, var(--role-accent, #5145cd) 22%, white)",
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
    color: "#526176",
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
    color: "#526176",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  summaryBox: {
    backgroundColor: "#f5f7f8",
    border: "1px solid #e5eaf2",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#334155",
    marginTop: "4px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginTop: "10px",
  },
};

import React from "react";
import AgentStepCard from "./AgentStepCard";

export default function WorkflowTimeline({ steps = [] }) {
  if (!steps || steps.length === 0) {
    return (
      <div style={styles.emptyBox}>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          No workflow steps have been executed yet.
        </p>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Workflow Timeline & Execution Steps</h3>
      <div style={styles.timeline}>
        {sortedSteps.map((step, index) => (
          <div key={step.id || index} style={styles.timelineItem}>
            <div style={styles.lineMarker}>
              <div
                style={{
                  ...styles.dot,
                  backgroundColor:
                    step.status === "Completed"
                      ? "#10b981"
                      : step.status === "Running"
                      ? "#3b82f6"
                      : step.status === "Failed"
                      ? "#ef4444"
                      : "#9ca3af",
                }}
              />
              {index < sortedSteps.length - 1 && <div style={styles.line} />}
            </div>
            <div style={styles.content}>
              <AgentStepCard step={step} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: "24px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "16px",
  },
  emptyBox: {
    backgroundColor: "#f9fafb",
    border: "1px border-dashed #d1d5db",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    marginTop: "16px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
  },
  lineMarker: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "24px",
    paddingTop: "18px",
  },
  dot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "2px solid #ffffff",
    boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
    zIndex: 2,
  },
  line: {
    width: "2px",
    flexGrow: 1,
    backgroundColor: "#e5e7eb",
    marginTop: "4px",
  },
  content: {
    flexGrow: 1,
  },
};

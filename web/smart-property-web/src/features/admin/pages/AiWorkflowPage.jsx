import React from "react";
import WorkflowHistoryPage from "../../ai-workflow/pages/WorkflowHistoryPage";

function AiWorkflowPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          AI Workflow Monitoring
        </h1>
        <p style={styles.subtitle}>
          Monitor Agentic AI Planner executions and workflow logs across the platform.
        </p>
      </div>
      <WorkflowHistoryPage />
    </div>
  );
}

const styles = {
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { marginBottom: 18, padding: "0 clamp(18px, 3vw, 30px)" },
  title: { fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750, color: "#172033", margin: "0 0 6px" },
  subtitle: { color: "#64748b", margin: 0, fontSize: 14, lineHeight: 1.6 },
};

export default AiWorkflowPage;
import React from "react";
import WorkflowHistoryPage from "../../ai-workflow/pages/WorkflowHistoryPage";

function AiWorkflowPage() {
  return (
    <div>
      <div style={{ marginBottom: "16px", padding: "0 24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
          AI Workflow Monitoring
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
          Monitor Agentic AI Planner executions and workflow logs across the platform.
        </p>
      </div>
      <WorkflowHistoryPage />
    </div>
  );
}

export default AiWorkflowPage;
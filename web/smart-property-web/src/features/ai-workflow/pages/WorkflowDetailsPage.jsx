import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAiWorkflowState } from "../store/aiWorkflowStore";
import WorkflowTimeline from "../components/WorkflowTimeline";
import {
  getApprovalRequest,
  submitApprovalDecision,
  submitManualDecision,
} from "../../workers/services/workerService.js";

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


  const currentUserRole =
  sessionStorage.getItem("role");

const isAdmin =
  currentUserRole === "Admin";

const isPropertyOwner =
  currentUserRole === "PropertyOwner";



  const {
    workflow,
    logs,
    loading,
    error,
    loadWorkflowById,
    loadWorkflowByRequestId,
    loadLogs,
  } = useAiWorkflowState();

  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
const [manualSubmitting, setManualSubmitting] = useState(false);
const [manualError, setManualError] = useState("");
const [manualSuccess, setManualSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      let activeWorkflow = null;
      if (workflowId) {
        activeWorkflow = await loadWorkflowById(workflowId);
      } else if (requestIdParam) {
        activeWorkflow = await loadWorkflowByRequestId(requestIdParam);
      }
      const parallelTasks = [];

      if (activeWorkflow && activeWorkflow.id) {
        parallelTasks.push(
          loadLogs(activeWorkflow.id)
        );
      }

      if (
        (isPropertyOwner || isAdmin) &&
        activeWorkflow &&
        activeWorkflow.maintenanceRequestId &&
        activeWorkflow.approvalStatus !==
          "EmergencyServicesRequired"
      ) {
        setRecLoading(true);

        parallelTasks.push(
          getApprovalRequest(
            activeWorkflow.maintenanceRequestId
          )
            .then((rec) => {
              setRecommendation(rec);
            })
            .catch((err) => {
              console.warn(
                "Could not load recommendation for workflow:",
                err
              );
            })
            .finally(() => {
              setRecLoading(false);
            })
        );
      }

      if (parallelTasks.length > 0) {
        await Promise.all(parallelTasks);
      }
    }

    fetchData();
  }, [workflowId, requestIdParam, loadWorkflowById, loadWorkflowByRequestId, loadLogs, isPropertyOwner,isAdmin,]);

  async function handleDecision(decisionType) {
        if (!isPropertyOwner) {
      setRecError(
        "Only the Property Owner can make an approval decision."
      );
      return;
      }
    const reqId = workflow?.maintenanceRequestId;
    const workerId = recommendation?.recommendedWorkerId;

        if (!reqId) return;
        if (
      decisionType === "Approve" &&
      !workerId
    ) {
      setRecError(
        "Cannot approve because no suitable technician has been matched."
      );
      return;
    }

    if ((decisionType === "Reject" || decisionType === "Request Revision") && !decisionNote.trim()) {
      setRecError("Please provide a note or reason for rejection or revision request.");
      return;
    }

    setSubmittingDecision(true);
    setRecError("");
    setActionSuccess("");

    try {
      const proposedTime = recommendation?.proposedTime || fallbackProposedTime;
      const result = await submitApprovalDecision(
        reqId,
        decisionType,
        decisionNote,
        proposedTime,
        workerId
      );

      if (result.createdWorkOrder) {
        setActionSuccess(
          `Approved successfully! Official Work Order #${result.workOrderId || ""} has been created and assigned to ${candidateWorkerName}.`
        );
      } else {
        setActionSuccess(`${decisionType} recorded successfully.`);
      }

      // Refresh recommendation
      const updatedRec = await getApprovalRequest(reqId);
      setRecommendation(updatedRec);

      // Refresh workflow
      if (workflowId) {
        await loadWorkflowById(workflowId);
      } else if (requestIdParam) {
        await loadWorkflowByRequestId(requestIdParam);
      }
    } catch (err) {
      setRecError(err.message || "Failed to record approval decision.");
    } finally {
      setSubmittingDecision(false);
    }
  }
  async function handleManualDecision(decisionType) {
  if (!isPropertyOwner) {
    setManualError(
      "Only the Property Owner can make this decision."
    );
    return;
  }

  const reqId =
    workflow?.maintenanceRequestId;

  if (!reqId) {
    setManualError(
      "Maintenance request ID could not be found."
    );
    return;
  }

  if (!manualMessage.trim()) {
    setManualError(
      "Please enter a message to the tenant."
    );
    return;
  }

  try {
    setManualSubmitting(true);
    setManualError("");
    setManualSuccess("");

    const result =
      await submitManualDecision(
        reqId,
        decisionType,
        manualMessage.trim()
      );

    setManualSuccess(
      decisionType === "Approve"
        ? "Approved and message sent to the tenant."
        : "Rejected and message sent to the tenant."
    );

    setManualMessage("");

    // Refresh workflow so ManualApproved / ManualRejected
    // is immediately reflected in the UI.
    if (workflowId) {
      await loadWorkflowById(workflowId);
    } else if (requestIdParam) {
      await loadWorkflowByRequestId(
        requestIdParam
      );
    }

    return result;
  } catch (err) {
    setManualError(
      err?.message ||
        "Could not record the manual decision."
    );
  } finally {
    setManualSubmitting(false);
  }
}

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
      <div
        style={{
          ...styles.page,
          "--role-accent":
            currentUserRole === "PropertyOwner"
              ? "#0f766e"
              : currentUserRole === "Tenant"
                ? "#0369a1"
                : currentUserRole === "MaintenanceWorker"
                  ? "#b45309"
                  : "#5145cd",
        }}
      >
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
         <button
          style={styles.buttonSecondary}
          onClick={() => navigate(-1)}
        >
          ← Go Back
        </button>
        </div>
      </div>
    );
  }

  const planner = workflow.plannerOutput;
  const urgencyStyle = planner ? getUrgencyBadgeStyle(planner.urgency) : {};

  // Extract candidate technician details from Agent 3 step if recommendation is still loading/null
  const step3 = workflow.steps?.find((s) => s.stepOrder === 3 || s.stepName?.includes("Matching"));
  const step4 = workflow.steps?.find((s) => s.stepOrder === 4 || s.stepName?.includes("Safety"));

  let step3Output = null;
  if (step3?.outputSummary) {
    try {
      step3Output = JSON.parse(step3.outputSummary);
    } catch (e) {
      // Non-JSON summary
    }
  }

  let step4Output = null;
  if (step4?.outputSummary) {
    try {
      step4Output = JSON.parse(step4.outputSummary);
    } catch (e) {
      // Non-JSON summary
    }
  }

  const agent3Result =
  step3Output?.result ||
  step3Output?.Result ||
  null;

const hasAvailableWorker =
  recommendation?.hasAvailableWorker === true &&
  recommendation?.recommendedWorkerId != null;

const candidateWorkerId =
  hasAvailableWorker
    ? recommendation.recommendedWorkerId
    : null;

const candidateWorkerName =
  hasAvailableWorker
    ? recommendation.recommendedWorker
    : null;

const candidateSkill =
  hasAvailableWorker
    ? recommendation.workerSkill
    : null;

const candidateHourlyRate =
  hasAvailableWorker &&
  recommendation?.hourlyRate != null
    ? `$${recommendation.hourlyRate}/hr`
    : null;

const candidateArea =
  hasAvailableWorker
    ? recommendation?.serviceArea
    : null;

const candidatePhone =
  hasAvailableWorker
    ? recommendation?.workerMobile
    : null;

const candidateEmail =
  hasAvailableWorker
    ? recommendation?.workerEmail
    : null;

const candidateProposedTime =
  hasAvailableWorker
    ? recommendation?.proposedTime
    : null;

const candidateValidationStatus =
  recommendation?.validationStatus || null;

const candidateValidationSummary =
  recommendation?.validationSummary ||
  recommendation?.message ||
  null;

const validationPassed =
  hasAvailableWorker &&
  candidateValidationStatus
    ?.toLowerCase()
    .includes("pass");

const emergencyServicesRequired =
  workflow?.approvalStatus === "EmergencyServicesRequired" ||
  workflow?.currentStep === "Emergency Services Required";

const needsMoreInformation =
  !emergencyServicesRequired &&
  (
    workflow?.approvalStatus === "NeedsMoreInformation" ||
    workflow?.currentStep?.includes("More Information Required")
  );

const manualDecisionCompleted =
  workflow?.approvalStatus === "ManualApproved" ||
  workflow?.approvalStatus === "ManualRejected";

const genuineNoWorkerResults = [
  "NO_WORKER_WITH_REQUIRED_SKILL",
  "NO_WORKER_IN_LOCATION",
  "NO_AVAILABLE_WORKER",
  "NO_AVAILABLE_EMERGENCY_WORKER",
];

const noWorkerAvailable =
  !emergencyServicesRequired &&
  !needsMoreInformation &&
  !manualDecisionCompleted &&
  recommendation != null &&
  recommendation?.hasAvailableWorker === false &&
  genuineNoWorkerResults.includes(
    recommendation?.validationStatus
  );
  const showManualDecisionBox =
  isPropertyOwner &&
  !needsMoreInformation &&
  !manualDecisionCompleted &&
  (
    emergencyServicesRequired ||
    noWorkerAvailable
  );

const readyForApproval =
  !emergencyServicesRequired &&
  hasAvailableWorker &&
  validationPassed &&
  workflow?.approvalStatus === "PendingOwnerApproval";

  const isCandidateApproved =
    recommendation?.validationStatus?.includes("Approved") ||
    workflow.approvalStatus === "Approved" ||
    workflow.status === "Assigned" ||
    actionSuccess !== "";

  // The approval section should appear whenever Agent 4 has validated or workflow is ready for owner approval
 const showApprovalSection =
  hasAvailableWorker &&
  (
    readyForApproval ||
    isCandidateApproved
  );

  return (
    <div
      style={{
        ...styles.page,
        "--role-accent":
          currentUserRole === "PropertyOwner"
            ? "#0f766e"
            : currentUserRole === "Tenant"
              ? "#0369a1"
              : currentUserRole === "MaintenanceWorker"
                ? "#b45309"
                : "#4f46e5",
      }}
    >
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
      </div>



      {/* AI SUGGESTED TECHNICIAN & OWNER APPROVAL SECTION */}

      {emergencyServicesRequired && (
  <div
    style={{
      backgroundColor: "#fef2f2",
      border: "2px solid #dc2626",
      borderRadius: "10px",
      padding: "22px",
      marginBottom: "24px",
      color: "#991b1b",
    }}
  >
    <h2
      style={{
        margin: "0 0 10px 0",
        fontSize: "20px",
      }}
    >
      🚨 Emergency Services Required
    </h2>

    <p
      style={{
        margin: "0 0 8px 0",
        lineHeight: "1.6",
        fontWeight: "600",
      }}
    >
      A fire or immediate life-safety emergency was detected.
    </p>

    <p
      style={{
        margin: "0 0 8px 0",
        lineHeight: "1.6",
      }}
    >
      The tenant should move to a safe location immediately and
      contact 119 Emergency Services.
    </p>

    <p
      style={{
        margin: 0,
        lineHeight: "1.6",
      }}
    >
      No maintenance worker has been assigned or scheduled.
    </p>

    <p
      style={{
        marginTop: "12px",
        marginBottom: 0,
        fontSize: "13px",
        fontWeight: "700",
      }}
    >
      Result: EMERGENCY_SERVICES_REQUIRED
    </p>
  </div>
)}


    {needsMoreInformation && (
  <div style={styles.recommendationCard}>
    <div style={styles.noWorkerBox}>
      <h2
        style={{
          margin: "0 0 10px 0",
          fontSize: "18px",
        }}
      >
        More Information Required
      </h2>

      <p
        style={{
          margin: 0,
          color: "#92400e",
          lineHeight: "1.5",
        }}
      >
        Agent 2 could not confidently classify the maintenance issue.
        Please ask the tenant to provide clearer information about
        what is damaged, where the problem is located, and what is happening.
      </p>

      <p
        style={{
          marginTop: "10px",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        Result: NEEDS_MORE_INFORMATION
      </p>
    </div>
  </div>
)}


          {noWorkerAvailable && (
      <div style={styles.recommendationCard}>
        <div style={styles.noWorkerBox}>
          <h2
            style={{
              margin: "0 0 10px 0",
              fontSize: "18px",
            }}
          >
            No Suitable Worker Available
          </h2>

          <p
            style={{
              margin: 0,
              color: "#92400e",
              lineHeight: "1.5",
            }}
          >
            {recommendation?.message ||
              recommendation?.validationSummary ||
              "No worker with the required skill, location and availability is currently available."}
          </p>

          {candidateValidationStatus && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Result: {candidateValidationStatus}
            </p>
          )}
        </div>
      </div>
    )}
{showManualDecisionBox && (
  <div
    style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e2e7e9",
      borderTop: "3px solid var(--role-accent, #0f766e)",
      borderRadius: "12px",
      padding: "clamp(18px, 3vw, 24px)",
      boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
      marginBottom: "24px",
    }}
  >
    <h2
      style={{
        margin: "0 0 8px 0",
        fontSize: "20px",
        color: "var(--role-accent, #0f766e)",
      }}
    >
      Manual Message to Tenant
    </h2>

    <p
      style={{
        color: "#64748b",
        marginBottom: "16px",
        lineHeight: "1.5",
      }}
    >
      {emergencyServicesRequired
        ? "Emergency services are required immediately. You may also send the tenant a manual update about any external assistance you have arranged."
        : "No suitable platform worker is currently available. Write the complete update you want the tenant to receive."}
    </p>

    {manualError && (
      <div
        style={{
          backgroundColor: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fecaca",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      >
        ⚠️ {manualError}
      </div>
    )}

    <textarea
      value={manualMessage}
      onChange={(e) =>
        setManualMessage(e.target.value)
      }
      maxLength={1000}
      rows={6}
      placeholder="Example: I arranged an urgent external worker. He will arrive at your unit at 6:00 PM. Please be available."
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "14px",
        lineHeight: "1.5",
        resize: "vertical",
        marginBottom: "16px",
        fontFamily: "inherit",
        color: "#1f2933",
      }}
    />

    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        disabled={manualSubmitting}
        onClick={() =>
          handleManualDecision("Approve")
        }
        style={{
          backgroundColor: "#16a34a",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "11px 18px",
          fontWeight: "700",
          cursor: manualSubmitting
            ? "not-allowed"
            : "pointer",
        }}
      >
        {manualSubmitting
          ? "Sending..."
          : "✓ Approve & Send"}
      </button>

      <button
        type="button"
        disabled={manualSubmitting}
        onClick={() =>
          handleManualDecision("Reject")
        }
        style={{
          backgroundColor: "#dc2626",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "11px 18px",
          fontWeight: "700",
          cursor: manualSubmitting
            ? "not-allowed"
            : "pointer",
        }}
      >
        Reject
      </button>
    </div>
  </div>
)}

{manualSuccess && (
  <div
    style={{
      backgroundColor: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      borderRadius: "8px",
      padding: "14px",
      marginBottom: "24px",
      fontWeight: "600",
    }}
  >
    ✅ {manualSuccess}
  </div>
)}
    
      {showApprovalSection && (
        <div style={styles.recommendationCard}>
          <div style={styles.recommendationHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={styles.sectionTitle}>AI Suggested Technician &amp; Owner Approval</h2>
              <span style={styles.agentTag}>Step #3 Matching + Step #4 Safety Validation</span>
            </div>
            <div>
              <span
                style={{
                  ...styles.badgePill,
                          backgroundColor: isCandidateApproved
                            ? "#dcfce7"
                            : "color-mix(in srgb, var(--role-accent, #0f766e) 10%, white)",
                          color: isCandidateApproved
                            ? "#166534"
                            : "var(--role-accent, #0f766e)",
                }}
              >
                {isCandidateApproved ? "Approved & Dispatched" : "Ready for Owner Approval"}
              </span>
            </div>
          </div>

          {actionSuccess && (
            <div style={styles.successAlert}>
              ✅ {actionSuccess}
            </div>
          )}

          {recError && (
            <div style={styles.errorAlert}>
              ⚠️ {recError}
            </div>
          )}

          <div style={styles.recGrid}>
            {/* Candidate Technician Details */}
            <div style={styles.recInfoBox}>
              <div style={styles.recBoxHeader}>
                <span style={{ fontSize: "22px" }}>👷</span>
                <strong style={{ fontSize: "16px", color: "#111827" }}>
                  {candidateWorkerName}
                </strong>
                <span style={styles.skillBadge}>{candidateSkill}</span>
              </div>

              <div style={styles.metaList}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Rate:</span>
                  <span style={styles.metaValue}>{candidateHourlyRate}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Coverage Area:</span>
                  <span style={styles.metaValue}>{candidateArea}</span>
                </div>
                {candidatePhone && (
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Phone:</span>
                    <span style={styles.metaValue}>{candidatePhone}</span>
                  </div>
                )}
                {candidateEmail && (
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Email:</span>
                    <span style={styles.metaValue}>{candidateEmail}</span>
                  </div>
                )}
                {candidateProposedTime && (
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Proposed Window:</span>
                    <span style={styles.metaValue}>
                      {new Date(candidateProposedTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Agent 4 Safety & Compliance Audit */}
            <div style={styles.safetyBox}>
              <div style={styles.recBoxHeader}>
                <span style={{ fontSize: "22px" }}>🛡️</span>
                <strong style={{ fontSize: "16px", color: "#111827" }}>
                  Agent 4 Safety &amp; Compliance Audit
                </strong>
                <span
                  style={
                    validationPassed
                      ? styles.verifiedBadge
                      : styles.skillBadge
                  }
                >
                  {validationPassed
                    ? "Verified (Pass)"
                    : candidateValidationStatus ||
                      "Pending Validation"}
                </span>
              </div>

              <p style={styles.safetySummaryText}>
                {candidateValidationSummary}
              </p>

              {validationPassed && (
                  <ul style={styles.checklist}>
                    <li>
                      ✓ Identity & Platform Verification Active
                    </li>
                    <li>
                      ✓ Required Trade Skill Certified
                    </li>
                    <li>
                      ✓ Daily Workload Limit Compliant
                    </li>
                    <li>
                      ✓ Safety validation passed
                    </li>
                  </ul>
                )}
            </div>
          </div>

        {/* OWNER APPROVAL ACTION PANEL */}
      {isPropertyOwner && (
        <div style={styles.approvalSection}>
            {isCandidateApproved ? (
              <div style={styles.alreadyApprovedBox}>
                <div>
                  <strong style={{ color: "#166534", fontSize: "15px" }}>
                    ✅ Technician Approved &amp; Work Order Dispatched
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#15803d" }}>
                    Official Work Order is active and assigned to {candidateWorkerName}.
                  </p>
                </div>
                <button
                  style={styles.buttonPrimary}
                  onClick={() => navigate("/owner/work-orders")}
                >
                  View Assigned Work Orders →
                </button>
              </div>
            ) : (
              <div style={styles.approvalActionCard}>
                <h4 style={styles.approvalCardTitle}>
                  Property Owner Approval Decision
                </h4>
                <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 12px 0" }}>
                  Review the candidate technician recommended by Agent 3 and certified by Agent 4. Approving will create the official work order and dispatch the technician.
                </p>

                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Optional notes for work order, instructions, or reason for revision..."
                  rows={2}
                  style={styles.decisionTextarea}
                />

                <div style={styles.approvalBtnRow}>
                  <button
                    style={styles.approveBtn}
                    disabled={submittingDecision}
                    onClick={() => handleDecision("Approve")}
                  >
                    {submittingDecision ? "Approving & Dispatching..." : "✓ Approve & Create Work Order"}
                  </button>
                  <button
                    style={styles.reviseBtn}
                    disabled={submittingDecision}
                    onClick={() => handleDecision("Request Revision")}
                  >
                    Request Revision
                  </button>
                  <button
                    style={styles.rejectBtn}
                    disabled={submittingDecision}
                    onClick={() => handleDecision("Reject")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
      )}
        </div>
      )}

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
    padding: "clamp(16px, 3vw, 32px)",
    maxWidth: "1240px",
    margin: "0 auto",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#172033",
  },
  centerContainer: {
    padding: "72px 24px",
    textAlign: "center",
    color: "#475569",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid var(--role-accent, #4f46e5)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
    flexWrap: "wrap",
    gap: "14px",
  },
  tagGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  headerTag: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "650",
    padding: "6px 11px",
    borderRadius: "999px",
    letterSpacing: "0.01em",
  },
  requestTag: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "650",
    padding: "6px 11px",
    borderRadius: "999px",
  },
  statusCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "clamp(20px, 3vw, 30px)",
    marginBottom: "24px",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageTitle: {
    fontSize: "clamp(22px, 3vw, 29px)",
    fontWeight: "750",
    color: "#172033",
    letterSpacing: "-0.035em",
    margin: "0 0 7px 0",
  },
  statusSub: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  statusBadgeGroup: {
    display: "flex",
    alignItems: "center",
  },
  statusPill: {
    backgroundColor: "var(--role-accent, #4f46e5)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    padding: "7px 13px",
    borderRadius: "20px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
  },
  metaRow: {
    display: "flex",
    gap: "12px 28px",
    marginTop: "22px",
    paddingTop: "16px",
    borderTop: "1px solid #e9eef5",
    fontSize: "13px",
    color: "#64748b",
    flexWrap: "wrap",
  },
  recommendationCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3e9f2",
    borderRadius: "18px",
    padding: "clamp(18px, 3vw, 28px)",
    marginBottom: "24px",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.055)",
  },
  recommendationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  agentTag: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: "11px",
    fontWeight: "700",
    padding: "5px 9px",
    borderRadius: "999px",
  },
  badgePill: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  successAlert: {
    backgroundColor: "#dcfce7",
    border: "1px solid #86efac",
    color: "#15803d",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "18px",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "18px",
  },
  recGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  recInfoBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5eaf2",
    borderRadius: "14px",
    padding: "20px",
  },
  safetyBox: {
    backgroundColor: "#f2fbf6",
    border: "1px solid #d4edde",
    borderRadius: "14px",
    padding: "20px",
  },
  recBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: "11px",
    fontWeight: "700",
    padding: "5px 9px",
    borderRadius: "999px",
  },
  verifiedBadge: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontSize: "11px",
    fontWeight: "700",
    padding: "5px 9px",
    borderRadius: "999px",
    border: "1px solid #b8e5ca",
  },
  metaList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
  },
  metaItem: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #e8edf4",
    paddingBottom: "9px",
  },
  metaLabel: {
    color: "#64748b",
    fontWeight: "500",
  },
  metaValue: {
    color: "#1e293b",
    fontWeight: "600",
  },
  safetySummaryText: {
    fontSize: "13px",
    color: "#276749",
    lineHeight: "1.5",
    marginBottom: "12px",
  },
  checklist: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "12px",
    color: "#28734d",
    fontWeight: "600",
  },
  approvalSection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  alreadyApprovedBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "14px",
    padding: "18px 20px",
    flexWrap: "wrap",
    gap: "14px",
  },
  approvalActionCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e3e9f2",
    borderRadius: "14px",
    padding: "22px",
  },
  approvalCardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#172033",
    margin: "0 0 6px 0",
  },
  decisionTextarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "14px",
    fontFamily: "inherit",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#172033",
  },
  approvalBtnRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  approveBtn: {
    backgroundColor: "#15803d",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 18px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.12)",
  },
  reviseBtn: {
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  rejectBtn: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  plannerCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3e9f2",
    borderRadius: "18px",
    padding: "clamp(18px, 3vw, 28px)",
    marginBottom: "24px",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.055)",
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
    color: "#172033",
    margin: 0,
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
    border: "1px solid #e3e9f2",
    borderRadius: "12px",
    padding: "18px",
  },
  resolutionStepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  stepNumBadge: {
    backgroundColor: "var(--role-accent, #4f46e5)",
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
    border: "1px solid #e3e9f2",
    borderRadius: "18px",
    padding: "clamp(18px, 3vw, 28px)",
    marginTop: "24px",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.055)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    marginTop: "12px",
    minWidth: "720px",
  },
  th: {
    textAlign: "left",
    padding: "13px 14px",
    borderBottom: "1px solid #dbe3ee",
    color: "#526176",
    fontWeight: "600",
    backgroundColor: "#f8fafc",
  },
  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f6",
    color: "#334155",
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    border: "1px solid #d8e0eb",
    borderRadius: "10px",
    padding: "9px 15px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
    cursor: "pointer",
  },
  buttonPrimary: {
    backgroundColor: "var(--role-accent, #4f46e5)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 17px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "background-color 0.15s ease",
    whiteSpace: "nowrap",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "28px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(127, 29, 29, 0.06)",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3e9f2",
    padding: "36px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.055)",
  },

  noWorkerBox: {
  backgroundColor: "#fffbeb",
  border: "1px solid #f2d28b",
  borderRadius: "14px",
  padding: "22px",
  color: "#854d0e",
},
};

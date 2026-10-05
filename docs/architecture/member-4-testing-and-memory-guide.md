# Member 4: Agent 4 (Validation & Safety Agent) Architecture & Memory Specification

**Author**: Member 4 (Yasith Dissanayake / IT24103931)  
**Component**: Agent 4 — Validation & Safety Agent  
**Role**: Deterministic compliance audit, pre-approval risk mitigation, and safety verification  
**Pipeline Location**: Step 4 (Downstream of Agent 3 Technician Matching, Upstream of Step 5 Property Owner Approval & Work Order Execution)

---

## 1. Executive Summary & Objective

In the SmartProperty Agentic AI pipeline, Agent 4 functions as an autonomous, deterministic compliance and safety auditor. While upstream agents propose maintenance interpretations (Agent 2) and select the most appropriate technician (Agent 3), **Agent 4 enforces hard platform guardrails, legal compliance, geospatial feasibility, worker availability, and pricing reasonableness** before any recommendation reaches the Property Owner for approval or work order creation.

Agent 4 guarantees that:
1. No unverified, inactive, or suspended technician can ever be assigned to a property.
2. Cross-trade assignments without appropriate verified skills or licenses are strictly prevented.
3. Technicians are never double-booked, and emergency dispatches are never assigned to burdened workers.
4. Geospatial boundaries (city boundaries and Haversine service radii) are respected.
5. Labor rates adhere to platform benchmarking bands to protect owners from gouging.

---

## 2. Memory Architecture (`Agent4Memory.cs`)

Agent 4 implements a dual-tier working memory model:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT 4 MEMORY SYSTEM                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Working Memory (Context)                                            │
│    ├── WorkflowId, MaintenanceRequestId, PropertyId, UnitId            │
│    └── TenantId, PropertyOwnerId, Timestamps                           │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Ingested Upstream Memory                                            │
│    ├── Agent 2 Analysis: Category, RequiredSkill, Priority, Safety     │
│    └── Agent 3 Match: WorkerId, WorkerName, SuggestedDateTime          │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Cognitive Scratchpad (6 Deterministic Pillars)                       │
│    ├── Pillar 1: VerificationCheckMemory (Credentials & Status)        │
│    ├── Pillar 2: SkillMatchCheckMemory (Category & Experience)         │
│    ├── Pillar 3: GeoCoverageCheckMemory (Haversine & City Radius)      │
│    ├── Pillar 4: ScheduleConflictCheckMemory (Overlap & Windows)       │
│    ├── Pillar 5: SafetyComplianceCheckMemory (Emergency Protocols)     │
│    └── Pillar 6: RateReasonablenessCheckMemory (Benchmark Bands)       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Episodic / Historical Memory (Long-term Context)                    │
│    ├── Worker Historical Profile: Reliability %, Completion Count      │
│    └── Request Context: Past repeat failures at same Unit              │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Decision State                                                      │
│    ├── Status: Pass | Fail | RevisionRequired                          │
│    ├── RiskScore: 0.0 - 100.0 (Weighted Composite)                     │
│    ├── Violations: Hard blocking failures                              │
│    ├── Warnings: Soft advisories                                       │
│    └── RecommendationsForOwner: Actionable guidance                    │
└────────────────────────────────────────────────────────────────────────┘
```

The entire memory state is serialized as JSON and persisted in `ValidationResult.DetailsJson` in PostgreSQL.

---

## 3. Connection with Agent 3 (`TechnicianMatchingAgent`)

Agent 4 seamlessly connects downstream of Agent 3:

1. **Pipeline Invocation**:
   In `Agent3WorkflowService.ExecuteAsync`, upon completing the matching algorithm and saving `AgentExecutionLog`, the workflow service automatically transitions to Agent 4:
   ```csharp
   await TryRunAgent4Async(workflow.Id, analysisOutput, result, cancellationToken);
   ```
2. **Context Passing**:
   Agent 4 receives:
   - `Agent3Result`: Contains the matched `WorkerId`, `SuggestedDateTime`, and `IsEmergency` flag.
   - `AnalysisOutput`: Contains the problem category, required trade skill, priority, and safety concern.
   - `MaintenanceRequestId`: Allows Agent 4 to inspect the property coordinates, unit details, and active work orders.
3. **Workflow Routing**:
   Based on Agent 4's validation verdict:
   - **`Pass`**: Workflow status advances to `Completed`, with approval status `PendingOwnerApproval`.
   - **`RevisionRequired`**: Workflow status remains `Running`, triggering technician re-matching or alternate scheduling.
   - **`Fail`**: Workflow status transitions to `Failed`, with approval status `ExternalMaintenanceRequired`.

---

## 4. The 6 Deterministic Validation Pillars

| Pillar | Name | Evaluated Criteria | Failure Behavior |
|---|---|---|---|
| **1** | **Credentials & Verification** | Worker exists, account active (`User.IsActive`), and status is `Verified`. | **BLOCKING VIOLATION (Fail)** |
| **2** | **Skill & Trade Verification** | Worker possesses the category skill or trade certification. Checks years of experience. | **BLOCKING VIOLATION (Fail)** |
| **3** | **Geospatial & Service Area** | Haversine distance from worker hub to property is within allowed radius, or property city matches service area. | **Soft Advisory / Warning** |
| **4** | **Schedule Availability & Overlap** | Worker availability schedule covers proposed slot; no conflicting active work orders within 2 hours. | **REVISION REQUIRED** |
| **5** | **Safety & Emergency Protocol** | Mandatory safety gear advised for hazard categories; emergency jobs require an immediate, unburdened worker. | **REVISION REQUIRED / Advisory** |
| **6** | **Rate Reasonableness** | Technician hourly rate is compared against category market benchmark (deviations flagged). | **Advisory / Warning** |

---

## 5. API Endpoints (`Agent4Controller`)

- `POST /api/agent4/workflow/{workflowId}/validate`: Executes Agent 4 compliance audit within an automated agent workflow.
- `POST /api/agent4/validate`: On-demand validation endpoint accepting `Agent4ValidateWorkerRequestDto` to evaluate any worker against a maintenance request.
- `GET /api/agent4/validation-result/{maintenanceRequestId}`: Retrieves the persisted `ValidationResult` and full deserialized `Agent4Memory` audit trail.

---

## 6. Verification & Test Suite

All 7 targeted unit tests in `SmartProperty.Tests/AgenticAI/Agent4Tests.cs` pass (full project test suite: 125 passed, 0 failed):

1. `ValidationSafetyAgent_ValidTechnician_ReturnsPassWithLowRisk`
2. `ValidationSafetyAgent_UnverifiedTechnician_ReturnsFailWithHighRisk`
3. `ValidationSafetyAgent_SkillMismatch_ProducesBlockingViolation`
4. `ValidationSafetyAgent_DoubleBookingConflict_ReturnsRevisionRequired`
5. `ValidationSafetyAgent_EmergencyWithBusyWorker_ReturnsRevisionRequired`
6. `ValidationSafetyAgent_ExorbitantHourlyRate_AddsWarningFlag`
7. `ValidationSafetyAgent_PersistsValidationResultInDatabase`

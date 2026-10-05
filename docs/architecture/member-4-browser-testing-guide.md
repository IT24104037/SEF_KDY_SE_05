# Member 4: End-to-End Browser Testing & Technical Execution Guide

This document provides a step-by-step walkthrough for testing **Member 4's Worker Lifecycle, Deterministic Matching Engine, and Work Order Execution** in the browser (`http://localhost:5173`), starting from a Tenant submitting a maintenance issue.

---

## 1. End-to-End Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. TENANT PORTAL                                                                │
│    Tenant reports maintenance issue (e.g., "Kitchen pipe leaking") with photo   │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ POST /api/maintenance-requests
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. AI WORKFLOW & CATEGORIZATION                                                 │
│    Analyzes issue, classifies trade category ("Plumbing"), assesses urgency     │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Calls IWorkerMatchingService
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. 🎯 MEMBER 4: DETERMINISTIC MATCHING ENGINE                                    │
│    • Filter 1: VerificationStatus == "Verified" (Trade proof approved by admin) │
│    • Filter 2: Trade Skills contains "Plumbing"                                │
│    • Filter 3: Service Area within 25km radius of property                     │
│    • Filter 4: IsAvailable == true & FreeNow / Shift slot matches schedule     │
│    • Output: Top-ranked candidate (e.g., Eranda Dissanayake, LKR 2,500/hr)      │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Creates ApprovalDecision
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. OWNER PORTAL: APPROVAL                                                       │
│    Property Owner reviews recommendation & clicks "Approve Worker"              │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Generates WorkOrder Entity
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. 🎯 MEMBER 4: WORKER DASHBOARD & EXECUTION                                    │
│    • Work order appears in Worker's "My Jobs" tab (#WO-XX, "Assigned")         │
│    • Worker clicks "Start Execution" ➔ Status transitions to "InProgress"       │
│    • Worker completes job, adds notes & attaches evidence URL ➔ "Completed"    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Accounts Credentials

| Role | Email | Password | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Tenant** | `tenant@smartproperty.com` | `Tenant@12345` | `/tenant/maintenance/report` |
| **Property Owner** | `owner@smartproperty.com` | `Owner@12345` | `/owner/approval` |
| **Maintenance Worker** | `eranda@gmail.com` | `Worker@12345` | `/worker` |
| **System Admin** | `admin@smartproperty.com` | `Admin@12345` | `/admin/workers` |

---

## 3. Step-by-Step Testing Walkthrough

---

### Prerequisites: Ensure the Worker is Ready (Member 4 Setup)

Before submitting a request, verify that the worker is **Verified**, has the **Plumbing** skill, and has an active **Weekly Schedule**:

1. Open `http://localhost:5173/login` in your browser.
2. Sign in as **Maintenance Worker**:
   - **Email**: `eranda@gmail.com`
   - **Password**: `Worker@12345`
3. You will land on the **Worker Dashboard** (`http://localhost:5173/worker`):
   - **Hero Banner**: Verify the status badge displays **`✓ Verified Specialist`**.
   - **Quick Dispatch Toggle**: Verify the status pill is set to **`● FREE NOW`** (Accepting Jobs).
   - **Weekly Schedule Tab**: Click the `Weekly Schedule` tab. If empty, click the quick preset button **`⚡ Mon-Fri 8am–5pm`** to ensure an active shift exists for today.
4. Click **`Logout`** in the top right corner.

---

### Step 1: Tenant Submits Maintenance Request

#### Where to go:
Navigate to `http://localhost:5173/login` and log in as **Tenant**:
- **Email**: `tenant@smartproperty.com`
- **Password**: `Tenant@12345`

#### Browser Action:
1. In the sidebar, click **Report Maintenance** (or navigate to `http://localhost:5173/tenant/maintenance/report`).
2. Fill out the report form:
   - **Problem Description**: `Kitchen sink drain pipe is fractured and leaking water onto the cabinet floor.`
   - **Photo**: Select any test JPG/PNG image from your computer.
3. Click **Submit Maintenance Request**.
4. A green success alert will appear:
   > *"Maintenance request #MR-X submitted successfully."*
5. Click **Logout**.

#### What happens internally:
1. **API Endpoint**: `POST /api/maintenance-requests`
2. **Database Query**: Resolves the tenant's active tenancy from the `Tenancies` table in Supabase.
3. **Entity Creation**: Inserts a new record into `MaintenanceRequests`:
   - `TenantId`: Linked to the logged-in tenant.
   - `PropertyId` & `UnitId`: Automatically assigned from tenancy (e.g. Colombo City Residencies, Unit A-101).
   - `Status`: `"Submitted"`
   - `RequestType`: `"NORMAL"`
4. **AI Trigger**: The system classifies the issue into category **`Plumbing`** and assesses severity.

---

### Step 2: The Matching Engine Matches Your Worker

#### What happens internally (No UI action needed here):
1. The AI Workflow triggers Member 4's **`IWorkerMatchingService.FindBestWorkerAsync(requestId)`**.
2. Member 4's algorithm executes deterministic filtering against the database:
   - **Verification Check**: `worker.VerificationStatus == "Verified"` (Passed for Eranda).
   - **Skill Compatibility**: Searches `WorkerSkills` where `SkillName.ToLower().Contains("plumbing")` (Passed: Eranda is a Plumber).
   - **Proximity Filter**: Calculates distance between `Property.Latitude/Longitude` and worker's `ServiceArea` radius ($\le 25\text{ km}$).
   - **Schedule Availability**: Evaluates `WorkerAvailabilities` for today's day-of-week and current time.
   - **Active Toggle**: Verifies `worker.IsAvailable == true`.
3. Eranda is ranked as the **Rank #1 Best Match**.
4. The system stores this match inside the `ApprovalDecisions` table with a recommendation summary (Worker Name, Hourly Rate LKR 2,500, Estimated Cost, Matching Score).

---

### Step 3: Owner Reviews & Approves Worker

#### Where to go:
Navigate to `http://localhost:5173/login` and log in as **Property Owner**:
- **Email**: `owner@smartproperty.com`
- **Password**: `Owner@12345`

#### Browser Action:
1. In the navigation sidebar, click **AI Recommendations / Approval** (or navigate to `http://localhost:5173/owner/approval`).
2. Locate the card for the plumbing request:
   - You will see the AI recommendation card showing **Eranda Dissanayake** with his trade specialization (`Plumbing`), hourly rate, and matching score.
3. Click the green button **"Approve Worker"**.
4. A success notification will confirm the approval.
5. Click **Logout**.

#### What happens internally:
1. **API Endpoint**: `POST /api/ai-workflow/approval` (or `PUT /api/approval-decisions/{id}`)
2. **Work Order Creation (Member 4 Entity)**:
   A new record is inserted into the `WorkOrders` table:
   - `WorkerId`: Linked to Eranda.
   - `MaintenanceRequestId`: Linked to the tenant's request.
   - `Status`: `"Assigned"`
   - `ScheduledDate`: Set to the approved execution date.
3. `MaintenanceRequest.Status` updates to `"InProgress"`.

---

### Step 4: Worker Executes Job on Worker Dashboard

#### Where to go:
Navigate to `http://localhost:5173/login` and log in as **Maintenance Worker**:
- **Email**: `eranda@gmail.com`
- **Password**: `Worker@12345`

#### Browser Action (Worker Dashboard):
1. You land on the redesigned **Worker Dashboard** (`http://localhost:5173/worker`).
2. **Where it appears**:
   - The **Active Work Orders** stat card increments to show your active job.
   - Under the **`🛠️ My Jobs`** tab, you will see the new job card:
     - **Priority Chip**: `⚡ NORMAL` (or `🚨 EMERGENCY`)
     - **Identifier**: `#WO-XX`
     - **Title**: `Kitchen sink drain pipe is fractured and leaking...`
     - **Location**: `Colombo City Residencies · Unit A-101`
     - **Status Badge**: `● Assigned`
3. Click **"Manage Job & Progress →"**:
   - Opens the Work Order Details view (`/owner/work-orders/:id`).

#### Browser Action (Execution State Machine):
4. **Initiate Job**:
   - Click **"Start Execution"**.
   - *Internal*: `PUT /api/work-orders/{id}/status` with `status = "InProgress"`.
   - The UI live-updates to show the status badge as **`InProgress`** and records `StartedAt`.
5. **Complete Job & Provide Evidence**:
   - Scroll down to the completion form.
   - **Completion Notes**: `Replaced broken PVC P-trap pipe and sealed joints. Tested water flow with full pressure - no leakage detected.`
   - **Completion Evidence URL**: `https://drive.google.com/file/d/sample-completion-proof/view`
   - Click **"Submit Completion Evidence"**.
6. The work order status transitions to **`Completed`** with a green checkmark!

---

### Step 5: Verification of Completed Lifecycle

1. Click **"Dashboard"** in the top navigation bar to return to `http://localhost:5173/worker`.
2. Notice the UI updates:
   - Active work orders count decreases.
   - Completed work orders count increments.
   - Click the **`Completed`** filter pill under **My Jobs**: the completed work order appears with its completion timestamp and evidence link.

---

## 4. Key Troubleshooting Points

- **"Failed to execute 'json' on 'Response'"**:
  Ensure `web/smart-property-web/.env` contains `VITE_API_BASE_URL=http://localhost:5144` so frontend requests hit the .NET backend API instead of Vite's dev server.
- **Worker not appearing in AI recommendations**:
  1. Check worker verification status in `/admin/workers`: must be **Verified**.
  2. Check worker skills: must match the category of the maintenance request (e.g. `Plumbing`).
  3. Check worker availability: `isAvailable` toggle must be **Active** (Free Now).


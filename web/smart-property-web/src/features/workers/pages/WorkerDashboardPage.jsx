import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyProfile,
  updateMyProfile,
  getMyAvailability,
  updateMyAvailability,
  getWorkOrders,
} from "../services/workerService.js";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function WorkerDashboardPage() {
  const [worker, setWorker] = useState(null);
  const [availability, setAvailability] = useState({ slots: [], freeNow: false });
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [availMsg, setAvailMsg] = useState("");
  const [availError, setAvailError] = useState("");

  // Profile edit state
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // New slot form state
  const [newDay, setNewDay] = useState(1); // Monday
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("17:00");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [profileData, availData, ordersData] = await Promise.all([
        getMyProfile().catch(() => null),
        getMyAvailability().catch(() => null),
        getWorkOrders().catch(() => []),
      ]);

      if (profileData) {
        setWorker(profileData);
        setBio(profileData.bio || "");
        setHourlyRate(profileData.hourlyRate != null ? profileData.hourlyRate : "");
        setServiceArea(profileData.serviceArea || "");
        setIsAvailable(profileData.isAvailable ?? true);
      }

      if (availData) {
        setAvailability(availData);
      }

      if (ordersData) {
        setWorkOrders(ordersData);
      }
    } catch {
      // Worker profile not found or user not authenticated
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileError("");

    try {
      const updated = await updateMyProfile({
        bio,
        hourlyRate: hourlyRate === "" ? null : Number(hourlyRate),
        serviceArea,
        isAvailable,
      });
      setWorker(updated);
      setProfileMsg("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddSlot(e) {
    e.preventDefault();
    setAvailMsg("");
    setAvailError("");

    const newSlot = {
      dayOfWeek: Number(newDay),
      startTime: `${newStart}:00`,
      endTime: `${newEnd}:00`,
      isActive: true,
    };

    const updatedSlots = [...availability.slots, newSlot];
    setSavingAvailability(true);

    try {
      const res = await updateMyAvailability(updatedSlots);
      setAvailability(res);
      setAvailMsg("Shift slot added successfully!");
    } catch (err) {
      setAvailError(err.message);
    } finally {
      setSavingAvailability(false);
    }
  }

  async function handleRemoveSlot(index) {
    setAvailMsg("");
    setAvailError("");

    const updatedSlots = availability.slots.filter((_, i) => i !== index);
    setSavingAvailability(true);

    try {
      const res = await updateMyAvailability(updatedSlots);
      setAvailability(res);
      setAvailMsg("Shift removed successfully!");
    } catch (err) {
      setAvailError(err.message);
    } finally {
      setSavingAvailability(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading worker profile and availability schedule...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Maintenance Worker Portal</p>
          <h1 style={styles.title}>Worker Dashboard</h1>
          <p style={styles.muted}>
            Manage your profile, weekly availability shifts, and view active work orders.
          </p>
        </div>
        <a href="/worker/verification" style={styles.link}>
          Verification status ({worker?.verificationStatus || "Pending"})
        </a>
      </header>

      <section style={styles.topSummary}>
        <div style={styles.summaryCard}>
          <span style={styles.label}>Real-time Availability</span>
          <h2 style={{ color: availability.freeNow ? "#10b981" : "#f59e0b", margin: "6px 0" }}>
            {availability.freeNow ? "● Free Now" : "○ Off Schedule / Busy"}
          </h2>
          <p style={styles.mutedSmall}>
            {availability.freeNow
              ? "You match active shift criteria and have no conflicting jobs."
              : "Not currently within an active shift slot or active toggle is off."}
          </p>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.label}>Hourly Rate</span>
          <h2 style={{ color: "#17324d", margin: "6px 0" }}>
            {worker?.hourlyRate ? `LKR ${worker.hourlyRate.toLocaleString()}/hr` : "Not set"}
          </h2>
          <p style={styles.mutedSmall}>Configured service rate for quotation calculations</p>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.label}>Service Coverage</span>
          <h2 style={{ color: "#17324d", margin: "6px 0" }}>
            {worker?.serviceArea || "Not defined"}
          </h2>
          <p style={styles.mutedSmall}>Operating radius: within 25 km</p>
        </div>
      </section>

      {/* Assigned Work Orders Card */}
      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>
              Assigned Work Orders ({workOrders.length})
            </h3>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>
              Maintenance jobs currently assigned to you. Click to start, update progress, and submit completion evidence.
            </p>
          </div>
          <Link to="/owner/work-orders" style={{ ...styles.btnPrimary, padding: "8px 14px", textDecoration: "none", fontSize: "13px" }}>
            View All Jobs
          </Link>
        </div>

        {workOrders.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0" }}>
            No work orders currently assigned. Approved tenant maintenance jobs will appear here.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {workOrders.slice(0, 5).map((wo) => (
              <div
                key={wo.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: wo.isEmergency ? "#dc2626" : "#4f46e5" }}>
                      {wo.isEmergency ? "EMERGENCY" : "NORMAL"}
                    </span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                      #{wo.id} · {wo.requestTitle}
                    </strong>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                    {wo.propertyName} · Unit {wo.unitLabel} · Scheduled:{" "}
                    {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : "Pending"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: wo.status === "Completed" ? "#dcfce7" : wo.status === "InProgress" ? "#e0f2fe" : "#fef3c7",
                      color: wo.status === "Completed" ? "#15803d" : wo.status === "InProgress" ? "#0369a1" : "#92400e",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {wo.status}
                  </span>
                  <Link
                    to={`/owner/work-orders/${wo.id}`}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "#0f766e",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Manage Job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={styles.mainGrid}>
        {/* Left Column: Profile Management */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Profile & Trade Settings</h3>
          <p style={styles.muted}>Keep your bio, hourly rate, and service area updated.</p>

          <form onSubmit={handleProfileSave} style={styles.form}>
            <label style={styles.field}>
              Full Name
              <input style={styles.inputDisabled} value={worker?.fullName || ""} disabled />
            </label>

            <label style={styles.field}>
              Trade Skills
              <input
                style={styles.inputDisabled}
                value={worker?.skills?.join(", ") || "No skills registered"}
                disabled
              />
            </label>

            <label style={styles.field}>
              Hourly Rate (LKR)
              <input
                style={styles.input}
                type="number"
                min="0"
                step="50"
                placeholder="e.g. 2500"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </label>

            <label style={styles.field}>
              Service Area / City
              <input
                style={styles.input}
                placeholder="e.g. Colombo 03, within 20 km"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
              />
            </label>

            <label style={styles.field}>
              Bio & Experience Description
              <textarea
                style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
                placeholder="Tell property owners about your experience and quality of work..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <span>Available to accept new work orders</span>
            </label>

            {profileMsg && <p style={styles.successText}>{profileMsg}</p>}
            {profileError && <p style={styles.errorText}>{profileError}</p>}

            <button type="submit" style={styles.primaryButton} disabled={savingProfile}>
              {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
            </button>
          </form>
        </section>

        {/* Right Column: Weekly Availability Schedule */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Weekly Working Hours</h3>
          <p style={styles.muted}>
            Define your working windows. Shifts cannot overlap on the same day.
          </p>

          <form onSubmit={handleAddSlot} style={styles.addSlotBox}>
            <div style={styles.slotInputs}>
              <label style={styles.slotField}>
                Day
                <select
                  style={styles.select}
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={day} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.slotField}>
                Start Time
                <input
                  style={styles.timeInput}
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  required
                />
              </label>

              <label style={styles.slotField}>
                End Time
                <input
                  style={styles.timeInput}
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  required
                />
              </label>
            </div>

            <button type="submit" style={styles.secondaryButton} disabled={savingAvailability}>
              {savingAvailability ? "Adding..." : "+ Add Shift Window"}
            </button>
          </form>

          {availMsg && <p style={styles.successText}>{availMsg}</p>}
          {availError && <p style={styles.errorText}>{availError}</p>}

          <div style={styles.slotList}>
            <h4 style={{ margin: "16px 0 10px", fontSize: "14px", color: "#17324d" }}>
              Current Scheduled Shifts ({availability.slots.length})
            </h4>

            {availability.slots.length === 0 ? (
              <p style={styles.emptyText}>
                No availability slots configured yet. Add your working hours above!
              </p>
            ) : (
              availability.slots.map((slot, index) => (
                <div key={index} style={styles.slotRow}>
                  <div>
                    <strong style={{ color: "#17324d" }}>
                      {typeof slot.dayOfWeek === "number"
                        ? DAYS_OF_WEEK[slot.dayOfWeek]
                        : slot.dayOfWeek}
                    </strong>
                    <span style={styles.timeBadge}>
                      {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                    </span>
                  </div>
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() => handleRemoveSlot(index)}
                    disabled={savingAvailability}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "36px 4vw", background: "#f5f7fa", color: "#25313c" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" },
  eyebrow: { color: "#1f8a8a", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", margin: 0 },
  title: { color: "#17324d", margin: "6px 0" },
  muted: { color: "#6b7280", lineHeight: 1.5, margin: "0 0 12px", fontSize: "14px" },
  mutedSmall: { color: "#6b7280", margin: 0, fontSize: "12px" },
  link: { color: "#1f8a8a", fontWeight: 700, textDecoration: "none" },
  topSummary: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" },
  summaryCard: { background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", padding: "20px" },
  label: { color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 },
  mainGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" },
  card: { background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", padding: "24px" },
  cardTitle: { margin: "0 0 4px", color: "#17324d", fontSize: "18px" },
  form: { display: "grid", gap: "14px", marginTop: "12px" },
  field: { display: "grid", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#374151" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit" },
  inputDisabled: { padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", background: "#f9fafb", color: "#6b7280" },
  checkboxRow: { display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  primaryButton: { padding: "12px 16px", background: "#1f8a8a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
  secondaryButton: { padding: "10px 14px", background: "#f0fdfa", color: "#0d9488", border: "1px solid #ccfbf1", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "13px", alignSelf: "flex-end" },
  deleteButton: { padding: "4px 10px", background: "#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  addSlotBox: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "16px", display: "grid", gap: "12px" },
  slotInputs: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px" },
  slotField: { display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#4b5563" },
  select: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" },
  timeInput: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" },
  slotList: { marginTop: "12px", display: "grid", gap: "8px" },
  slotRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid #f3f4f6", borderRadius: "6px", background: "#fcfcfc" },
  timeBadge: { marginLeft: "10px", padding: "2px 8px", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px", fontSize: "12px", fontWeight: 600 },
  emptyText: { color: "#9ca3af", fontStyle: "italic", fontSize: "13px", padding: "12px 0" },
  successText: { color: "#059669", background: "#ecfdf5", padding: "8px 12px", borderRadius: "4px", fontSize: "13px", margin: 0 },
  errorText: { color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "4px", fontSize: "13px", margin: 0 },
};

export default WorkerDashboardPage;

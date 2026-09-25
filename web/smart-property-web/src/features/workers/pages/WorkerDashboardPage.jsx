import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth.js";
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

const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon through Sun

function formatTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60; // overnight
  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hours} hrs`;
  return `${hours}h ${mins}m`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function WorkerDashboardPage() {
  const { user, logout } = useAuth();

  const [worker, setWorker] = useState(null);
  const [availability, setAvailability] = useState({ slots: [], freeNow: false });
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active navigation tab: "jobs" | "schedule" | "profile"
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobFilter, setJobFilter] = useState("All");

  // Profile edit state
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // Loading & notification states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [availMsg, setAvailMsg] = useState("");
  const [availError, setAvailError] = useState("");

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
      // Failed to load
    } finally {
      setLoading(false);
    }
  }

  // Quick 1-Click Availability Toggle in Hero Banner
  async function handleToggleAvailability() {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    setTogglingAvailability(true);
    setProfileMsg("");
    setProfileError("");

    try {
      const updated = await updateMyProfile({
        bio,
        hourlyRate: hourlyRate === "" ? null : Number(hourlyRate),
        serviceArea,
        isAvailable: nextVal,
      });
      setWorker(updated);

      // Refresh availability status to reflect freeNow accurately
      const refreshedAvail = await getMyAvailability().catch(() => null);
      if (refreshedAvail) setAvailability(refreshedAvail);
      setProfileMsg(
        nextVal
          ? "Status updated: You are now active and available for dispatch!"
          : "Status updated: You are currently set to off-duty."
      );
      setTimeout(() => setProfileMsg(""), 4000);
    } catch (err) {
      setIsAvailable(!nextVal); // revert
      setProfileError(err.message || "Failed to update availability.");
    } finally {
      setTogglingAvailability(false);
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
      setProfileMsg("Profile settings updated successfully!");
      setTimeout(() => setProfileMsg(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to save profile.");
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
      setAvailMsg(`Added shift for ${DAYS_OF_WEEK[Number(newDay)]} (${newStart} - ${newEnd})`);
      setTimeout(() => setAvailMsg(""), 4000);
    } catch (err) {
      setAvailError(err.message || "Failed to add shift slot.");
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
      setAvailMsg("Shift slot removed.");
      setTimeout(() => setAvailMsg(""), 4000);
    } catch (err) {
      setAvailError(err.message || "Failed to remove shift.");
    } finally {
      setSavingAvailability(false);
    }
  }

  // Quick preset helper
  async function applySchedulePreset(presetType) {
    setAvailMsg("");
    setAvailError("");
    setSavingAvailability(true);

    let newSlots = [];
    if (presetType === "weekdays-standard") {
      // Mon to Fri (1-5), 08:00 - 17:00
      newSlots = [1, 2, 3, 4, 5].map((day) => ({
        dayOfWeek: day,
        startTime: "08:00:00",
        endTime: "17:00:00",
        isActive: true,
      }));
    } else if (presetType === "weekdays-morning") {
      // Mon to Fri (1-5), 08:00 - 12:00
      newSlots = [1, 2, 3, 4, 5].map((day) => ({
        dayOfWeek: day,
        startTime: "08:00:00",
        endTime: "12:00:00",
        isActive: true,
      }));
    } else if (presetType === "weekend-all") {
      // Sat & Sun (6, 0), 09:00 - 17:00
      newSlots = [6, 0].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00:00",
        endTime: "17:00:00",
        isActive: true,
      }));
    } else if (presetType === "clear-all") {
      newSlots = [];
    }

    try {
      const res = await updateMyAvailability(newSlots);
      setAvailability(res);
      setAvailMsg(presetType === "clear-all" ? "All shifts cleared." : "Schedule preset applied successfully!");
      setTimeout(() => setAvailMsg(""), 4000);
    } catch (err) {
      setAvailError(err.message || "Failed to apply preset.");
    } finally {
      setSavingAvailability(false);
    }
  }

  // Filtered work orders
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (jobFilter === "All") return true;
    return wo.status === jobFilter;
  });

  const activeJobCount = workOrders.filter(
    (wo) => wo.status === "Assigned" || wo.status === "InProgress"
  ).length;

  const completedJobCount = workOrders.filter((wo) => wo.status === "Completed").length;

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ marginTop: "16px", color: "#64748b", fontWeight: 500 }}>
          Loading your worker workspace...
        </p>
      </main>
    );
  }

  const workerInitials = (worker?.fullName || user?.fullName || "W")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isVerified = worker?.verificationStatus === "Verified";

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Global Worker Portal Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.brandBadge}>SP</div>
          <div>
            <span style={styles.brandTitle}>SmartProperty</span>
            <span style={styles.brandSubtitle}>Maintenance Worker Portal</span>
          </div>
        </div>

        <nav style={styles.navLinks}>
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            style={{
              ...styles.navLinkButton,
              color: activeTab === "jobs" ? "#0f766e" : "#475569",
              borderBottomColor: activeTab === "jobs" ? "#0f766e" : "transparent",
            }}
          >
            My Jobs ({activeJobCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            style={{
              ...styles.navLinkButton,
              color: activeTab === "schedule" ? "#0f766e" : "#475569",
              borderBottomColor: activeTab === "schedule" ? "#0f766e" : "transparent",
            }}
          >
            Weekly Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              ...styles.navLinkButton,
              color: activeTab === "profile" ? "#0f766e" : "#475569",
              borderBottomColor: activeTab === "profile" ? "#0f766e" : "transparent",
            }}
          >
            Profile & Rates
          </button>
          <Link to="/worker/verification" style={styles.navLink}>
            Verification
          </Link>
        </nav>

        <div style={styles.navUser}>
          <div style={styles.userAvatar}>{workerInitials}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{worker?.fullName || user?.fullName}</span>
            <span style={styles.userRole}>
              {worker?.skills && worker.skills.length > 0
                ? worker.skills[0]
                : "Maintenance Specialist"}
            </span>
          </div>
          <button onClick={logout} style={styles.logoutBtn} title="Sign Out">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.container}>
        {/* 2. Hero Banner with Real-time Dispatch Toggle */}
        <section style={styles.heroBanner}>
          <div style={styles.heroLeft}>
            <div style={styles.heroMeta}>
              <span style={styles.eyebrow}>
                {getGreeting()}, {worker?.fullName ? worker.fullName.split(" ")[0] : "Worker"}!
              </span>
              <span
                style={{
                  ...styles.statusBadge,
                  background: isVerified ? "#dcfce7" : "#fef3c7",
                  color: isVerified ? "#15803d" : "#b45309",
                  borderColor: isVerified ? "#bbf7d0" : "#fde68a",
                }}
              >
                {isVerified ? "✓ Verified Specialist" : `⏳ ${worker?.verificationStatus || "Pending Verification"}`}
              </span>
            </div>
            <h1 style={styles.heroHeading}>Maintenance Command Center</h1>
            <p style={styles.heroText}>
              Manage your active work orders, define shift availability, and control your real-time dispatch eligibility.
            </p>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.toggleCard}>
              <div style={styles.toggleHeader}>
                <span style={styles.toggleLabel}>Dispatch Status</span>
                <span
                  style={{
                    ...styles.livePill,
                    background: availability.freeNow ? "#10b981" : "#94a3b8",
                  }}
                >
                  {availability.freeNow ? "● FREE NOW" : "○ OFF SCHEDULE"}
                </span>
              </div>
              <p style={styles.toggleDesc}>
                {isAvailable
                  ? "You are set to Accept Jobs. System matches you during active shifts."
                  : "You are currently paused. No new work orders will be assigned."}
              </p>
              <button
                type="button"
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                style={{
                  ...styles.quickToggleBtn,
                  background: isAvailable ? "#f0fdf4" : "#f8fafc",
                  color: isAvailable ? "#15803d" : "#475569",
                  borderColor: isAvailable ? "#86efac" : "#cbd5e1",
                }}
              >
                <span
                  style={{
                    ...styles.toggleCircle,
                    background: isAvailable ? "#22c55e" : "#94a3b8",
                  }}
                />
                <span>
                  {togglingAvailability
                    ? "Updating..."
                    : isAvailable
                    ? "Active: Accepting Jobs (Click to Pause)"
                    : "Paused: Off Duty (Click to Go Online)"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Global Feedback Banners */}
        {profileMsg && <div style={styles.toastSuccess}>{profileMsg}</div>}
        {profileError && <div style={styles.toastError}>{profileError}</div>}
        {availMsg && <div style={styles.toastSuccess}>{availMsg}</div>}
        {availError && <div style={styles.toastError}>{availError}</div>}

        {/* 3. KPI Stat Cards */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiIconBox("#0f766e")}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span style={styles.kpiLabel}>Dispatch Availability</span>
              <div style={styles.kpiValue}>
                <span style={{ color: availability.freeNow ? "#10b981" : "#f59e0b" }}>
                  {availability.freeNow ? "Available Now" : "Unavailable"}
                </span>
              </div>
              <span style={styles.kpiSub}>
                {availability.slots.length} shift slot{availability.slots.length === 1 ? "" : "s"} scheduled
              </span>
            </div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiIconBox("#2563eb")}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <span style={styles.kpiLabel}>Active Work Orders</span>
              <div style={styles.kpiValue}>{activeJobCount} <span style={{ fontSize: "14px", fontWeight: 400, color: "#64748b" }}>/ {workOrders.length} total</span></div>
              <span style={styles.kpiSub}>{completedJobCount} successfully completed</span>
            </div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiIconBox("#059669")}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span style={styles.kpiLabel}>Hourly Service Rate</span>
              <div style={styles.kpiValue}>
                {worker?.hourlyRate ? `LKR ${worker.hourlyRate.toLocaleString()}` : "Not Set"}
              </div>
              <span style={styles.kpiSub}>Used for quotation matching</span>
            </div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiIconBox("#7c3aed")}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span style={styles.kpiLabel}>Operating Service Area</span>
              <div style={styles.kpiValue} title={worker?.serviceArea || "Colombo"}>
                {worker?.serviceArea ? (worker.serviceArea.length > 18 ? worker.serviceArea.slice(0, 18) + "..." : worker.serviceArea) : "Colombo City"}
              </div>
              <span style={styles.kpiSub}>Max dispatch radius: 25 km</span>
            </div>
          </div>
        </section>

        {/* 4. Tab Navigation Header */}
        <div style={styles.tabBar}>
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "jobs" ? styles.tabButtonActive : {}),
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Assigned Work Orders</span>
            <span style={styles.tabBadge}>{workOrders.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "schedule" ? styles.tabButtonActive : {}),
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Weekly Availability Schedule</span>
            <span style={styles.tabBadge}>{availability.slots.length} shifts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "profile" ? styles.tabButtonActive : {}),
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile & Trade Rates</span>
          </button>
        </div>

        {/* 5. TAB 1: WORK ORDERS & JOBS */}
        {activeTab === "jobs" && (
          <section style={styles.contentSection}>
            {/* Filter controls */}
            <div style={styles.sectionHeaderBar}>
              <div>
                <h2 style={styles.sectionTitle}>Assigned Work Orders</h2>
                <p style={styles.sectionSub}>
                  Review job requirements, initiate execution, log notes, and submit photographic completion evidence.
                </p>
              </div>

              <div style={styles.filterPillGroup}>
                {["All", "Assigned", "InProgress", "Completed"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setJobFilter(filter)}
                    style={{
                      ...styles.filterPill,
                      ...(jobFilter === filter ? styles.filterPillActive : {}),
                    }}
                  >
                    {filter === "InProgress" ? "In Progress" : filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredWorkOrders.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIconCircle}>
                  <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 style={styles.emptyHeading}>No Work Orders Found</h3>
                <p style={styles.emptySub}>
                  {jobFilter === "All"
                    ? "You do not have any work orders assigned yet. Once property owners approve AI recommendations matching your trade, orders will appear here."
                    : `No work orders currently match the '${jobFilter}' filter.`}
                </p>
              </div>
            ) : (
              <div style={styles.ordersGrid}>
                {filteredWorkOrders.map((wo) => {
                  const isEmergency = wo.isEmergency || wo.priority === "Emergency";
                  const scheduledText = wo.scheduledDate
                    ? new Date(wo.scheduledDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Immediate / Scheduling Pending";

                  return (
                    <div key={wo.id} style={styles.orderCard}>
                      <div style={styles.orderTopRow}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span
                            style={{
                              ...styles.priorityChip,
                              background: isEmergency ? "#fee2e2" : "#eff6ff",
                              color: isEmergency ? "#b91c1c" : "#1d4ed8",
                              borderColor: isEmergency ? "#fca5a5" : "#bfdbfe",
                            }}
                          >
                            {isEmergency ? "🚨 EMERGENCY" : "⚡ NORMAL"}
                          </span>
                          <span style={styles.orderIdTag}>#WO-{wo.id}</span>
                        </div>

                        <span
                          style={{
                            ...styles.statusChip,
                            background:
                              wo.status === "Completed"
                                ? "#dcfce7"
                                : wo.status === "InProgress"
                                ? "#e0f2fe"
                                : "#fef3c7",
                            color:
                              wo.status === "Completed"
                                ? "#15803d"
                                : wo.status === "InProgress"
                                ? "#0369a1"
                                : "#b45309",
                          }}
                        >
                          ● {wo.status === "InProgress" ? "In Progress" : wo.status}
                        </span>
                      </div>

                      <h3 style={styles.orderTitle}>{wo.requestTitle}</h3>

                      <div style={styles.orderDetailsBox}>
                        <div style={styles.orderDetailItem}>
                          <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>
                            <strong>{wo.propertyName || "Property"}</strong> · Unit {wo.unitLabel || "N/A"}
                          </span>
                        </div>

                        <div style={styles.orderDetailItem}>
                          <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Scheduled: {scheduledText}</span>
                        </div>

                        {wo.assignedWorkerName && (
                          <div style={styles.orderDetailItem}>
                            <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Lead: {wo.assignedWorkerName}</span>
                          </div>
                        )}
                      </div>

                      <div style={styles.orderFooter}>
                        <Link
                          to={`/owner/work-orders/${wo.id}`}
                          style={styles.manageJobBtn}
                        >
                          <span>Manage Job & Progress</span>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 6. TAB 2: WEEKLY SCHEDULE & SHIFTS */}
        {activeTab === "schedule" && (
          <section style={styles.contentSection}>
            <div style={styles.sectionHeaderBar}>
              <div>
                <h2 style={styles.sectionTitle}>Weekly Availability Schedule</h2>
                <p style={styles.sectionSub}>
                  Configure your working windows for each day of the week. The automated matching engine only assigns jobs during your active shifts.
                </p>
              </div>

              {/* Quick Presets Bar */}
              <div style={styles.presetsGroup}>
                <span style={styles.presetsLabel}>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applySchedulePreset("weekdays-standard")}
                  style={styles.presetBtn}
                  disabled={savingAvailability}
                >
                  ⚡ Mon-Fri 8am–5pm
                </button>
                <button
                  type="button"
                  onClick={() => applySchedulePreset("weekdays-morning")}
                  style={styles.presetBtn}
                  disabled={savingAvailability}
                >
                  🌅 Mon-Fri Mornings
                </button>
                <button
                  type="button"
                  onClick={() => applySchedulePreset("weekend-all")}
                  style={styles.presetBtn}
                  disabled={savingAvailability}
                >
                  🏖️ Full Weekend
                </button>
                <button
                  type="button"
                  onClick={() => applySchedulePreset("clear-all")}
                  style={{ ...styles.presetBtn, color: "#dc2626", borderColor: "#fecaca" }}
                  disabled={savingAvailability}
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>

            {/* Visual 7-Day Week Calendar */}
            <div style={styles.weekCalendarGrid}>
              {WEEK_DISPLAY_ORDER.map((dayIdx) => {
                const dayName = DAYS_OF_WEEK[dayIdx];
                const daySlots = availability.slots.filter(
                  (s) => Number(s.dayOfWeek) === dayIdx
                );
                const isToday = new Date().getDay() === dayIdx;

                return (
                  <div
                    key={dayIdx}
                    style={{
                      ...styles.dayColumn,
                      ...(isToday ? styles.dayColumnToday : {}),
                    }}
                  >
                    <div style={styles.dayHeader}>
                      <span style={{ fontWeight: 700, color: isToday ? "#0f766e" : "#1e293b" }}>
                        {dayName.slice(0, 3)}
                      </span>
                      {isToday && <span style={styles.todayPill}>Today</span>}
                    </div>

                    <div style={styles.daySlotsContainer}>
                      {daySlots.length === 0 ? (
                        <div style={styles.offDutyNotice}>Off Duty</div>
                      ) : (
                        daySlots.map((slot, idx) => {
                          const slotIndexInFull = availability.slots.findIndex(
                            (s) => s === slot
                          );
                          const duration = calculateDuration(slot.startTime, slot.endTime);

                          return (
                            <div key={idx} style={styles.shiftCard}>
                              <div style={styles.shiftTime}>
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </div>
                              <div style={styles.shiftMeta}>
                                <span style={styles.shiftDuration}>{duration}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(slotIndexInFull)}
                                  disabled={savingAvailability}
                                  style={styles.deleteShiftBtn}
                                  title="Remove Shift Slot"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Slot Panel */}
            <div style={styles.addSlotCard}>
              <h3 style={styles.addSlotTitle}>+ Add Custom Shift Window</h3>
              <p style={styles.addSlotSub}>
                Add individual time slots to your weekly schedule. Shifts cannot overlap on the same day.
              </p>

              <form onSubmit={handleAddSlot} style={styles.addSlotForm}>
                <div style={styles.formRow}>
                  <label style={styles.inputGroup}>
                    <span style={styles.fieldLabel}>Day of Week</span>
                    <select
                      style={styles.selectInput}
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                    >
                      {WEEK_DISPLAY_ORDER.map((dayIdx) => (
                        <option key={dayIdx} value={dayIdx}>
                          {DAYS_OF_WEEK[dayIdx]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={styles.inputGroup}>
                    <span style={styles.fieldLabel}>Start Time</span>
                    <input
                      type="time"
                      style={styles.textInput}
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      required
                    />
                  </label>

                  <label style={styles.inputGroup}>
                    <span style={styles.fieldLabel}>End Time</span>
                    <input
                      type="time"
                      style={styles.textInput}
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={savingAvailability}
                    style={styles.addShiftSubmitBtn}
                  >
                    {savingAvailability ? "Adding Shift..." : "+ Add to Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* 7. TAB 3: PROFILE & RATES */}
        {activeTab === "profile" && (
          <section style={styles.contentSection}>
            <div style={styles.profileLayout}>
              {/* Left Column: Account Verification & Credentials */}
              <div style={styles.profileSidebar}>
                <div style={styles.workerIdentityCard}>
                  <div style={styles.largeAvatar}>{workerInitials}</div>
                  <h3 style={styles.workerNameHeading}>{worker?.fullName || user?.fullName}</h3>
                  <p style={styles.workerEmailText}>{worker?.email || user?.email}</p>

                  <div style={{ marginTop: "12px" }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: isVerified ? "#dcfce7" : "#fef3c7",
                        color: isVerified ? "#15803d" : "#b45309",
                        borderColor: isVerified ? "#bbf7d0" : "#fde68a",
                      }}
                    >
                      {isVerified ? "✓ Verified Worker" : `⏳ ${worker?.verificationStatus || "Pending Verification"}`}
                    </span>
                  </div>

                  {worker?.rejectionReason && (
                    <div style={styles.rejectionNotice}>
                      <strong>Verification Note:</strong> {worker.rejectionReason}
                    </div>
                  )}

                  <hr style={styles.divider} />

                  <div style={styles.sidebarField}>
                    <span style={styles.sidebarLabel}>Registered Skills:</span>
                    <div style={styles.skillsTags}>
                      {worker?.skills && worker.skills.length > 0 ? (
                        worker.skills.map((skill, i) => (
                          <span key={i} style={styles.skillTag}>
                            🔧 {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>No skills listed</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.sidebarField}>
                    <span style={styles.sidebarLabel}>Mobile Number:</span>
                    <span style={styles.sidebarValue}>{worker?.mobile || "Not specified"}</span>
                  </div>

                  {worker?.proofDocumentUrl && (
                    <div style={styles.sidebarField}>
                      <span style={styles.sidebarLabel}>Trade Certificate / Proof:</span>
                      <a
                        href={worker.proofDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.proofDocBtn}
                      >
                        <span>↗ Open Trade Proof Link</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editable Profile Settings */}
              <div style={styles.profileMain}>
                <div style={styles.editCard}>
                  <div style={styles.cardHeaderBox}>
                    <h3 style={styles.cardHeaderTitle}>Service Rates & Coverage</h3>
                    <p style={styles.cardHeaderSub}>
                      Update your pricing and operating location to ensure accurate quotation calculations and optimal job dispatch.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSave} style={styles.formContainer}>
                    <div style={styles.formGrid2}>
                      <label style={styles.inputGroup}>
                        <span style={styles.fieldLabel}>Hourly Service Rate (LKR) *</span>
                        <div style={styles.currencyInputWrap}>
                          <span style={styles.currencyPrefix}>LKR</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="e.g. 2500"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            style={styles.currencyInput}
                            required
                          />
                        </div>
                        <span style={styles.fieldHelp}>
                          Base rate applied when generating automated maintenance cost estimates.
                        </span>
                      </label>

                      <label style={styles.inputGroup}>
                        <span style={styles.fieldLabel}>Operating Service Area / City *</span>
                        <input
                          type="text"
                          placeholder="e.g. Colombo 03, within 25 km"
                          value={serviceArea}
                          onChange={(e) => setServiceArea(e.target.value)}
                          style={styles.textInput}
                          required
                        />
                        <span style={styles.fieldHelp}>
                          Primary district and radius where you can provide on-site services.
                        </span>
                      </label>
                    </div>

                    <label style={styles.inputGroup}>
                      <span style={styles.fieldLabel}>Professional Bio & Work Experience</span>
                      <textarea
                        rows="4"
                        placeholder="Detail your background, trade certifications, equipment capabilities, and commitment to quality..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        style={styles.textAreaInput}
                      />
                      <span style={styles.fieldHelp}>
                        Visible to property owners when reviewing worker assignment recommendations.
                      </span>
                    </label>

                    <label style={styles.checkboxGroup}>
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <div>
                        <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                          Available to accept new work orders
                        </strong>
                        <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>
                          Uncheck if you are taking leave or currently fully booked with external commitments.
                        </p>
                      </div>
                    </label>

                    <div style={styles.formActions}>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        style={styles.saveProfileBtn}
                      >
                        {savingProfile ? "Saving Changes..." : "Save Profile Settings"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0f766e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  pageWrapper: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "inherit",
  },

  // Navbar
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    height: "68px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 40,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  brandBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#0f766e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "15px",
    letterSpacing: "-0.5px",
  },
  brandTitle: {
    display: "block",
    fontWeight: 800,
    fontSize: "16px",
    color: "#0f172a",
    lineHeight: 1.2,
  },
  brandSubtitle: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "100%",
  },
  navLinkButton: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    height: "68px",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
  navLink: {
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
    padding: "0 16px",
    height: "68px",
    display: "flex",
    alignItems: "center",
  },
  navUser: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e0f2fe",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: "11px",
    color: "#64748b",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: "8px",
  },

  // Main Container
  container: {
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "32px 24px 64px",
  },

  // Hero Banner
  heroBanner: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "24px",
    background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
    borderRadius: "16px",
    padding: "32px",
    color: "#ffffff",
    marginBottom: "24px",
    boxShadow: "0 4px 20px -2px rgba(15, 118, 110, 0.25)",
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#99f6e4",
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    border: "1px solid transparent",
  },
  heroHeading: {
    margin: "0 0 10px",
    fontSize: "28px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#ffffff",
  },
  heroText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#ccfbf1",
    maxWidth: "600px",
  },
  heroRight: {
    display: "flex",
    alignItems: "center",
  },
  toggleCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    padding: "20px",
    color: "#0f172a",
    width: "100%",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  toggleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  toggleLabel: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
  },
  livePill: {
    padding: "3px 8px",
    borderRadius: "999px",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  toggleDesc: {
    fontSize: "12px",
    color: "#475569",
    margin: "0 0 14px",
    lineHeight: 1.4,
  },
  quickToggleBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.15s ease",
  },
  toggleCircle: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },

  // Feedback Toasts
  toastSuccess: {
    padding: "12px 18px",
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "20px",
  },
  toastError: {
    padding: "12px 18px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "20px",
  },

  // KPI Grid
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  kpiCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  },
  kpiIconBox: (bg) => ({
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  kpiLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
  },
  kpiValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "4px 0 2px",
  },
  kpiSub: {
    fontSize: "12px",
    color: "#94a3b8",
  },

  // Tabs Bar
  tabBar: {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "24px",
    paddingBottom: "4px",
  },
  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabButtonActive: {
    background: "#0f766e",
    color: "#ffffff",
  },
  tabBadge: {
    padding: "2px 8px",
    borderRadius: "999px",
    background: "rgba(0, 0, 0, 0.1)",
    fontSize: "11px",
    fontWeight: 700,
  },

  // Content Sections
  contentSection: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionSub: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  // Filter Pills
  filterPillGroup: {
    display: "flex",
    gap: "6px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "8px",
  },
  filterPill: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  filterPillActive: {
    background: "#ffffff",
    color: "#0f766e",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  // Work Order Cards
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: "16px",
  },
  orderCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  orderTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  priorityChip: {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 800,
    border: "1px solid",
  },
  orderIdTag: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
  },
  statusChip: {
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },
  orderTitle: {
    margin: "0 0 14px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  orderDetailsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  orderDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
  },
  orderFooter: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "14px",
  },
  manageJobBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    background: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  // Empty State
  emptyCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyIconCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  emptyHeading: {
    margin: "0 0 6px",
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
  },
  emptySub: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    maxWidth: "500px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.5,
  },

  // Weekly Schedule Grid
  presetsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  presetsLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
  },
  presetBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#0f766e",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  weekCalendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  dayColumn: {
    background: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    padding: "14px",
    minHeight: "180px",
    display: "flex",
    flexDirection: "column",
  },
  dayColumnToday: {
    borderColor: "#0f766e",
    background: "#f0fdfa",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #f1f5f9",
  },
  todayPill: {
    fontSize: "10px",
    fontWeight: 800,
    background: "#0f766e",
    color: "#ffffff",
    padding: "2px 6px",
    borderRadius: "999px",
  },
  daySlotsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  offDutyNotice: {
    fontSize: "12px",
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    margin: "auto 0",
    padding: "16px 0",
  },
  shiftCard: {
    background: "#ffffff",
    border: "1px solid #ccfbf1",
    borderRadius: "6px",
    padding: "8px 10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  shiftTime: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#0f766e",
    marginBottom: "4px",
  },
  shiftMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftDuration: {
    fontSize: "11px",
    color: "#64748b",
  },
  deleteShiftBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  },

  // Add Custom Slot Card
  addSlotCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    marginTop: "8px",
  },
  addSlotTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
  },
  addSlotSub: {
    margin: "0 0 16px",
    fontSize: "13px",
    color: "#64748b",
  },
  addSlotForm: {
    marginTop: "12px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) 180px",
    gap: "14px",
    alignItems: "flex-end",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  fieldHelp: {
    fontSize: "12px",
    color: "#64748b",
  },
  selectInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#ffffff",
    color: "#0f172a",
  },
  textInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
  },
  addShiftSubmitBtn: {
    padding: "11px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    height: "42px",
  },

  // Profile Tab Layout
  profileLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px",
    alignItems: "start",
  },
  profileSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  workerIdentityCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    textAlign: "center",
  },
  largeAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#e0f2fe",
    color: "#0284c7",
    fontWeight: 800,
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  workerNameHeading: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },
  workerEmailText: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #f1f5f9",
    margin: "20px 0",
  },
  sidebarField: {
    textAlign: "left",
    marginBottom: "14px",
  },
  sidebarLabel: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
    display: "block",
    marginBottom: "6px",
  },
  sidebarValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
  },
  skillsTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  skillTag: {
    padding: "3px 8px",
    borderRadius: "6px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 600,
  },
  rejectionNotice: {
    marginTop: "12px",
    padding: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "6px",
    fontSize: "12px",
    textAlign: "left",
  },
  proofDocBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "6px",
    background: "#f0fdfa",
    color: "#0f766e",
    border: "1px solid #ccfbf1",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
  },

  // Edit Card
  profileMain: {},
  editCard: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "28px",
  },
  cardHeaderBox: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },
  cardHeaderTitle: {
    margin: "0 0 6px",
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },
  cardHeaderSub: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  currencyInputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
  },
  currencyPrefix: {
    padding: "0 12px",
    background: "#f8fafc",
    color: "#64748b",
    fontWeight: 700,
    fontSize: "13px",
    borderRight: "1px solid #cbd5e1",
    height: "42px",
    display: "flex",
    alignItems: "center",
  },
  currencyInput: {
    flex: 1,
    padding: "10px 12px",
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#0f172a",
  },
  textAreaInput: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#0f172a",
    resize: "vertical",
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
  },
  checkboxInput: {
    marginTop: "3px",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  saveProfileBtn: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(15, 118, 110, 0.2)",
  },
};

export default WorkerDashboardPage;

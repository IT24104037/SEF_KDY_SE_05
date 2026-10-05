import { useEffect, useState } from "react";

import { getOwnerDashboard } from "../services/ownerDashboardApi.js";

function OwnerDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getOwnerDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p style={styles.loading}>Loading dashboard...</p>;
  }

  if (error) {
    return (
      <>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.error}>{error}</p>
      </>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Overview of your properties and units</p>

      <div style={styles.grid}>
        <StatCard title="Total Properties" value={dashboard.totalProperties} />
        <StatCard title="Active Properties" value={dashboard.activeProperties} />
        <StatCard title="Archived Properties" value={dashboard.archivedProperties} />
        <StatCard title="Total Units" value={dashboard.totalUnits} />
        <StatCard title="Active Units" value={dashboard.activeUnits} />
        <StatCard title="Archived Units" value={dashboard.archivedUnits} />
      </div>

      <section style={styles.occupancySection}>
        <h2 style={styles.sectionTitle}>Occupancy</h2>
        <div style={styles.occupancyGrid}>
          <StatCard title="Occupied Units" value={dashboard.occupiedUnits} />
          <StatCard title="Vacant Units" value={dashboard.vacantUnits} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  );
}

const styles = {
  page: {
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loading: {
    color: "#64748b",
    padding: "16px 0",
    fontSize: "14px",
  },
  title: {
    margin: "0 0 6px",
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },

  subtitle: {
    color: "#64748b",
    margin: 0,
    lineHeight: 1.6,
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "16px",
    marginTop: "24px",
    marginBottom: "10px",
  },

  occupancySection: {
    marginTop: "36px",
  },

  sectionTitle: {
    color: "#172033",
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: 700,
  },

  occupancyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "16px",
  },

  statCard: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #0f766e",
    textAlign: "left",
  },

  statTitle: {
    color: "#64748b",
    margin: 0,
    fontSize: "12px",
    fontWeight: 650,
  },

  statValue: {
    fontSize: "30px",
    fontWeight: 750,
    color: "#172033",
    margin: "10px 0 0",
  },

  error: {
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 16px",
  },
};

export default OwnerDashboardPage;

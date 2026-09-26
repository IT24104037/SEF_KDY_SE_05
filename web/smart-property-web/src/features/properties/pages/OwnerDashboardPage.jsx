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
    return <p style={{ color: "#6b7280" }}>Loading dashboard...</p>;
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
    <div>
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
  title: {
    marginTop: 0,
    color: "#17324D",
    fontSize: "24px",
    fontWeight: "700",
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: "30px",
    marginTop: "4px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "10px",
  },

  occupancySection: {
    marginTop: "36px",
  },

  sectionTitle: {
    color: "#17324D",
    marginBottom: "18px",
    fontSize: "18px",
    fontWeight: "600",
  },

  occupancyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },

  statTitle: {
    color: "#6B7280",
    margin: 0,
    fontSize: "14px",
  },

  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#17324D",
    margin: "12px 0 0",
  },

  error: {
    color: "#D64545",
  },
};

export default OwnerDashboardPage;

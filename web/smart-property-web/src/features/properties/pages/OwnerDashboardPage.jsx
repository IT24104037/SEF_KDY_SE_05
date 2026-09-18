import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Owner Dashboard</h1>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <nav style={styles.navigation} aria-label="Owner navigation">
          <Link to="/owner/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link to="/owner/properties" style={styles.navLink}>Properties</Link>
          <Link to="/owner/tenants" style={styles.navLink}>Tenants</Link>
        </nav>

        <h1 style={styles.title}>Owner Dashboard</h1>
        <p style={styles.subtitle}>
          Overview of your properties and units
        </p>

        <div style={styles.grid}>
          <StatCard
            title="Total Properties"
            value={dashboard.totalProperties}
          />

          <StatCard
            title="Active Properties"
            value={dashboard.activeProperties}
          />

          <StatCard
            title="Archived Properties"
            value={dashboard.archivedProperties}
          />

          <StatCard
            title="Total Units"
            value={dashboard.totalUnits}
          />

          <StatCard
            title="Active Units"
            value={dashboard.activeUnits}
          />

          <StatCard
            title="Archived Units"
            value={dashboard.archivedUnits}
          />
        </div>

        <section style={styles.occupancySection}>
          <h2 style={styles.sectionTitle}>Occupancy</h2>
          <div style={styles.occupancyGrid}>
            <StatCard title="Occupied Units" value={dashboard.occupiedUnits} />
            <StatCard title="Vacant Units" value={dashboard.vacantUnits} />
          </div>
        </section>
      </div>
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
    minHeight: "100vh",
    backgroundColor: "#F5F7FA",
    padding: "50px 20px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  card: {
    maxWidth: "500px",
    margin: "50px auto",
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },

  title: {
    marginTop: 0,
    color: "#17324D",
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: "30px",
  },

  navigation: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },

  navLink: {
    color: "#2563EB",
    fontWeight: "600",
    textDecoration: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },

  occupancySection: {
    marginTop: "36px",
  },

  sectionTitle: {
    color: "#17324D",
    marginBottom: "18px",
  },

  occupancyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  statTitle: {
    color: "#6B7280",
    margin: 0,
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
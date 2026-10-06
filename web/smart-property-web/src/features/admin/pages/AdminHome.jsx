import React, { useEffect, useState } from "react";

function AdminHome() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    maintenanceRequests: 0,
    emergencyRequests: 0,
    activeAiWorkflows: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      // IMPORTANT:
      // Use the same token key that your LoginPage/useAuth uses.
      const token =
        sessionStorage.getItem("token");
     

      const response = await fetch(
        "`${API_BASE_URL}/api/admin/dashboard/summary`,",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not load dashboard summary."
        );
      }

      const data = await response.json();

      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard</h1>

      <p style={styles.subtitle}>
        Overview of the Smart Property Maintenance System.
      </p>

      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3 style={styles.label}>Total Users</h3>
          <h2 style={styles.value}>
            {loading ? "--" : summary.totalUsers}
          </h2>
        </div>

        <div style={styles.card}>
          <h3 style={styles.label}>Maintenance Requests</h3>
          <h2 style={styles.value}>
            {loading
              ? "--"
              : summary.maintenanceRequests}
          </h2>
        </div>

        <div style={styles.card}>
          <h3 style={styles.label}>Emergency Requests</h3>
          <h2 style={styles.value}>
            {loading
              ? "--"
              : summary.emergencyRequests}
          </h2>
        </div>

        <div style={styles.card}>
          <h3 style={styles.label}>Active AI Workflows</h3>
          <h2 style={styles.value}>
            {loading
              ? "--"
              : summary.activeAiWorkflows}
          </h2>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  title: {
    margin: "0 0 6px",
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  error: {
    padding: "12px 16px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
  },
  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "16px",
    marginTop: "24px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #5145cd",
    borderRadius: "10px",
    boxShadow:
      "0 8px 24px rgba(22, 34, 42, 0.045)",
  },
  label: {
    margin: "0 0 12px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 650,
  },
  value: {
    margin: 0,
    color: "#172033",
    fontSize: "30px",
    fontWeight: 750,
  },
};

export default AdminHome;
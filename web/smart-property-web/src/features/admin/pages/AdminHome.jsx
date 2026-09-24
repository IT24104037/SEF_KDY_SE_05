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
        "http://localhost:5144/api/admin/dashboard/summary",
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
    <div>
      <h1>Dashboard</h1>

      <p>
        Overview of the Smart Property Maintenance System.
      </p>

      {error && (
        <p style={{ color: "#D64545" }}>
          {error}
        </p>
      )}

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Users</h3>
          <h2>
            {loading ? "--" : summary.totalUsers}
          </h2>
        </div>

        <div style={styles.card}>
          <h3>Maintenance Requests</h3>
          <h2>
            {loading
              ? "--"
              : summary.maintenanceRequests}
          </h2>
        </div>

        <div style={styles.card}>
          <h3>Emergency Requests</h3>
          <h2>
            {loading
              ? "--"
              : summary.emergencyRequests}
          </h2>
        </div>

        <div style={styles.card}>
          <h3>Active AI Workflows</h3>
          <h2>
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
  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "25px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.06)",
  },
};

export default AdminHome;
import React, { useEffect, useState } from "react";
import tenancyService from "../../tenancies/services/tenancyService";

// "Home" / "My Home" / "My Tenancy" combined into one landing page.
export default function MyTenancyPage() {
  const [tenancy, setTenancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchCurrent();
  }, []);

  const fetchCurrent = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await tenancyService.getCurrentTenancy();
      setTenancy(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setTenancy(null);
      } else {
        setErrorMessage("Could not load your tenancy.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={styles.loading}>Loading...</p>;
  if (errorMessage) return <p style={styles.error}>{errorMessage}</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>My Home</h2>

      {!tenancy ? (
        <p style={styles.empty}>You don't have an active tenancy right now.</p>
      ) : (
        <div style={styles.card}>
          <div style={styles.unitTitle}>
            Unit {tenancy.unitName || `#${tenancy.unitId}`}
          </div>
          <p style={styles.meta}>
            Move-in date: {new Date(tenancy.startDate).toLocaleDateString()}
          </p>
          <span style={styles.activeBadge}>
            Active
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "clamp(18px, 3vw, 30px)",
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  title: {
    margin: "0 0 18px",
    color: "#172033",
    fontSize: "22px",
    fontWeight: 700,
  },
  card: {
    maxWidth: 520,
    background: "#ffffff",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #0369a1",
    borderRadius: 12,
    padding: "22px 24px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
  },
  unitTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#172033",
  },
  meta: {
    color: "#64748b",
    fontSize: 14,
    margin: "10px 0 0",
  },
  activeBadge: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    padding: "5px 10px",
    borderRadius: 999,
    color: "#166534",
    background: "#dcfce7",
    marginTop: 14,
  },
  empty: {
    color: "#64748b",
    padding: "18px 20px",
    background: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: 10,
  },
  loading: {
    padding: "24px",
    color: "#64748b",
  },
  error: {
    padding: "12px 16px",
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
  },
};

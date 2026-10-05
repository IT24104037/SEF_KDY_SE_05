import React, { useEffect, useState } from "react";
import TenancyTable from "../../tenancies/components/TenancyTable";
import tenancyService from "../../tenancies/services/tenancyService";

export default function TenantTenancyHistoryPage() {
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await tenancyService.getTenancyHistory();
      setTenancies(data);
    } catch (err) {
      setErrorMessage("Could not load your tenancy history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Tenancy History</h2>
      {loading && <p style={styles.loading}>Loading...</p>}
      {!loading && errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {!loading && !errorMessage && <TenancyTable tenancies={tenancies} showEndAction={false} />}
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
    fontSize: 22,
    fontWeight: 700,
  },
  loading: {
    color: "#64748b",
    padding: "12px 0",
  },
  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
  },
};

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
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#17324D" }}>Tenancy History</h2>
      {loading && <p style={{ color: "#6B7280" }}>Loading...</p>}
      {!loading && errorMessage && <p style={{ color: "#D64545" }}>{errorMessage}</p>}
      {!loading && !errorMessage && <TenancyTable tenancies={tenancies} showEndAction={false} />}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TenancyTable from "../components/TenancyTable";
import tenancyService from "../services/tenancyService";

// Route: /owner/tenants/:tenantId/tenancy-history
export default function TenancyHistoryPage() {
  const { tenantId } = useParams();
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await tenancyService.getTenanciesForTenant(tenantId);
      setTenancies(data);
    } catch (err) {
      setErrorMessage("Could not load tenancy history.");
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
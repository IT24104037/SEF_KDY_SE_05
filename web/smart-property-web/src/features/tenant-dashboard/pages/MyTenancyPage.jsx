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

  if (loading) return <p style={{ padding: 24, color: "#6B7280" }}>Loading...</p>;
  if (errorMessage) return <p style={{ padding: 24, color: "#D64545" }}>{errorMessage}</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#17324D" }}>My Home</h2>

      {!tenancy ? (
        <p style={{ color: "#6B7280" }}>You don't have an active tenancy right now.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #DDE3E9", borderRadius: 8, padding: 20, maxWidth: 420 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#17324D" }}>
            Unit #{tenancy.unitId}
          </div>
          <p style={{ color: "#6B7280" }}>
            Move-in date: {new Date(tenancy.startDate).toLocaleDateString()}
          </p>
          <span style={{ display: "inline-block", fontSize: 12, padding: "4px 10px", borderRadius: 12, color: "#fff", background: "#22A06B", marginTop: 8 }}>
            Active
          </span>
        </div>
      )}
    </div>
  );
}

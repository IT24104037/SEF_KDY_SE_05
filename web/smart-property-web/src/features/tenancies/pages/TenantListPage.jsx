import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import tenancyService from "../services/tenancyService";

export default function TenantListPage() {
  const [tenants, setTenants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState(""); // "" | "true" | "false"
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [options, setOptions] = useState([]);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isActive, propertyId, unitId, sortBy, descending, page]);

  useEffect(() => {
    tenancyService.getOptions().then(setOptions).catch(() => {});
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await tenancyService.getTenants({
        search: search || undefined,
        isActive: isActive === "" ? undefined : isActive === "true",
        propertyId: propertyId || undefined,
        unitId: unitId || undefined,
        sortBy,
        descending,
        page,
        pageSize,
      });
      setTenants(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setErrorMessage("Could not load tenants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#17324D" }}>Tenants</h2>
        <Link to="/owner/tenants/add" style={{ ...buttonStyle, textDecoration: "none" }}>
          + Add Tenant
        </Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search name, mobile, email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{ ...inputStyle, minWidth: 220 }}
        />

        <select
          value={isActive}
          onChange={(e) => {
            setPage(1);
            setIsActive(e.target.value);
          }}
          style={inputStyle}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Pending Activation</option>
        </select>

        <select value={propertyId} onChange={(e) => { setPage(1); setPropertyId(e.target.value); setUnitId(""); }} style={inputStyle}>
          <option value="">All properties</option>
          {options.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
        </select>

        <select value={unitId} onChange={(e) => { setPage(1); setUnitId(e.target.value); }} style={inputStyle}>
          <option value="">All units</option>
          {(options.find((property) => String(property.id) === String(propertyId))?.units || []).map((unit) => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
          <option value="CreatedAt">Sort: Date Added</option>
          <option value="FullName">Sort: Name</option>
        </select>

        <button onClick={() => setDescending(!descending)} style={{ ...inputStyle, cursor: "pointer" }}>
          {descending ? "Descending ↓" : "Ascending ↑"}
        </button>
      </div>

      {loading && <p style={{ color: "#6B7280" }}>Loading tenants...</p>}

      {!loading && errorMessage && <p style={{ color: "#D64545" }}>{errorMessage}</p>}

      {!loading && !errorMessage && tenants.length === 0 && (
        <p style={{ color: "#6B7280" }}>No tenants found. Try adjusting your search or filters.</p>
      )}

      {!loading && !errorMessage && tenants.length > 0 && (
        <>
          <div style={{ background: "#fff", border: "1px solid #DDE3E9", borderRadius: 8 }}>
            {tenants.map((t) => (
              <Link
                key={t.id}
                to={`/owner/tenants/${t.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid #DDE3E9",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                  <div style={{ color: "#6B7280", fontSize: 13 }}>{t.mobileNumber}</div>
                  <div style={{ color: "#6B7280", fontSize: 13 }}>{t.propertyName} / {t.unitName}</div>
                </div>
                <span
                  style={{
                    alignSelf: "center",
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 12,
                    color: "#fff",
                    background: t.isActive ? "#22A06B" : "#F59E0B",
                  }}
                >
                  {t.isActive ? "Active" : "Pending Activation"}
                </span>
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ ...inputStyle, cursor: page <= 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center", color: "#6B7280" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{ ...inputStyle, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "8px 10px",
  border: "1px solid #DDE3E9",
  borderRadius: 6,
  fontSize: 14,
};

const buttonStyle = {
  background: "#1F8A8A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 14,
};
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import tenancyService from "../services/tenancyService";

export default function TenantListPage() {
  const [tenants, setTenants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isActive, setIsActive] = useState(""); // "" | "true" | "false"
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [options, setOptions] = useState([]);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;



useEffect(() => {
  const timer = window.setTimeout(() => {
    setPage(1);
    setDebouncedSearch(search);
  }, 350);

  return () => {
    window.clearTimeout(timer);
  };
}, [search]);
  
  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, isActive, propertyId, unitId, sortBy, descending, page]);

  useEffect(() => {
    tenancyService.getOptions().then(setOptions).catch(() => {});
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await tenancyService.getTenants({
        search: debouncedSearch || undefined,
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
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <h1 style={titleStyle}>Tenants</h1>
        <Link to="/owner/tenants/add" style={{ ...buttonStyle, textDecoration: "none" }}>
          + Add Tenant
        </Link>
      </div>

      <p style={subtitleStyle}>Manage your tenants and tenancy agreements.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search name, mobile, email..."
          value={search}
          onChange={(e) => {
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
            <option key={unit.id} value={unit.id}>{unit.unitLabel}</option>
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

      {loading && <p style={mutedStyle}>Loading tenants...</p>}

      {!loading && errorMessage && <p style={errorStyle}>{errorMessage}</p>}

      {!loading && !errorMessage && tenants.length === 0 && (
        <p style={mutedStyle}>No tenants found. Try adjusting your search or filters.</p>
      )}

      {!loading && !errorMessage && tenants.length > 0 && (
        <>
          <div style={listStyle}>
            {tenants.map((t) => (
              <Link
                key={t.id}
                to={`/owner/tenants/${t.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  borderBottom: "1px solid #edf1f3",
                  textDecoration: "none",
                  color: "inherit",
                  background: "#ffffff",
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
                    padding: "5px 10px",
                    borderRadius: 999,
                    color: t.isActive ? "#166534" : "#92400e",
                    background: t.isActive ? "#dcfce7" : "#fef3c7",
                    fontWeight: 700,
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
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 13,
  color: "#1f2933",
  background: "#ffffff",
  fontFamily: "inherit",
};

const pageStyle = {
  color: "#1f2933",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const titleStyle = {
  margin: 0,
  color: "#172033",
  fontSize: "clamp(23px, 3vw, 30px)",
  fontWeight: 750,
};

const subtitleStyle = {
  color: "#64748b",
  margin: "4px 0 20px",
  fontSize: 14,
};

const mutedStyle = { color: "#64748b", fontSize: 14 };
const errorStyle = { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px" };
const listStyle = { background: "#ffffff", border: "1px solid #e2e7e9", borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" };

const buttonStyle = {
  background: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 15px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 650,
};
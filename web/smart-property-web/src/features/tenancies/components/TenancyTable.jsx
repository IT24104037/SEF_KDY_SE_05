import React from "react";

// Reusable list of tenancy rows. Pass showEndAction=true to render an
// "End Tenancy" button on Active rows (used on CurrentTenanciesPage,
// not on TenancyHistoryPage).
export default function TenancyTable({ tenancies = [], showEndAction = false, onEnd, endingId }) {
  if (tenancies.length === 0) {
    return <p style={styles.empty}>No tenancies to show.</p>;
  }

  return (
    <div style={styles.table}>
      {tenancies.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 18px",
            borderBottom: "1px solid #edf1f3",
          }}
        >
          <div>
            <div style={{ fontWeight: 650, color: "#172033" }}> Unit {t.unitName || `#${t.unitId}`}           
            </div>
            <div style={styles.meta}>
              {new Date(t.startDate).toLocaleDateString()} —{" "}
              {t.endDate ? new Date(t.endDate).toLocaleDateString() : "Present"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 700,
                color: t.status === "Active" ? "#166534" : "#475569",
                background: t.status === "Active" ? "#dcfce7" : "#f1f5f9",
              }}
            >
              {t.status}
            </span>

            {showEndAction && t.status === "Active" && (
              <button
                onClick={() => onEnd(t.id)}
                disabled={endingId === t.id}
                style={{
                  background: "#b91c1c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                  cursor: endingId === t.id ? "not-allowed" : "pointer",
                }}
              >
                {endingId === t.id ? "Ending..." : "End Tenancy"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  table: { background: "#ffffff", border: "1px solid #e2e7e9", borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" },
  meta: { color: "#64748b", fontSize: 13 },
  empty: { color: "#64748b", padding: "12px 0", fontSize: 14 },
};
import React from "react";

// Reusable list of tenancy rows. Pass showEndAction=true to render an
// "End Tenancy" button on Active rows (used on CurrentTenanciesPage,
// not on TenancyHistoryPage).
export default function TenancyTable({ tenancies = [], showEndAction = false, onEnd, endingId }) {
  if (tenancies.length === 0) {
    return <p style={{ color: "#6B7280" }}>No tenancies to show.</p>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #DDE3E9", borderRadius: 8 }}>
      {tenancies.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #DDE3E9",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Unit #{t.unitId}</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>
              {new Date(t.startDate).toLocaleDateString()} —{" "}
              {t.endDate ? new Date(t.endDate).toLocaleDateString() : "Present"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 12,
                color: "#fff",
                background: t.status === "Active" ? "#22A06B" : "#6B7280",
              }}
            >
              {t.status}
            </span>

            {showEndAction && t.status === "Active" && (
              <button
                onClick={() => onEnd(t.id)}
                disabled={endingId === t.id}
                style={{
                  background: "#D64545",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
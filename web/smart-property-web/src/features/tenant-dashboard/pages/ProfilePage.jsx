import React from "react";
import { useAuth } from "../../../hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2 style={{ color: "#17324D" }}>Profile</h2>
      <div style={{ background: "#fff", border: "1px solid #DDE3E9", borderRadius: 8, padding: 16 }}>
        <Row label="Full Name" value={user?.fullName} />
        <Row label="Email" value={user?.email || "-"} />
        <Row label="Role" value={user?.role} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{label}</div>
      <div style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

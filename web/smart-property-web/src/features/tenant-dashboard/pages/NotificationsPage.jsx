import React from "react";

// Shell only, per the spec: "no separate push notification subsystem is
// required." Member 3 plugs maintenance/work-order status updates in here.
export default function NotificationsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#17324D" }}>Notifications / Updates</h2>
      <p style={{ color: "#6B7280" }}>
        No updates yet. Maintenance request status updates will appear here.
      </p>
    </div>
  );
}

import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/tenant/home", label: "My Home" },
  
  { to: "/tenant/maintenance/report", label: "Report Maintenance" },
  { to: "/tenant/maintenance/emergency", label: "Report Emergency" },
  { to: "/tenant/maintenance/requests", label: "My Maintenance Requests" },

  { to: "/tenant/tenancy-history", label: "Tenancy History" },
  { to: "/tenant/notifications", label: "Updates" },
  { to: "/tenant/profile", label: "Profile" },
];

export default function TenantLayout() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f3f5f6",
        color: "#1f2933",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: "#202b33",
          color: "#f8fafc",
          padding: "26px 18px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Smart Property
        </h3>
        <p
          style={{
            margin: "4px 0 26px",
            color: "#aeb8bf",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {user?.fullName}
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block",
                padding: "11px 13px",
                borderRadius: 8,
                color: isActive ? "#ffffff" : "#c5cdd3",
                background: isActive ? "#0369a1" : "transparent",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 650 : 500,
                transition: "background-color 150ms ease, color 150ms ease",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 24,
            background: "transparent",
            border: "1px solid #52616b",
            color: "#d9e0e4",
            borderRadius: 8,
            padding: "11px 13px",
            cursor: "pointer",
            fontWeight: 600,
            textAlign: "left",
          }}
        >
          Log out
        </button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, background: "#f3f5f6" }}>
        <header
          style={{
            background: "#ffffff",
            padding: "18px clamp(20px, 3vw, 36px)",
            borderBottom: "1px solid #e2e7e9",
            boxShadow: "0 2px 8px rgba(22, 34, 42, 0.025)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#1f2933" }}>Tenant Portal</h2>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
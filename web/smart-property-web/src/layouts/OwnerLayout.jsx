import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/owner/dashboard", label: "Dashboard" },
  { to: "/owner/properties", label: "Properties" },
  { to: "/owner/tenants", label: "Tenants" },
];

export default function OwnerLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "#17324D", color: "#fff", padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Smart Property</h3>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{user?.fullName}</p>

        <nav style={{ marginTop: 20 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block",
                padding: "10px 0",
                color: isActive ? "#1F8A8A" : "#fff",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 32,
            background: "transparent",
            border: "1px solid #fff",
            color: "#fff",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </aside>

      <main style={{ flex: 1, background: "#F5F7FA" }}>
        <Outlet />
      </main>
    </div>
  );
}
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getFullName, logout } from "../utils/auth.js";

function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>Smart Property</h2>

        <p style={styles.role}>Administrator</p>
        <nav style={styles.nav}>
          <NavLink to="/admin" end style={linkStyle}>
            Dashboard
          </NavLink>

          <NavLink to="/admin/users" style={linkStyle}>
            User Management
          </NavLink>

          <NavLink to="/admin/owner-verification" style={linkStyle}>
            Owner Verification
          </NavLink>

          <NavLink to="/admin/owner-profile-requests" style={linkStyle}>
            Profile Change Requests
          </NavLink>

          <NavLink to="/admin/property-verification" style={linkStyle}>
            Property Verification
          </NavLink>

          <NavLink to="/admin/workers" style={linkStyle}>
            Worker Verification
          </NavLink>

          <NavLink to="/admin/maintenance" style={linkStyle}>
            Maintenance Requests
          </NavLink>

          <NavLink to="/admin/emergencies" style={linkStyle}>
            Emergency Requests
          </NavLink>

          <NavLink to="/admin/categories" style={linkStyle}>
            Maintenance Categories
          </NavLink>

        <NavLink to="/admin/maintenance-history" style={linkStyle}>
          Maintenance History
        </NavLink>

          <NavLink to="/admin/ai-monitoring" style={linkStyle}>
            AI Workflow Monitoring
          </NavLink>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h3 style={{ margin: 0 }}>Admin Portal</h3>
            <p style={{ margin: "4px 0", color: "#6b7280" }}>
              Welcome, {getFullName()}
            </p>
          </div>
        </header>

        <section style={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function linkStyle({ isActive }) {
  return {
    textDecoration: "none",
    display: "block",
    padding: "11px 13px",
    borderRadius: "8px",
    color: isActive ? "#ffffff" : "#c5cdd3",
    backgroundColor: isActive ? "#5145cd" : "transparent",
    fontSize: "13px",
    fontWeight: isActive ? "650" : "500",
    transition: "background-color 150ms ease, color 150ms ease",
  };
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f3f5f6",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1f2933",
  },

  sidebar: {
    width: "260px",
    flexShrink: 0,
    backgroundColor: "#202b33",
    padding: "26px 18px 20px",
    display: "flex",
    flexDirection: "column",
  },

  logo: {
    color: "#f8fafc",
    margin: "0 0 4px",
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.02em",
  },

  role: {
    color: "#aeb8bf",
    margin: "4px 0 26px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: 1,
  },

  logoutButton: {
    padding: "11px 13px",
    border: "1px solid #52616b",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#d9e0e4",
    fontWeight: "600",
    textAlign: "left",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    backgroundColor: "#ffffff",
    padding: "18px clamp(20px, 3vw, 36px)",
    borderBottom: "1px solid #e2e7e9",
    boxShadow: "0 2px 8px rgba(22, 34, 42, 0.025)",
  },

  content: {
    padding: "clamp(18px, 3vw, 34px)",
  },
};

export default AdminLayout;

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getFullName } from "../utils/auth.js";

function OwnerLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleLogout() {
    sessionStorage.clear();
    navigate("/login");
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>Smart Property</h2>

        <p style={styles.role}>Owner</p>

        <nav style={styles.nav}>
          <NavLink to="/owner/dashboard" end style={linkStyle}>
            Dashboard
          </NavLink>

          <NavLink to="/owner/properties" style={linkStyle}>
            Properties
          </NavLink>

          <NavLink to="/owner/tenants" style={linkStyle}>
            Tenants
          </NavLink>

          <NavLink to="/owner/maintenance" style={linkStyle}>
              Maintenance Requests
          </NavLink>

          <NavLink to="/owner/emergency" style={linkStyle}>
              Emergency Requests
          </NavLink>

          <NavLink to="/owner/maintenance-history" style={linkStyle}>
            Maintenance History
          </NavLink>

          <NavLink to="/owner/profile" style={linkStyle}>
            Profile
          </NavLink>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h3 style={{ margin: 0 }}>Owner Portal</h3>
            <p style={{ margin: "4px 0", color: "#6b7280" }}>
              Welcome, {user?.fullName || getFullName()}
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
    padding: "12px 14px",
    borderRadius: "6px",
    color: isActive ? "#ffffff" : "#d1d5db",
    backgroundColor: isActive ? "#1f8a8a" : "transparent",
  };
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
  },

  sidebar: {
    width: "250px",
    backgroundColor: "#17324d",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },

  logo: {
    color: "#ffffff",
    marginBottom: "4px",
    marginTop: 0,
  },

  role: {
    color: "#9ca3af",
    marginBottom: "30px",
    marginTop: "4px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },

  logoutButton: {
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    color: "#17324d",
    fontWeight: "600",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    backgroundColor: "#ffffff",
    padding: "20px 30px",
    borderBottom: "1px solid #e5e7eb",
  },

  content: {
    padding: "30px",
  },
};

export default OwnerLayout;

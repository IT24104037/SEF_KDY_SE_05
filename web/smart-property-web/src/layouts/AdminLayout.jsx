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

          <NavLink to="/admin/maintenance" style={linkStyle}>
            Maintenance Requests
          </NavLink>

          <NavLink to="/admin/emergencies" style={linkStyle}>
            Emergency Requests
          </NavLink>

          <NavLink to="/admin/categories" style={linkStyle}>
            Maintenance Categories
          </NavLink>

          <NavLink to="/admin/ai-monitoring" style={linkStyle}>
            AI Workflow Monitoring
          </NavLink>

          <NavLink to="/admin/reports" style={linkStyle}>
            Reports & Analytics
          </NavLink>

          <NavLink to="/admin/activity" style={linkStyle}>
            System Activity
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
  },

  logo: {
    color: "#ffffff",
    marginBottom: "4px",
  },

  role: {
    color: "#9ca3af",
    marginBottom: "30px",
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
  },

  main: {
    flex: 1,
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

export default AdminLayout;
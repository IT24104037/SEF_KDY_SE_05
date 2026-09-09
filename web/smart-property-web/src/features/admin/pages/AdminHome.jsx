import { useNavigate } from "react-router-dom";
import { getFullName, logout } from "../../../utils/auth";

function AdminHome() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Admin Dashboard</h1>

      <p>Welcome, {getFullName()}</p>

      <p>Shared authentication is working.</p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default AdminHome;
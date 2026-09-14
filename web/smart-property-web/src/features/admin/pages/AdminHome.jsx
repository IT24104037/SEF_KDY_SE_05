function AdminHome() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Overview of the Smart Property Maintenance System.</p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Users</h3>
          <h2>--</h2>
        </div>

        <div style={styles.card}>
          <h3>Maintenance Requests</h3>
          <h2>--</h2>
        </div>

        <div style={styles.card}>
          <h3>Emergency Requests</h3>
          <h2>--</h2>
        </div>

        <div style={styles.card}>
          <h3>Active AI Workflows</h3>
          <h2>--</h2>
        </div>
      </div>
    </div>
  );
}

const styles = {
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "25px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
};

export default AdminHome;
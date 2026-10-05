function UnauthorizedPage() {
  return (
    <div style={styles.page}>
      <section style={styles.card}>
      <h2 style={styles.title}>Unauthorized</h2>

      <p style={styles.message}>
        You do not have permission to access this page.
      </p>
      </section>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: "clamp(20px, 4vw, 40px)", background: "#f3f5f6", color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  card: { width: "min(520px, 100%)", padding: "clamp(22px, 4vw, 32px)", background: "#ffffff", border: "1px solid #e2e7e9", borderLeft: "4px solid #64748b", borderRadius: 12, boxShadow: "0 10px 28px rgba(22, 34, 42, 0.05)" },
  title: { margin: "0 0 8px", color: "#172033", fontSize: 23, fontWeight: 700 },
  message: { margin: 0, color: "#64748b", lineHeight: 1.6 },
};

export default UnauthorizedPage;
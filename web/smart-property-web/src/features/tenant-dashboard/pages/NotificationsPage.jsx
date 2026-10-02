import { useEffect, useState } from "react";

import {
  getTenantMaintenanceNotifications,
} from "../../workers/services/workerService.js";

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getTenantMaintenanceNotifications();

      setNotifications(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Could not load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatScheduledDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }

  function formatScheduledTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  function formatUtcDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={styles.title}>
          Notifications / Updates
        </h2>

        <p style={styles.muted}>
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Notifications / Updates
          </h2>

          <p style={styles.muted}>
            Maintenance approval and owner updates
            will appear here.
          </p>
        </div>

        <button
          type="button"
          onClick={loadNotifications}
          style={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {!error &&
        notifications.length === 0 && (
          <div style={styles.emptyCard}>
            No maintenance approval updates yet.
          </div>
        )}

      <div style={styles.list}>
        {notifications.map(
          (notification) => {
            const approved =
              notification.decision
                ?.toLowerCase() ===
              "approved";

            return (
              <div
                key={notification.id}
                style={{
                  ...styles.card,

                  borderLeft: approved
                    ? "5px solid #16a34a"
                    : "5px solid #dc2626",
                }}
              >
                <h3
                  style={{
                    ...styles.cardTitle,

                    color: approved
                      ? "#166534"
                      : "#991b1b",
                  }}
                >
                  {approved ? "✅" : "❌"}{" "}
                  Request #
                  {
                    notification.maintenanceRequestId
                  }{" "}
                  {approved
                    ? "Approved"
                    : "Rejected"}
                </h3>

                <p style={styles.description}>
                  {approved
                    ? "Your maintenance request has been approved."
                    : "Your maintenance request has been rejected."}
                </p>

                {approved &&
                  notification.hasAssignedWorker && (
                    <div style={styles.detailsBox}>
                      <p style={styles.detail}>
                        <strong>
                          Worker:
                        </strong>{" "}
                        {notification.workerName ||
                          "-"}
                      </p>

                      <p style={styles.detail}>
                        <strong>
                          Scheduled Date:
                        </strong>{" "}
                        {formatScheduledDate(
                          notification.scheduledDateTime
                        )}
                      </p>

                      <p style={styles.detail}>
                        <strong>
                          Scheduled Time:
                        </strong>{" "}
                        {formatScheduledTime(
                          notification.scheduledDateTime
                        )}
                      </p>
                    </div>
                  )}

                <div style={styles.messageBox}>
                  <strong>
                    {approved
                      ? "Owner Message:"
                      : "Reason:"}
                  </strong>

                  <p
                    style={{
                      margin:
                        "8px 0 0 0",
                      whiteSpace:
                        "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {notification.ownerMessage ||
                      (approved &&
                      notification.hasAssignedWorker
                        ? "The technician has been approved."
                        : "No additional message was provided.")}
                  </p>
                </div>

                <div style={styles.timeStamp}>
                  Decision recorded:{" "}
                  {formatUtcDateTime(
                    approved && notification.scheduledDateTime
                      ? notification.scheduledDateTime
                      : notification.decidedAt
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "clamp(18px, 3vw, 30px)",
    maxWidth: "1040px",
    margin: "0 auto",
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },

  title: {
    color: "#172033",
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
  },

  muted: {
    color: "#64748b",
    marginTop: "7px",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  refreshButton: {
    backgroundColor: "#0369a1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 650,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "22px",
    boxShadow:
      "0 8px 24px rgba(22, 34, 42, 0.045)",
  },

  cardTitle: {
    margin: "0 0 10px 0",
    fontSize: "18px",
  },

  description: {
    color: "#334155",
    margin:
      "0 0 14px 0",
  },

  detailsBox: {
    backgroundColor: "#f3f6f7",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "14px",
  },

  detail: {
    margin: "5px 0",
    color: "#374151",
  },

  messageBox: {
    backgroundColor: "#f8fafb",
    border: "1px solid #e2e7e9",
    borderRadius: "8px",
    padding: "13px",
    color: "#374151",
  },

  timeStamp: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#64748b",
  },

  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "13px",
    marginBottom: "18px",
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: "10px",
    padding: "24px",
    color: "#64748b",
  },
};
"use client";

import { useMemo } from "react";

import { useAppState } from "@/components/providers/app-state-provider";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function NotificationsFeed() {
  const { notifications, dismissNotification, markNotificationRead, ready } =
    useAppState();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  if (!ready) {
    return <div className="screen-loading">Loading notifications…</div>;
  }

  return (
    <div className="screen-stack notifications-screen">
      <section className="screen-section notifications-header-section">
        <div className="section-heading">
          <h1>Notifications</h1>
          <span className="section-meta">{unreadCount} unread</span>
        </div>
      </section>

      <section className="screen-section notifications-banner-section">
        <div className="horizontal-scroll">
          {notifications.slice(0, 4).map((notification) => (
            <article key={notification.id} className="notification-banner">
              <span className="notification-kind">{notification.kind}</span>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="screen-section notifications-list-section">
        <div className="mobile-card-stack">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card${notification.read ? "" : " unread"}`}
              onClick={() => {
                if (!notification.read) {
                  markNotificationRead(notification.id);
                }
              }}
            >
              <div className="notification-card-copy">
                <div className="detail-card-header">
                  <strong>{notification.title}</strong>
                  <span className="notification-date">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p>{notification.message}</p>
              </div>
              <div className="notification-actions">
                <button
                  className="button light-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                  type="button"
                >
                  Dismiss
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

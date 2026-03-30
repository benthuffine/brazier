"use client";

import { useMemo } from "react";

import { useAppState } from "@/components/providers/app-state-provider";

export function NotificationsFeed() {
  const { notifications, dismissNotification, markNotificationRead, ready } = useAppState();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  if (!ready) {
    return <div className="panel">Loading notifications…</div>;
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recent updates</p>
            <h1>Notifications</h1>
          </div>
          <span className="pill">{unreadCount} unread</span>
        </div>
        <p className="muted">
          The MVP keeps notifications in-app first. Email delivery can follow
          once auth and messaging infrastructure are connected.
        </p>
      </section>

      <div className="scroll-row">
        {notifications.slice(0, 4).map((notification) => (
          <article key={notification.id} className="mini-banner">
            <span className="pill muted-pill">{notification.kind}</span>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="stack-md">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification-row${notification.read ? "" : " unread"}`}>
              <div>
                <div className="space-between">
                  <strong>{notification.title}</strong>
                  <span className="muted">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(notification.createdAt))}
                  </span>
                </div>
                <p className="muted">{notification.message}</p>
              </div>
              <div className="actions-row">
                {!notification.read ? (
                  <button
                    className="button secondary"
                    onClick={() => markNotificationRead(notification.id)}
                    type="button"
                  >
                    Mark read
                  </button>
                ) : null}
                <button
                  className="button ghost"
                  onClick={() => dismissNotification(notification.id)}
                  type="button"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

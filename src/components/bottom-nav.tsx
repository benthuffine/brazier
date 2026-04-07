"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppState } from "@/components/providers/app-state-provider";
import { getInitials } from "@/lib/mockup-ui";

const items = [
  { href: "/app", label: "Home", key: "home" },
  { href: "/app/visas", label: "Visas", key: "visas" },
  { href: "/app/notifications", label: "Notifications", key: "alerts" },
  { href: "/app/profile", label: "Profile", key: "profile" },
] as const;

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 10.5L12 4l7.5 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-4v6H5.5a1 1 0 0 1-1-1v-8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 7h10M8 12h10M8 17h10M4.5 7h.01M4.5 12h.01M4.5 17h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 10a5 5 0 0 1 10 0v4l1.5 2H5.5L7 14v-4ZM10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function NavIcon({
  itemKey,
  initials,
}: {
  itemKey: (typeof items)[number]["key"];
  initials: string;
}) {
  if (itemKey === "home") {
    return <HomeIcon />;
  }

  if (itemKey === "visas") {
    return <ListIcon />;
  }

  if (itemKey === "alerts") {
    return <BellIcon />;
  }

  return <span className="bottom-nav-avatar">{initials}</span>;
}

export function BottomNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { notifications, ready } = useAppState();
  const unreadCount = ready
    ? notifications.filter((notification) => !notification.read).length
    : 0;
  const initials = getInitials(userName);

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (pathname === "/app/search" && item.key === "home");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-link${active ? " active" : ""}`}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              <NavIcon itemKey={item.key} initials={initials} />
              {item.key === "alerts" && unreadCount > 0 ? (
                <span className="bottom-nav-badge">
                  {Math.min(unreadCount, 9)}
                </span>
              ) : null}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

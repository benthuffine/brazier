"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="button light-button wide-button"
      onClick={handleLogout}
      type="button"
    >
      Logout
    </button>
  );
}

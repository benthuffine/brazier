import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getOptionalSessionUser } from "@/lib/server/auth";

export default async function LoginPage() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/app");
  }

  return <LoginForm />;
}

import { ProfileWizard } from "@/components/profile-wizard";
import { requireAuthenticatedUser } from "@/lib/server/auth";

export default async function ProfilePage() {
  const user = await requireAuthenticatedUser();

  return <ProfileWizard userEmail={user.email} />;
}

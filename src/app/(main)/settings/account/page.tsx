import { redirect } from "next/navigation";
import { getProfile } from "@/queries/profile";
import { AccountSettings } from "@/components/account-settings";

export default async function AccountPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <AccountSettings
      defaultCurrency={profile.defaultCurrency}
      language={profile.language}
    />
  );
}

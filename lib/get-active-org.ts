import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getActiveOrgId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // active org session mein hoti hai
  return session.session.activeOrganizationId ?? null;
}

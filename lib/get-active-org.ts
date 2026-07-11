import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { member } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getActiveOrgId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // 1. Pehle session active org check karo
  if (session.session.activeOrganizationId) {
    return session.session.activeOrganizationId;
  }

  // 2. Agar active org nahi hai to member table se lo
  const userOrg = await db
    .select()
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  return userOrg[0]?.organizationId ?? null;
}
import { db } from "@/db";
import { note } from "@/db/schema";
import { PLANS, FREE_LIMITS } from "@/lib/plans";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull, count } from "drizzle-orm";

// Is org ki active subscription lo
async function getActiveSubscription(orgId: string) {
  const subs = await auth.api.listActiveSubscriptions({
    query: { referenceId: orgId },
    headers: await headers(),
  });

  // ⭐ sirf active/trialing count hoti hai — past_due/canceled/incomplete nahi
  return subs?.find(
    (s) => s.status === "active" || s.status === "trialing"
  );
}

// Is org ki limits nikalo (plan ke hisab se)
async function getLimitsForOrg(orgId: string) {
  const sub = await getActiveSubscription(orgId);

  if (!sub) {
    return FREE_LIMITS; // koi active sub nahi = Free
  }

  const plan = PLANS.find((p) => p.name === sub.plan);
  return plan?.limits ?? FREE_LIMITS;
}

// Is org ne kitne notes banaye (soft-deleted skip)
async function countNotes(orgId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(note)
    .where(and(eq(note.organizationId, orgId), isNull(note.deletedAt)));
  return row?.value ?? 0;
}

// ⭐ MAIN FUNCTION: kya ye org ye kaam kar sakti hai?
export async function canPerformAction(
  orgId: string,
  action: "create_note"
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getLimitsForOrg(orgId);

  if (action === "create_note") {
    if (limits.notes === -1) {
      return { allowed: true }; // unlimited (Team)
    }
    const used = await countNotes(orgId);
    if (used >= limits.notes) {
      return {
        allowed: false,
        reason: `Aap ki limit (${limits.notes} notes) khatam ho gayi. Upgrade karo.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown action" };
}

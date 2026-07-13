import { db } from "@/db";
import { usageEvent } from "@/db/schema";

export async function recordUsage(
  orgId: string,
  eventType: "note_created" | "ai_action",
  quantity = 1
) {
  if (!orgId) throw new Error("Organization ID is required for usage tracking");
  
  await db.insert(usageEvent).values({
    organizationId: orgId,
    eventType,
    quantity,
    createdAt: new Date(),
  });
}
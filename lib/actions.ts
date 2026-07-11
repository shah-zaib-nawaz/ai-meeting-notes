"use server";

import { db } from "@/db";
import { note } from "@/db/schema";
import { getActiveOrgId } from "@/lib/get-active-org";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  // 1. Login check — server side (browser pe bharosa nahi)
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori hai");
  }

  // 2. Active org lo (Day 3 wala helper)
  const orgId = await getActiveOrgId();
  if (!orgId) {
    throw new Error("Koi active org nahi mili");
  }

  // 3. Form se text nikalo
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.trim() === "") {
    throw new Error("Title zaroori hai");
  }

  // 4. ⭐ SAVE — hamesha org ke saath (multi-tenancy rule)
  await db.insert(note).values({
    organizationId: orgId, // ⭐ ye line sabse zaroori
    title: title.trim(),
    content: content?.trim() || null,
  });

  // 5. Dashboard ka data refresh karo (taake naya note foran dikhe)
  revalidatePath("/dashboard");
}

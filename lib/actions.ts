"use server";

import { db } from "@/db";
import { note } from "@/db/schema";
import { getActiveOrgId } from "@/lib/get-active-org";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
// 1. Inngest client ko import karein
import { inngest } from "@/lib/inngest/client"; 

export async function createNote(formData: FormData) {
  // 1. Login check — server side
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori hai");
  }

  // 2. Active org lo
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

  // 4. SAVE — hamesha org ke saath
  await db.insert(note).values({
    organizationId: orgId,
    title: title.trim(),
    content: content?.trim() || null,
  });

  // 5. Dashboard ka data refresh karo
  revalidatePath("/dashboard");
}

// 2. Isi file mein testIngest function ko niche add kar dein
export async function testIngest(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Login zaroori");
  
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("Koi org nahi");

  const text = formData.get("transcript") as string;
  if (!text || text.trim() === "") throw new Error("Transcript text zaroori hai");

  // Pehle ek note banao (taake noteId ho)
  const [newNote] = await db
    .insert(note)
    .values({ 
      organizationId: orgId, 
      title: "Test meeting", 
      content: text 
    })
    .returning();

  // ⭐ Inngest event fire karo — background job shuru
  await inngest.send({
    name: "transcript/ready",
    data: { 
      transcriptText: text, 
      noteId: newNote.id, 
      organizationId: orgId 
    },
  });
  
  revalidatePath("/dashboard");
}
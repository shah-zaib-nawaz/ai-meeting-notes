"use server";

import { db } from "@/db";
import { note } from "@/db/schema";
import { getActiveOrgId } from "@/lib/get-active-org";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";
import { and, eq } from "drizzle-orm";

export async function createNote(formData: FormData) {
  // 1. Login check
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori hai");
  }

  // 2. Active organization
  const orgId = await getActiveOrgId();
  if (!orgId) {
    throw new Error("Koi active org nahi mili");
  }

  // 3. Form data
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.trim() === "") {
    throw new Error("Title zaroori hai");
  }

  // 4. Save note
  await db.insert(note).values({
    organizationId: orgId,
    title: title.trim(),
    content: content?.trim() || null,
  });

  // 5. Refresh dashboard
  revalidatePath("/dashboard");
}

export async function testIngest(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori");
  }

  const orgId = await getActiveOrgId();
  if (!orgId) {
    throw new Error("Koi org nahi");
  }

  const text = formData.get("transcript") as string;

  if (!text || text.trim() === "") {
    throw new Error("Transcript text zaroori hai");
  }

  // Create a test note
  const [newNote] = await db
    .insert(note)
    .values({
      organizationId: orgId,
      title: "Test meeting",
      content: text,
    })
    .returning();

  // Trigger transcript pipeline
  await inngest.send({
    name: "transcript/ready",
    data: {
      transcriptText: text,
      noteId: newNote.id,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard");
}

export async function startProcessing(
  objectKey: string,
  fileName: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori");
  }

  const orgId = await getActiveOrgId();
  if (!orgId) {
    throw new Error("Koi org nahi");
  }

  // Create a queued note
  const [newNote] = await db
    .insert(note)
    .values({
      organizationId: orgId,
      title: fileName,
      status: "queued",
      audioKey: objectKey,
    })
    .returning();

  // Trigger background processing pipeline
  await inngest.send({
    name: "note/process",
    data: {
      noteId: newNote.id,
      organizationId: orgId,
      audioKey: objectKey,
    },
  });

  revalidatePath("/dashboard");
}

// ⭐ Step 12: Status batane wali action added below
export async function getNoteStatus(noteId: string) {
  const session = await getSession(); // 🔒 Security check
  if (!session) return null;

  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const [n] = await db
    .select({ status: note.status, errorMessage: note.errorMessage })
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.organizationId, orgId))); 
    
  return n || null; // Agar note nahi milta toh safe return ke liye null diya hai
}

// ⭐ Step 14: Retry action
export async function retryNote(noteId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Login zaroori");
  }

  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("Koi org nahi");

  const [n] = await db
    .select()
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.organizationId, orgId))); 
  
  if (!n || !n.audioKey) throw new Error("Note nahi mila");

  await db
    .update(note)
    .set({ status: "queued", errorMessage: null })
    .where(eq(note.id, noteId));

  // pipeline dobara trigger
  await inngest.send({
    name: "note/process",
    data: { 
      noteId: n.id, 
      organizationId: orgId, 
      audioKey: n.audioKey 
    },
  });

  revalidatePath("/dashboard");
}
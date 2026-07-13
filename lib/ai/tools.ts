import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { note, summary } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { retrieveRelevantChunks } from "@/lib/ai/retrieve";
import { recordUsage } from "@/lib/usage";

export function buildTools(orgId: string) {
  return {
    // ---- searchNotes: Semantic Vector RAG Retrieval ----
    searchNotes: tool({
      description: "User ki context aur knowledge base se notes ya meeting transcripts dhoondo.",
      inputSchema: z.object({
        query: z.string().describe("Semantic search ke liye query string."),
      }),
      execute: async ({ query }) => {
        // Strict Org filter embedded inside the retrieval method
        const chunks = await retrieveRelevantChunks(query, orgId);
        return chunks.map((c) => ({
          text: c.chunkText,
          noteId: c.noteId, // For UI source citation mapping
          similarity: c.similarity,
        }));
      },
    }),

    // ---- getNote: Fetches full text metadata and AI processing payload ----
    getNote: tool({
      description: "Kisi specific note ki poori details aur processed summary fetch karo.",
      inputSchema: z.object({
        noteId: z.string().describe("Target note ki unique ID"),
      }),
      execute: async ({ noteId }) => {
        // Double-guarding data isolation leak
        const [n] = await db
          .select()
          .from(note)
          .where(
            and(
              eq(note.id, noteId),
              eq(note.organizationId, orgId),
              isNull(note.deletedAt)
            )
          );
        if (!n) return { error: "Note nahi mila ya aapke paas access nahi hai." };

        const [s] = await db
          .select()
          .from(summary)
          .where(and(eq(summary.noteId, noteId), eq(summary.organizationId, orgId)));

        return { 
          title: n.title, 
          status: n.status, 
          content: n.content,
          summary: s?.content || "No summary available" 
        };
      },
    }),

    // ---- createActionItem: Appends tasks strictly in the actual row context ----
    createActionItem: tool({
      description: "Meeting context ke mutabiq aik naya actionable item aur task assign karo.",
      inputSchema: z.object({
        noteId: z.string().describe("Jis note ke sath action item attach karna hai"),
        text: z.string().describe("Action item ka specific description text"),
      }),
      execute: async ({ noteId, text }) => {
        const [n] = await db
          .select()
          .from(note)
          .where(and(eq(note.id, noteId), eq(note.organizationId, orgId)));
        
        if (!n) return { error: "Action item link karne ke liye target note valid nahi hai." };

        // Append to existing content or start a fresh markdown list block
        const currentContent = n.content || "";
        const updatedContent = `${currentContent}\n\n- [ ] **Action Item:** ${text}`;

        await db
          .update(note)
          .set({ content: updatedContent })
          .where(eq(note.id, noteId));

        // Real-time tracking of AI capabilities usage events 
        await recordUsage(orgId, "ai_action");

        return { 
          success: true, 
          text, 
          attachedToNote: n.title,
          message: "Action item successfully persisted into the note body."
        };
      },
    }),
  };
}
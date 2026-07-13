import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { db } from "@/db";
import { note, transcript, documentChunk, summary } from "@/db/schema";
import { eq } from "drizzle-orm";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { summarizeTranscript } from "@/lib/ai/summarize";

// ==========================================
// Text Chunking Helper
// ==========================================
function chunkText(text: string, chunkSize = 1000): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).length > chunkSize) {
      chunks.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ==========================================
// Full Processing Pipeline Function
// ==========================================
export const processNote = inngest.createFunction(
  {
    id: "process-note",
    triggers: [{ event: "note/process" }],
    onFailure: async ({ event }) => {
      const noteId = event?.data?.event?.data?.noteId;
      if (noteId) {
        await db
          .update(note)
          .set({ status: "failed", errorMessage: "Processing fail hui" })
          .where(eq(note.id, noteId));
      }
    },
  },
  async ({ event, step }) => {
    const { noteId, organizationId, audioKey } = event.data;

    // ---- STEP 1: TRANSCRIBE ----
    await step.run("set-transcribing", async () => {
      await db.update(note).set({ status: "transcribing" }).where(eq(note.id, noteId));
    });

    const transcriptText = await step.run("transcribe", async () => {
      return await transcribeAudio(audioKey);
    });

    await step.run("save-transcript", async () => {
      await db.insert(transcript).values({
        organizationId,
        noteId,
        fullText: transcriptText,
      });
    });

    // ---- STEP 2: SUMMARIZE ----
    await step.run("set-summarizing", async () => {
      await db.update(note).set({ status: "summarizing" }).where(eq(note.id, noteId));
    });

    const summaryObj = await step.run("summarize", async () => {
      return await summarizeTranscript(transcriptText);
    });

    await step.run("save-summary", async () => {
      await db.insert(summary).values({
        organizationId,
        noteId,
        tldr: summaryObj.tldr,
        content: JSON.stringify(summaryObj),
      });
    });

    // ---- STEP 3: CHUNK + EMBED ----
    await step.run("set-embedding", async () => {
      await db.update(note).set({ status: "embedding" }).where(eq(note.id, noteId));
    });

    const chunks = await step.run("chunk", async () => chunkText(transcriptText));

    const embeddings = await step.run("embed", async () => {
      const { embeddings } = await embedMany({
        model: google.textEmbedding("gemini-embedding-001"), // ✅ Fixed: Using stable model
        values: chunks,
        providerOptions: {
          google: {
            outputDimensionality: 768, // 🎯 Enforcing 768 dimensions to match your HNSW index schema
          },
        },
      });
      return embeddings;
    });

    await step.run("store-chunks", async () => {
      await db.insert(documentChunk).values(
        chunks.map((c: string, i: number) => ({
          organizationId,
          noteId,
          chunkText: c,
          embedding: embeddings[i],
        }))
      );
    });

    // ---- DONE ----
    await step.run("set-done", async () => {
      await db.update(note).set({ status: "done" }).where(eq(note.id, noteId));
    });

    return { done: true };
  }
);

// ==========================================
// Ingest Transcript Function
// ==========================================
export const ingestTranscript = inngest.createFunction(
  {
    id: "ingest-transcript",
    retries: 3,
    triggers: [{ event: "transcript/ready" }],
  },
  async ({ event, step }) => {
    const { transcriptText, noteId, organizationId } = event.data;

    const summaryObj = await step.run("generate-summary", async () => {
      return await summarizeTranscript(transcriptText);
    });

    await step.run("save-summary", async () => {
      await db.insert(summary).values({
        organizationId,
        noteId,
        tldr: summaryObj.tldr,
        content: JSON.stringify(summaryObj),
      });
    });

    const chunks = await step.run("create-chunks", async () => {
      return chunkText(transcriptText);
    });

    const embeddings = await step.run("create-embeddings", async () => {
      const result = await embedMany({
        model: google.textEmbedding("gemini-embedding-001"), // ✅ Fixed: Using stable model
        values: chunks,
        providerOptions: {
          google: {
            outputDimensionality: 768, // 🎯 Enforcing 768 dimensions
          },
        },
      });
      return result.embeddings;
    });

    await step.run("save-document-chunks", async () => {
      await db.insert(documentChunk).values(
        chunks.map((chunkText: string, index: number) => ({
          organizationId,
          noteId,
          chunkText,
          embedding: embeddings[index],
        }))
      );
    });

    return { success: true, chunksStored: chunks.length };
  }
);
import { google } from "@ai-sdk/google";
import { embed } from "ai";
import { and, eq, isNull, sql, desc, gt } from "drizzle-orm";
import { db } from "@/db";
import { documentChunk } from "@/db/schema";

export async function retrieveRelevantChunks(query: string, orgId: string) {
  // Generate query embedding matching the pipeline model and dimensions
  const { embedding } = await embed({
    model: google.textEmbedding("gemini-embedding-001"), 
    value: query,
    providerOptions: {
      google: {
        outputDimensionality: 768, 
      },
    },
  });

  // Vector array ko safely format karein JSON string mein jo pgvector easily accept kare
  const embeddingJson = JSON.stringify(embedding);

  // Cosine distance calculation with correct type binding
  const similarity = sql<number>`1 - (${documentChunk.embedding} <=> ${embeddingJson}::vector)`;

  const results = await db
    .select({
      chunkText: documentChunk.chunkText,
      noteId: documentChunk.noteId,
      similarity,
    })
    .from(documentChunk)
    .where(
      and(
        eq(documentChunk.organizationId, orgId),
        isNull(documentChunk.deletedAt),
        gt(similarity, 0.25) // Slightly lower for broader testing
      )
    )
    .orderBy(desc(similarity))
    .limit(5);

  return results;
}
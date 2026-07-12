import { google } from "@ai-sdk/google";
import { embed } from "ai";

import {
  and,
  eq,
  isNull,
  sql,
  desc,
  gt,
} from "drizzle-orm";

import { db } from "@/db";

import { documentChunk } from "@/db/schema";



export async function retrieveRelevantChunks(
  query: string,
  orgId: string
) {


  // Generate query embedding

  const { embedding } =
    await embed({

      model:
        google.textEmbedding(
          "gemini-embedding-001"
        ),

      value: query,

    });



  // cosine similarity

  const similarity =
    sql<number>`
      1 - (${documentChunk.embedding} <=> ${embedding})
    `;



  const results =
    await db
      .select({

        chunkText:
          documentChunk.chunkText,

        noteId:
          documentChunk.noteId,

        similarity,

      })

      .from(documentChunk)


      .where(

        and(

          eq(
            documentChunk.organizationId,
            orgId
          ),


          isNull(
            documentChunk.deletedAt
          ),


          gt(
            similarity,
            0.3
          )

        )

      )


      .orderBy(
        desc(similarity)
      )


      .limit(5);



  return results;

}
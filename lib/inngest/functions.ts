import { inngest } from "./client";

import { google } from "@ai-sdk/google";
import { embedMany } from "ai";

import { db } from "@/db";
import { documentChunk, summary } from "@/db/schema";

import { summarizeTranscript } from "@/lib/ai/summarize";


// ==========================================
// Text Chunking Helper
// ==========================================

function chunkText(
  text: string,
  chunkSize = 1000
): string[] {

  const words = text.split(" ");

  const chunks: string[] = [];

  let current = "";


  for (const word of words) {

    if (
      (current + " " + word).length > chunkSize
    ) {

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
// Inngest Background Function
// ==========================================

export const ingestTranscript =
  inngest.createFunction(

    {
      id: "ingest-transcript",
      retries: 3,

      triggers: [
        {
          event: "transcript/ready",
        },
      ],
    },


    async ({ event, step }) => {


      const {
        transcriptText,
        noteId,
        organizationId,

      } = event.data;



      // =====================================
      // STEP 1: Generate Summary
      // =====================================

      const summaryObj =
        await step.run(
          "generate-summary",

          async () => {

            return await summarizeTranscript(
              transcriptText
            );

          }
        );



      // =====================================
      // STEP 2: Save Summary
      // =====================================

      await step.run(
        "save-summary",

        async () => {

          await db.insert(summary)
            .values({

              organizationId,

              noteId,

              tldr:
                summaryObj.tldr,

              content:
                JSON.stringify(summaryObj),

            });

        }
      );



      // =====================================
      // STEP 3: Create Chunks
      // =====================================

      const chunks =
        await step.run(
          "create-chunks",

          async () => {

            return chunkText(
              transcriptText
            );

          }
        );



      // =====================================
      // STEP 4: Create Embeddings
      // =====================================

      const embeddings =
        await step.run(
          "create-embeddings",

          async () => {


            const result =
              await embedMany({

                model:
                  google.textEmbedding(
                    "gemini-embedding-001"
                  ),


                values: chunks,

              });


            return result.embeddings;

          }
        );



      // =====================================
      // STEP 5: Store Chunks
      // =====================================

      await step.run(
        "save-document-chunks",

        async () => {


          await db.insert(documentChunk)
            .values(

              chunks.map(
                (
                  chunkText: string,
                  index: number
                ) => ({

                  organizationId,

                  noteId,

                  chunkText,

                  embedding:
                    embeddings[index],

                })
              )

            );

        }
      );



      return {

        success: true,

        chunksStored:
          chunks.length,

      };

    }

  );
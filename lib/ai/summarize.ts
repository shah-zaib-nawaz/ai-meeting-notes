import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const summarySchema = z.object({
  tldr: z.string(),
  keyPoints: z.array(z.string()),
  actionItems: z.array(z.string()),
  topics: z.array(z.string()),
});

export async function summarizeTranscript(
  transcriptText: string
) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),

    schema: summarySchema,

    instructions:
      "You are a meeting summarizer. Only use information from transcript. Do not invent facts.",

    prompt: `
Summarize this meeting transcript:

${transcriptText}
`,
  });

  return object;
}
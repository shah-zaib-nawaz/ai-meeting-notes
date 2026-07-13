import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function transcribeAudio(audioKey: string): Promise<string> {
  // 1. R2 se audio nikalo
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: audioKey,
  });
  const obj = await r2.send(command);
  const bytes = await obj.Body!.transformToByteArray();

  // 2. Gemini se transcribe karwao (audio ko samajhta hai)
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Is audio ka poora transcript likho." },
          { type: "file", data: bytes, mediaType: obj.ContentType || "audio/mpeg" },
        ],
      },
    ],
  });

  return text;
}

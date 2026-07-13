import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, isStepCount } from "ai";
import { getSession } from "@/lib/get-session";
import { getActiveOrgId } from "@/lib/get-active-org";
import { buildTools } from "@/lib/ai/tools";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const orgId = await getActiveOrgId();
  if (!orgId) return new Response("No org", { status: 400 });

  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    instructions:
      "Tum user ki meeting notes ka assistant ho. Sawal ke jawab ke liye searchNotes tool use karo. Hamesha source note ka hawala (citation) do. Agar notes mein jawab nahi, to saaf keh do.",
    messages: await convertToModelMessages(messages),
    tools: buildTools(orgId),
    stopWhen: isStepCount(5),
  });

  return result.toUIMessageStreamResponse();
}

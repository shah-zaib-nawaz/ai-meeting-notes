import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { ingestTranscript, processNote } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ingestTranscript, processNote],
});

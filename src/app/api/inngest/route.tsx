import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { createCharacterNFT, backfillData } from "../../../inngest/functions";
export const maxDuration = 300; // For Vercel - max duration is 10 minutes

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [createCharacterNFT, backfillData],
});

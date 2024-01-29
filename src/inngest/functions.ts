import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { db } from "@/lib/dependencies";

export const createCharacterNFT = inngest.createFunction(
  { id: "createCharacterNFT" },
  { event: "createCharacterNFT" },
  async ({ event, step }) => {
    if (!event.data.fid) { // A FID is required to create an NFT
        throw new NonRetriableError("Missing or invalid parameters");
    }


    
  },
);

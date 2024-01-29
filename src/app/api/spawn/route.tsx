import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db } from "@/lib/dependencies";
import { kv } from "@vercel/kv";
import { getFarcasterUsersFromFID } from "@/lib/farcasterUtils";

const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get the FID from the request body
  const frameData = await getFrameData(req);

  if (!frameData) {
    throw new Error("Missing frame data");
  }

  // Fetch user data from FID
  const users = await getFarcasterUsersFromFID(frameData.fid);

  // Character creation
  const characterClasses = ["🧙 Mage", "⚔️ Paladin", "🗡️ Rogue", "⛪ Cleric"];

  // Initalize a new state for this FID
  db.collection("characters").updateOne(
    { fid: frameData.fid },
    {
      $set: {
        // Init default states
        buttons: characterClasses,
        user: users[frameData.fid],
        exp: 0,
        health: 100,
        level: 1,
        lastAction: new Date(),
      },
    },
    { upsert: true }
  );

  const charactersCount = db.collection("characters").countDocuments();
  await kv.set("charactersCount", charactersCount);

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Choose your character",
      image: `api/spawn-image?fid=${frameData.fid}&username=${
        users[frameData.fid]?.username
      }`,
      post_url: "api/start-adventure",
      buttons: characterClasses,
    }),
    { headers }
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

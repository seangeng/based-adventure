import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFarcasterId } from "@/lib/frameUtils";
import { db, mongoClient } from "@/lib/dependencies";

const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  console.log("fetching leaderboard");

  // Get the top 10 characters
  const characterState = await db.collection("characters").findOne({ fid: 0 });

  console.log("characterState", characterState);

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Leaderboard",
      image: `api/leaderboard-image?data=${JSON.stringify(characterState)}`,
      post_url: "api/menu",
      buttons: [],
    }),
    { headers }
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/dependencies";
import { kv } from "@vercel/kv";

// Simple function to retrieve the game stats
const headers = {
  // JSON
  "Content-Type": "application/json",
  "Cache-Control": "public, s-maxage=600",
  "CDN-Cache-Control": "public, s-maxage=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=600",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Try to get game stats
  const charactersCount = await db.collection("characters").countDocuments();
  const nftsMinted = await db.collection("nft").countDocuments();
  const activeLast24h = await db.collection("characters").countDocuments({
    lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  // Save to KV
  await kv.set("charactersCount", charactersCount.toString());

  // Return the game stats as JSON
  return new NextResponse(
    JSON.stringify({
      charactersCount,
      nftsMinted,
      activeLast24h,
    }),
    { headers }
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

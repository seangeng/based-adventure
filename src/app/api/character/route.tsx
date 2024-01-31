import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/dependencies";
import { kv } from "@vercel/kv";

// Simple function to retrieve the character state from the database
const headers = {
  // JSON
  "Content-Type": "application/json",
  "Cache-Control": "public, s-maxage=600",
  "CDN-Cache-Control": "public, s-maxage=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=600",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get the FID from the URL
  const url = new URL(req.nextUrl);
  const fid = url.searchParams.get("fid");

  if (!fid) {
    return new NextResponse(null, { status: 400 });
  }

  // Try to get the character state from the cache
  let characterState = await kv.get(fid);

  // If the character state is not in the cache, get it from the database
  if (!characterState) {
    characterState = await db
      .collection("characters")
      .findOne({ fid: parseInt(fid) });

    // If the character state is still not found, return a 404
    if (!characterState) {
      return new NextResponse(null, { status: 404 });
    }

    // Store the character state in the cache
    await kv.set(fid, JSON.stringify(characterState), { ex: 600 });
  } else {
    // Parse the character state from JSON
    characterState = JSON.parse(characterState as string);
  }

  // Return the character state as JSON
  return new NextResponse(JSON.stringify(characterState), { headers });
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

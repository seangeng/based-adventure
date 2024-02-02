import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/dependencies";

// Simple function to retrieve the character state from the database
const headers = {
  // JSON
  "Content-Type": "application/json",
  "Cache-Control": "public, s-maxage=60",
  "CDN-Cache-Control": "public, s-maxage=60",
  "Vercel-CDN-Cache-Control": "public, s-maxage=60",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get the FID from the URL
  const url = new URL(req.nextUrl);
  const fid = url.searchParams.get("fid");

  if (!fid) {
    return new NextResponse(null, { status: 400 });
  }

  const events = await db
    .collection("logs")
    .find({ targetFid: parseInt(fid) })
    .toArray();

  // Return the character state as JSON
  return new NextResponse(JSON.stringify(events), { headers });
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

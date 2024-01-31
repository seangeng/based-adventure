import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/dependencies";

// Simple function to retrieve the character state from the database
const headers = {
  // JSON
  "Content-Type": "application/json",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get the FID from the URL
  const url = new URL(req.nextUrl);
  const fid = url.searchParams.get("fid");

  if (!fid) {
    return new NextResponse(null, { status: 400 });
  }

  // Get the character state from the database
  const characterState = await db
    .collection("characters")
    .findOne({ fid: parseInt(fid) });

  if (!characterState) {
    return new NextResponse(null, { status: 404 });
  }

  // Return the character state as JSON
  return new NextResponse(JSON.stringify(characterState), { headers });
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

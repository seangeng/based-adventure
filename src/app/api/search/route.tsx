import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/dependencies";

// Simple function to retrieve the character state from the database
const headers = {
  // JSON
  "Content-Type": "application/json",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Search based on the input query in POST body
  const searchQuery = await req.json();
  let searchResults = await db
    .collection("characters")
    .find({ $text: { $search: searchQuery.query } })
    .toArray();

  if (searchResults.length === 0) {
    // Try searching via username regex
    const usernameRegex = new RegExp(searchQuery.query, "i");
    searchResults = await db
      .collection("characters")
      .find({ "user.username": usernameRegex })
      .toArray();
  }

  // Return the search results as JSON
  return new NextResponse(JSON.stringify(searchResults), { headers });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

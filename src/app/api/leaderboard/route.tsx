import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { getFarcasterUsersFromFID } from "@/lib/farcasterUtils";
import { db } from "@/lib/dependencies";

const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const frameData = await getFrameData(req);

  // Get the top 10 characters
  const leaderboard = await db
    .collection("characters")
    .find(
      {
        level: { $gt: 0 },
      },
      {
        sort: { level: -1, turns: 1 },
        limit: 10,
        projection: { _id: 0, class: 1, level: 1, fid: 1 },
      }
    )
    .toArray();

  // Get the the user's rank based on their fid
  // Get all users sorted by level
  const usersSortedByLevel = await db
    .collection("characters")
    .find(
      {
        level: { $gt: 0 },
      },
      {
        sort: { level: -1, turns: 1 },
        projection: { _id: 0, fid: 1 },
      }
    )
    .toArray();

  // Find the index of the user with the given fid in the sorted array
  const userRank =
    usersSortedByLevel.findIndex((user) => user.fid === frameData?.fid) + 1 ||
    0;

  // Lookup the users from the FIDs
  const users = await getFarcasterUsersFromFID(
    leaderboard.map((character: any) => character.fid)
  );

  // Map the data to the format that the leaderboard image expects (keeps url length down)
  const leaderboardData = leaderboard.map((character: any) => {
    return {
      c: character.class,
      l: character.level,
      i: users[character.fid]?.username || character.fid,
    };
  });

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Leaderboard",
      image: `api/leaderboard-image?uRank=${userRank}&data=${encodeURIComponent(
        JSON.stringify(leaderboardData)
      )}`,
      post_url: "api/spawn",
      buttons: ["Back to Game"],
    }),
    { headers }
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
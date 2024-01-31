import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db, getUserRankByFid } from "@/lib/dependencies";

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
        "user.username": { $exists: true },
      },
      {
        sort: { exp: -1, level: -1, turns: 1 },
        limit: 10,
        projection: { _id: 0, class: 1, level: 1, fid: 1 },
      }
    )
    .toArray();

  // Get the the user's rank based on their fid
  let userRank = "" as string | number;
  if (frameData?.fid) {
    userRank = await getUserRankByFid(frameData.fid);
  }

  // Map the data to the format that the leaderboard image expects (keeps url length down)
  const leaderboardData = leaderboard.map((character: any) => {
    return {
      c: character.class,
      l: character.level,
      i: character.user.username || character.fid,
    };
  });

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Leaderboard",
      image: `api/image/leaderboard?uRank=${userRank}&data=${encodeURIComponent(
        JSON.stringify(leaderboardData)
      )}`,
      post_url: "api/menu?buttons=menu",
      buttons: ["menu"],
    }),
    { headers }
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

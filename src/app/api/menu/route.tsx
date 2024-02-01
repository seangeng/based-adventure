import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db, getUserRankByFid } from "@/lib/dependencies";
import { getFarcasterUsersFromFID } from "@/lib/farcasterUtils";
import { buildPromptImageParams } from "@/lib/gameAssets";
import { kv } from "@vercel/kv";

// This is the main menu router
// Here we map the various in-game menu button actions to route you to the right screen
const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get buttons (comma separated) from URL
  const url = new URL(req.nextUrl);
  const buttons = url.searchParams.get("buttons")?.split(",") ?? [];
  if (buttons.length === 0) {
    console.error("No buttons found");
    return new NextResponse(null, { status: 400 });
  }

  // Fet the frame data
  const frameData = await getFrameData(req);
  if (!frameData) {
    return new NextResponse(null, { status: 400 });
  }

  // If there's a redirect, respond with proper redirect
  const redirects = url.searchParams.get("redirects")?.split(",") ?? [];
  if (
    redirects &&
    redirects[frameData.buttonIndex] !== undefined &&
    redirects[frameData.buttonIndex] !== ""
  ) {
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: redirects[frameData.buttonIndex],
      },
    });
  }

  const fid = frameData.fid;
  const buttonIndex = frameData.buttonIndex;
  const buttonSelected = buttons[buttonIndex] ?? null;

  if (buttonSelected === null) {
    console.error("No button selected");
    return new NextResponse(null, { status: 400 });
  }

  if (buttonSelected == "start") {
    // Check if the FID exists in the database

    // Update the global character count
    const charactersCount = db.collection("characters").countDocuments();
    await kv.set("charactersCount", charactersCount);

    const characterState = await db.collection("characters").findOne({ fid });
    if (
      characterState &&
      characterState.buttons &&
      characterState.prevPrompt &&
      characterState.class &&
      characterState.level
    ) {
      // Has a character, give them the option to continue
      const character = `Level ${characterState.level} • ${characterState.class}`;

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Continue your adventure?",
          image: `api/image/prompt?text=${`Continue your quest from where you left off?`}&character=${character}`,
          post_url: `api/menu?buttons=${encodeURIComponent(
            "continue,restart,profile" // New buttons should be passed to the menu router
          )}`,
          buttons: [
            "Continue ▶️",
            "New Game 🆕",
            `Profile ↗️|${process.env.DOMAIN}/api/profile?fid=${fid}`,
          ],
        }),
        { headers }
      );
    } else {
      // No character exists - it's a new game
      return new NextResponse(
        buildFrameMetaHTML({
          title: "Start your Adventure",
          image: `api/image/prompt?text=${`Welcome to Base Quest, an infinite onchain world inside the Base L2.`}`,
          post_url: `api/spawn`,
          buttons: ["Choose your character 🫵"],
        }),
        { headers }
      );
    }
  } else if (buttonSelected == "leaderboard") {
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
    const userRank = await getUserRankByFid(frameData.fid);

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
        image: `api/image/leaderboard?uRank=${userRank}&data=${encodeURIComponent(
          JSON.stringify(leaderboardData)
        )}`,
        post_url: "api/menu?buttons=continue",
        buttons: ["Back to Game"],
      }),
      { headers }
    );
  } else if (buttonSelected == "continue") {
    // Check if the FID exists in the database
    const characterState = await db
      .collection("characters")
      .findOne({ fid: frameData.fid });
    if (
      characterState &&
      characterState.buttons &&
      characterState.prevPrompt &&
      characterState.class &&
      characterState.level
    ) {
      // Restart them from the last prompt
      const params = buildPromptImageParams(
        {
          class: characterState.class,
          exp: characterState.exp ?? 0,
          health: characterState.health ?? 100,
          image: characterState.nft?.thumbnail ?? undefined,
        },
        characterState.prevPrompt
      );

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Continue your adventure",
          image: `api/image/prompt?${params}`,
          post_url: "api/prompt",
          buttons: characterState.buttons,
        }),
        { headers }
      );
    }
  } else if (buttonSelected == "restart") {
    // User is restarting... delete the character state
    await db.collection("characters").deleteOne({ fid });

    return new NextResponse(
      buildFrameMetaHTML({
        title: "Start your Adventure",
        image: `api/image/prompt?text=${encodeURIComponent(
          `A fresh start!  Your state & sins are wiped clean.  You can now begin anew.`
        )}`,
        post_url: `api/spawn`,
        buttons: ["Choose your character 🫵"],
      }),
      { headers }
    );
  }

  // For all other cases, or errors - let's just serve them the splash screen again
  return new NextResponse(
    buildFrameMetaHTML({
      title: "Base Quest",
      image: `api/image/splash`,
      post_url: `api/menu?buttons=${encodeURIComponent(
        "start,leaderboard" // Buttons should be passed to the menu router
      )}`,
      buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
    }),
    { headers }
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

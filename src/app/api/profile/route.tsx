import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db, openai, parseJSON, mint } from "@/lib/dependencies";
import { calculateCharacterState } from "@/lib/gameAssets";
import { modelId } from "@/lib/constants";
import { getFarcasterUsersFromFID } from "@/lib/farcasterUtils";

// This is the logic for the profile page
const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get buttons (comma separated) from URL
  // Get Character FID from URL
  const url = new URL(req.nextUrl);
  const characterFid = url.searchParams.get("fid");
  if (!characterFid) {
    return new NextResponse(null, { status: 400 });
  }
  const buttons = url.searchParams.get("buttons")?.split(",") ?? [];

  // Fet the frame data
  const frameData = await getFrameData(req);
  if (!frameData) {
    return new NextResponse(null, { status: 400 });
  }

  const fid = frameData.fid;
  const buttonIndex = frameData.buttonIndex;
  const buttonSelected = buttons[buttonIndex] ?? null;

  if (buttonSelected === null) {
    console.error("No button selected");
    return new NextResponse(null, { status: 400 });
  }

  // Get the character state
  const characterState = await db
    .collection("characters")
    .findOne({ fid: parseInt(characterFid) });

  if (!characterState) {
    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`Error!  Character not found!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start,leaderboard" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
      }),
      { headers }
    );
  }

  // Don't allow the user to interact with themselves
  if (characterState.fid === fid) {
    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`😵 You can't interact with yourself!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start,leaderboard" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
      }),
      { headers }
    );
  }

  // Check if the fid is in the characterState.interactions array
  if (
    characterState.interactions &&
    characterState.interactions?.includes(fid)
  ) {
    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`✋🏻 You've already interacted with ${characterState.user?.username}'s character!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Back to Base Quest ▶️"],
      }),
      { headers }
    );
  }

  // Initialize the new frame buttons (in case we need to return a new menu)
  const newFrameButtons = ["Add to party 🤝"];
  const newFrameButtonsMap = ["add-to-party"];

  if (buttonSelected === "add-to-party") {
    // Add the character to the user's party by minting it

    // Check to make sure the NFT exists
    const nft = await db
      .collection("nfts")
      .findOne({ fid: characterState.fid });
    if (nft) {
      // Mint the NFT
      const farcasterUser = await getFarcasterUsersFromFID(fid);

      if (farcasterUser[fid]) {
        const walletAddress =
          farcasterUser[fid].verifications[0] ??
          farcasterUser[fid].custody_address;
        const mintTxHash = await mint(nft.contractAddress, walletAddress);

        if (mintTxHash) {
          // Add mints to NFTs
          await db.collection("nfts").updateOne(
            { fid: characterState.fid },
            {
              $addToSet: {
                mints: mintTxHash,
                mintedBy: fid,
              },
            }
          );

          // Update the character state
          await db.collection("characters").updateOne(
            { fid: characterState.fid },
            {
              $inc: {
                mints: 1,
              },
              $addToSet: {
                in_party: fid,
                interactions: fid,
              },
            }
          );

          return new NextResponse(
            buildFrameMetaHTML({
              title: "Base Quest",
              image: `api/image/prompt?text=${`🤝 You've minted ${characterState.user?.username}'s character to your party!`}&subtext=${mintTxHash}`,
              post_url: `api/menu?buttons=${encodeURIComponent(
                "start" // Buttons should be passed to the menu router
              )}`,
              buttons: ["Back to Base Quest ▶️"],
            }),
            { headers }
          );
        }
      }
    }

    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`Error!  Something went wrong minting the NFT!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Back to Base Quest ▶️"],
      }),
      { headers }
    );
  } else if (buttonSelected === "fight") {
    if (characterState?.health <= 0) {
      // Character is dead
      newFrameButtons.push("Heal ❤️‍🩹 (+10 HP)");
      newFrameButtonsMap.push("heal");
      newFrameButtons.push("Boost 🔼 (+10 EXP)");
      newFrameButtonsMap.push("boost");

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Base Quest",
          image: `api/image/prompt?text=${`🪦 ${characterState.user?.username}'s character is already dead!`}`,
          post_url: `api/profile?fid=${
            characterState.fid
          }&buttons=${encodeURIComponent(
            newFrameButtonsMap.join(",") // Buttons should be passed to the menu router
          )}`,
          buttons: newFrameButtons,
        }),
        { headers }
      );
    }

    // Load current user's character
    const userCharacter = await db
      .collection("characters")
      .findOne({ fid: fid });

    if (!userCharacter) {
      // Do 1 damage to the character
      await db.collection("characters").updateOne(
        { fid: characterState.fid },
        {
          $inc: {
            health: -1,
          },
          $addToSet: {
            interactions: fid,
          },
        }
      );

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Base Quest",
          image: `api/image/prompt?text=${`🗡 You've attacked ${characterState.user?.username}'s character!  They've taken 1 damage!  If you had a Base Quest character - you'd be able to do more damage.`}`,
          post_url: `api/menu?buttons=${encodeURIComponent(
            "start,leaderboard" // Buttons should be passed to the menu router
          )}`,
          buttons: ["Play Base Quest! ▶️", "Leaderboard 🏆"],
        }),
        { headers }
      );
    }

    // Has a Base Quest character
    // Get the character states
    const targetCharacter = calculateCharacterState({
      health: characterState.health,
      exp: characterState.exp,
      class: characterState.class,
    });
    const userCharacterState = calculateCharacterState({
      health: userCharacter.health,
      exp: userCharacter.exp,
      class: userCharacter.class,
    });

    // Prompt AI to determine the outcome
    const prompt = `Determine the outcome of a fight between user A & user B.
  
User A: ${targetCharacter.description}
User B: ${userCharacterState.description}
  
Follow the instructions:
- Write a description of the outcome of the fight (up to 100 characters - emojis allowed) (description key).
- Give experience points (exp) between 0 and 50 (exp key).
- Return change in health for each user between -20 and 0 (userAHealthChange and userBHealthChange keys).

Return only a JSON response like: 
${JSON.stringify({
  description: "...",
  exp: 0,
  userAHealthChange: 0,
  userBHealthChange: 0,
})}`;

    const completion = await openai.chat.completions.create({
      model: modelId,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are the narrator in a choose your own adventure text based game called Base Quest, a fantasy world inside the Base L2 EVM blockchain by Coinbase.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Ensure all required keys are present
    const json = parseJSON(completion.choices[0].message.content ?? "");
    if (
      !json.description ||
      !json.exp ||
      !json.userAHealthChange ||
      !json.userBHealthChange ||
      typeof json.description !== "string" ||
      typeof json.exp !== "number" ||
      typeof json.userAHealthChange !== "number" ||
      typeof json.userBHealthChange !== "number"
    ) {
      // Return error screen
      return new NextResponse(
        buildFrameMetaHTML({
          title: "Base Quest",
          image: `api/image/prompt?text=${`Error!  Something went wrong!`}`,
          post_url: `api/menu?buttons=${encodeURIComponent(
            "start,leaderboard" // Buttons should be passed to the menu router
          )}`,
          buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
        }),
        { headers }
      );
    }

    // Update the character states
    await db.collection("characters").updateOne(
      { fid: characterState.fid },
      {
        $inc: {
          exp: json.exp as number,
          health: json.userAHealthChange as number,
        },
        $addToSet: {
          interactions: fid, // Add the user to the interactions array
        },
      }
    );

    await db.collection("characters").updateOne(
      { fid: userCharacter.fid },
      {
        $inc: {
          exp: json.exp as number,
          health: json.userBHealthChange as number,
        },
      }
    );
    // Todo - handle the level changes

    // Return the outcome
    const subtitle = `You fought ${characterState.user?.username}'s & lost ${json.userAHealthChange} HP!  They lost ${json.userBHealthChange} HP!`;
    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${json.description}&subtext=${subtitle}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start,leaderboard" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Play Base Quest! ▶️", "Leaderboard 🏆"],
      }),
      { headers }
    );
  } else if (buttonSelected === "heal") {
    if (characterState?.health === 100) {
      // Already at full health
      newFrameButtons.push("Fight 🤺");
      newFrameButtonsMap.push("fight");
      newFrameButtons.push("Boost 🔼 (+10 EXP)");
      newFrameButtonsMap.push("boost");

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Base Quest",
          image: `api/image/prompt?text=${`✅ ${characterState.user?.username}'s character is already at full health!`}`,
          post_url: `api/profile?fid=${
            characterState.fid
          }&buttons=${encodeURIComponent(
            newFrameButtonsMap.join(",") // Buttons should be passed to the menu router
          )}`,
          buttons: newFrameButtons,
        }),
        { headers }
      );
    }

    // Add 10 HP to the character
    let newHealth = characterState.health + 10;
    if (newHealth > 100) {
      newHealth = 100;
    }

    await db.collection("characters").updateOne(
      { fid: characterState.fid },
      {
        $set: {
          health: newHealth,
        },
        $addToSet: {
          interactions: fid,
        },
      }
    );

    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`🩹 You've healed ${characterState.user?.username}'s character!  Their HP has increased by 10!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Back to Base Quest ▶️"],
      }),
      { headers }
    );
  } else if (buttonSelected === "boost") {
    // Add 10 EXP to the character
    await db.collection("characters").updateOne(
      { fid: characterState.fid },
      {
        $addToSet: {
          interactions: fid,
        },
        $inc: {
          exp: 10,
        },
      }
    );

    return new NextResponse(
      buildFrameMetaHTML({
        title: "Base Quest",
        image: `api/image/prompt?text=${`⏫ You've boosted ${characterState.user?.username}'s character!  Their EXP has increased by 10!`}`,
        post_url: `api/menu?buttons=${encodeURIComponent(
          "start" // Buttons should be passed to the menu router
        )}`,
        buttons: ["Back to Base Quest ▶️"],
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

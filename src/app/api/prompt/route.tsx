import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db, openai, parseJSON } from "@/lib/dependencies";
import {
  buildPromptImageParams,
  calculateCharacterState,
} from "@/lib/gameAssets";
import { modelId } from "@/lib/constants";
import { getRandomGameSetting } from "@/lib/gameAssets";

// This is the general route that the user will see after they select a character class from /api/start-adventure
const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const frameData = await getFrameData(req);

  if (frameData) {
    const fid = frameData.fid;
    const buttonIndex = frameData.buttonIndex;

    // Load the character state
    const characterState = await db.collection("characters").findOne({ fid });
    // Map the button action to the text
    if (
      characterState?.class &&
      characterState?.level &&
      characterState?.buttons &&
      characterState?.prevPrompt
    ) {
      // Check for any notifications
      if (characterState.notification) {
        // Build the image URL
        const params = `text=${characterState.notification.message}${
          characterState.notification.image
            ? "&image=" + encodeURIComponent(characterState.notification.image)
            : ""
        }`;

        // Clear the notification
        db.collection("characters").updateOne(
          { fid },
          { $unset: { notification: "" } }
        );

        // Show the notification screen
        return new NextResponse(
          buildFrameMetaHTML({
            title: "Notification",
            image: `api/image/notification?${params}`,
            post_url: characterState.notification.post_url,
            buttons: characterState.notification.buttons,
          }),
          { headers }
        );
      }

      const buttonValue = characterState.buttons[buttonIndex];

      const character = `Level ${characterState.level} • ${characterState.class}`;
      const currenHealth = characterState?.health ? characterState.health : 100;
      const prevPrompt = characterState.prevPrompt;

      let setting = characterState?.setting ?? getRandomGameSetting();
      let settingPrompt =
        "Setting: " + setting.name + " - " + setting.description;
      if (characterState?.newSetting) {
        setting = getRandomGameSetting();
        settingPrompt =
          "Character is in a new setting: " +
          setting.name +
          " - " +
          setting.description;
      }

      const prompt = `The user is a ${character} (Health: ${currenHealth}/100) continuing their adventure.
${settingPrompt}

When given the prompt: ${prevPrompt}
The user has chosen: ${buttonValue}
  
Follow the instructions:
- Write a follow up prompt to continue the adventure (up to 100 characters - emojis allowed)
- Present the user with either 2 or 4 action buttons (either emoji(s) or short text up to 12 characters)
- Give experience points (exp) between 0 and 100.  Return 0 exp for unmeaningful actions.
- Return change in health between -100 and 100.  Return 0 for unmeaningful actions.
- Return true for newSetting if the user has taken an action will change the setting.

Return only a JSON response like: 
${JSON.stringify({
  prompt: "...",
  buttons: ["...", "..."],
  exp: 0,
  health: 0,
  newSetting: false,
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

      const json = parseJSON(completion.choices[0].message.content ?? "");
      const promptText = json.prompt;
      const buttons = json.buttons;
      // Ensure buttons are an array of between 1 and 4 strings
      const buttonsArray = Array.isArray(buttons) ? buttons : [buttons];
      const buttonsArrayLength = buttonsArray.length;
      const buttonsArrayLengthValid =
        buttonsArrayLength > 0 && buttonsArrayLength <= 4;
      const buttonsArrayStrings = buttonsArray.filter(
        (b) => typeof b === "string"
      );

      if (
        !buttonsArrayLengthValid ||
        buttonsArrayStrings.length !== buttonsArrayLength
      ) {
        throw new Error("Invalid buttons");
      }

      // Handle the exp and health changes
      const { exp, health, level } = calculateCharacterState({
        class: characterState.class,
        exp: characterState.exp,
        health: characterState.health ?? 100,
        expChange: json.exp,
        healthChange: json.health,
      });

      // Update the character state
      db.collection("characters").updateOne(
        { fid },
        {
          $set: {
            prevPrompt: promptText,
            buttons,
            health: typeof health === "number" ? health : 100,
            exp: typeof exp === "number" ? exp : 0,
            lastAction: new Date(),
            level: level,
            newSetting: json.newSetting ?? false,
            setting: setting,
          },
          $addToSet: {
            settingsHistory: setting.image,
          },
          $inc: { turns: 1 },
        },
        { upsert: true }
      );

      // Build the image URL
      const params = buildPromptImageParams(
        {
          class: characterState.class,
          exp: exp,
          health: health,
          image: characterState.nft?.thumbnail ?? undefined,
          expChange: json.exp,
          healthChange: json.health,
        },
        promptText,
        setting
      );

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Next Screen",
          image: `api/image/prompt?${params}`,
          post_url: "api/prompt",
          buttons: buttons,
        }),
        { headers }
      );
    }
  }

  return new NextResponse(null, { status: 400 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

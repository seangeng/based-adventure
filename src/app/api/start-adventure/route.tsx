import { NextRequest, NextResponse } from "next/server";
import { buildFrameMetaHTML, getFrameData } from "@/lib/frameUtils";
import { db, openai, parseJSON } from "@/lib/dependencies";
import { modelId } from "@/lib/constants";

// This is the route that the user will be redirected to after they select a character class from /api/spawn
const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const frameData = await getFrameData(req);
  const fid = frameData?.fid ?? 0;

  if (frameData) {
    // Load the character state
    const characterState = await db.collection("characters").findOne({ fid });
    // Map the button action to the text
    if (characterState) {
      const characterClass = characterState.buttons[frameData.buttonIndex];

      const prompt = `The user is a ${characterClass} starting their first adventure.
      
Write a character narration prompt (up to 100 characters), and present the user with either 2 or 4 action options to continue the story.
Action options should be either emoji(s) or short button text (up to 12 characters)
You can present either 2 or 4 action options to the user.

Return only a JSON response like: 
${JSON.stringify({
  prompt: "...",
  buttons: ["...", "..."],
})}`;

      const completion = await openai.chat.completions.create({
        model: modelId,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `You are the narrator in a choose your own adventure text based game called Base Quest.`,
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

      // Update the character state
      db.collection("characters").updateOne(
        { fid: fid },
        {
          $set: {
            prevPrompt: promptText,
            buttons,
            class: characterClass,
            lastAction: new Date(),
          },
          $inc: { turns: 1 },
        },
        { upsert: true }
      );

      const character = `Level 1 • ${characterClass}`;

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Continue your Base Quest",
          image: `api/prompt-image?text=${promptText}&character=${character}`,
          post_url: "api/prompt",
          buttons: buttons,
        }),
        { headers }
      );
    }
  }

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Continue your Base Quest",
      image: `api/prompt-image?text=${`Oh no!  An unexpected error happened.  Reach out to @seangeng on Warpcast.`}`,
      post_url: "api/menu?buttons=menu",
      buttons: ["Back to Menu"],
    }),
    { headers }
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

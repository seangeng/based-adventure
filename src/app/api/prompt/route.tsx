import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient(process.env.FARCASTER_HUB || "");
import { buildFrameMetaHTML } from "@/lib/frameUtils";
import { db, openai, parseJSON } from "@/lib/dependencies";
const modelId = "gpt-3.5-turbo";

// This is the general route that the user will see after they select a character class from /api/start-adventure

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let validatedMessage: Message | undefined = undefined;
  let fid = 0;
  try {
    // Retrieve & validate the frame data from the request body
    const body = await req.json();

    console.log("body", body);

    const frameMessage = Message.decode(
      Buffer.from(body?.trustedData?.messageBytes || "", "hex")
    );
    const result = await client.validateMessage(frameMessage);
    if (result.isOk() && result.value.valid && result.value.message) {
      validatedMessage = result.value.message;
    }

    const buttonIndex =
      body?.trustedData?.buttonIndex || body?.untrustedData.buttonIndex || 0;

    console.log("validatedMessage", validatedMessage);

    fid = validatedMessage?.data?.fid || 0;

    // Load the character state
    const characterState = await db.collection("characters").findOne({ fid });
    // Map the button action to the text
    if (
      characterState.class &&
      characterState.level &&
      characterState.buttons &&
      characterState.prevPrompt
    ) {
      const buttonValue = characterState.buttons[buttonIndex];

      const headers = {
        "Content-Type": "text/html",
      };

      const character = `Level ${characterState.level} • ${characterState.class}`;
      const prevPrompt = characterState.prevPrompt;

      const prompt = `The user is a ${character} continuing their adventure.

When given the prompt: ${prevPrompt}
The user has chosen: ${buttonValue}
    
Write a follow up prompt to continue the adventure (up to 100 characters), and present the user with and present the user with either 2 or 4 action options.
Action options should be either emoji(s) or short button text (up to 12 characters)
Return a new description of the character, reflective of their current state based on the choices so far.

Return only a JSON response like so: 
${JSON.stringify({
  prompt: "...",
  buttons: ["...", "..."],
  newCharacterLevel: characterState.level,
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

      const newCharacterLevel = json.newCharacterLevel || characterState.level;

      // Update the character state
      db.collection("characters").updateOne(
        { fid },
        {
          $set: {
            prevPrompt: promptText,
            buttons,
            level: newCharacterLevel,
          },
          $inc: { turns: 1 },
        },
        { upsert: true }
      );

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Next Screen",
          image: `api/prompt-image?text=${promptText}&character=${character}`,
          post_url: "api/prompt",
          buttons: buttons,
        }),
        { headers }
      );
    }
  } catch (err) {
    console.error(err);
    throw new Error("Invalid frame data");
  }

  return new NextResponse(null, { status: 400 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

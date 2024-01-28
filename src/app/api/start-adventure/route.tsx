import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient(process.env.FARCASTER_HUB || "");
import { buildFrameMetaHTML } from "@/lib/frameUtils";
import { db, openai, parseJSON } from "@/lib/dependencies";
const modelId = "gpt-3.5-turbo";

// This is the route that the user will be redirected to after they select a character class from /api/spawn

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
      body?.trustedData?.buttonIndex - 1 ||
      body?.untrustedData.buttonIndex - 1 ||
      0;
    // Button index is 1-indexed, but we want it to be 0-indexed

    console.log("validatedMessage", validatedMessage);

    fid = validatedMessage?.data?.fid || 0;

    // Load the character state
    const characterState = await db.collection("characters").findOne({ fid });
    // Map the button action to the text
    if (characterState) {
      const characterClass = characterState.buttons[buttonIndex];

      const headers = {
        "Content-Type": "text/html",
      };

      const prompt = `The user is a ${characterClass} starting their first adventure.
      
Write a character narration prompt (up to 100 characters), and present the user with either 2 or 4 action options to continue the story.
Action options should be either emoji(s) or short button text (up to 12 characters)
You can present either 2 or 4 action options to the user.

Return only a JSON response like so: ${JSON.stringify({
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
        { fid },
        {
          $set: {
            prevPrompt: promptText,
            buttons,
            class: characterClass,
            level: 1,
          },
          $inc: { turns: 1 },
        },
        { upsert: true }
      );

      const character = `Level 1 • ${characterClass}`;

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

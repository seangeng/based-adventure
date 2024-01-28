import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient(process.env.FARCASTER_HUB || "");
import { buildFrameMetaHTML } from "@/lib/frameUtils";
import { db } from "@/lib/dependencies";

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
    if (characterState) {
      const buttonValue = characterState.buttons[buttonIndex];

      const headers = {
        "Content-Type": "text/html",
      };

      return new NextResponse(
        buildFrameMetaHTML({
          title: "Next Screen",
          image: `api/prompt-image?text=${buttonValue}`,
          post_url: "api/prompt",
          buttons: ["Next", "Option B"],
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

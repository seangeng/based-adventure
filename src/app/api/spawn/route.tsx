import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient(process.env.FARCASTER_HUB || "");
import { buildFrameMetaHTML } from "@/lib/frameUtils";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let validatedMessage: Message | undefined = undefined;
  let fid = 0;
  try {
    // Retrieve & validate the frame data from the request body
    const body = await req.json();
    const frameMessage = Message.decode(
      Buffer.from(body?.trustedData?.messageBytes || "", "hex")
    );
    const result = await client.validateMessage(frameMessage);
    if (result.isOk() && result.value.valid && result.value.message) {
      validatedMessage = result.value.message;
    }

    console.log("validatedMessage", validatedMessage);

    fid = validatedMessage?.data?.fid || 0;
  } catch (err) {
    console.error(err);
    throw new Error("Invalid frame data");
  }

  const headers = {
    "Content-Type": "text/html",
  };

  return new NextResponse(
    buildFrameMetaHTML({
      title: "Choose your character",
      image: `api/spawn-image?fid=${fid}`,
      post_url: "api/prompt",
      buttons: ["Hello"],
    }),
    { headers }
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

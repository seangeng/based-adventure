import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient("nemes.farcaster.xyz:2283");

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let validatedMessage: Message | undefined = undefined;
  let fid = 0;
  try {
    const body = await req.json();
    const frameMessage = Message.decode(
      Buffer.from(body?.trustedData?.messageBytes || "", "hex")
    );
    const result = await client.validateMessage(frameMessage);
    if (result.isOk() && result.value.valid && result.value.message) {
      validatedMessage = result.value.message;
    }
    fid = validatedMessage?.data?.fid || 0;
  } catch (err) {
    console.error(err);
  }

  const headers = {
    "Content-Type": "text/html",
  };

  return new NextResponse(
    `<!DOCTYPE html>
        <html>
        <head>
            <title>Mint</title>
            <meta property="og:title" content="Tested!">
            <meta property="og:image" content="${process.env.DOMAIN}/api/spawn-image?fid=${fid}">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${process.env.DOMAIN}/api/spawn-image?fid=${fid}">
            <meta name="fc:frame:post_url" content="${process.env.DOMAIN}/api/prompt">
            <meta name="fc:frame:button:1" content="Hello">
        </head>
        <body>
            <p>Choose your own text based adventure.</p>
        </body>
        </html>
    `,
    { headers }
  );
}
export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

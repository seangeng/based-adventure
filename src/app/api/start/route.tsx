import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient("nemes.farcaster.xyz:2283");

interface fidResponse {
  verifications: string[];
}
async function getAddrByFid(fid: number) {
  const options = {
    method: "GET",
    url: `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    headers: { accept: "application/json", api_key: "NEYNAR_API_DOCS" },
  };
  const resp = await fetch(options.url, { headers: options.headers });
  const data = await resp.json();
  if (data?.users) {
    const userVerifications = data.users[0] as fidResponse;
    if (userVerifications.verifications) {
      return userVerifications.verifications[0];
    }
  }
  return "0x00";
}

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const query = req.nextUrl.searchParams;

  console.log("query", query);

  return new NextResponse(`
    <!DOCTYPE html>
        <html>
        <head>
            <title>Mint</title>
            <meta property="og:title" content="Tested!">
            <meta property="og:image" content="/api/welcome">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="/api/welcome">
            <meta name="fc:frame:post_url" content="https://based-adventure.vercel.app/api/start">
            <meta name="fc:frame:button:1" content="Minted to">
        </head>
        <body>
            <p>Choose your own text based adventure.</p>
        </body>
        </html>
    `);
}
export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

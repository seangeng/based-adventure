import { NextRequest, NextResponse } from "next/server";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const query = req.nextUrl.searchParams;

  console.log("query", query);

  const headers = {
    "Content-Type": "text/html",
  };

  return new NextResponse(
    `
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

import { NextRequest, NextResponse } from "next/server";

// Simple function to redirect the user to passed parameter
const headers = {
  "Content-Type": "text/html",
};

async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Get the FID from the URL
  const url = new URL(req.nextUrl);
  let target = url.searchParams.get("tx");

  if (!target) {
    return new NextResponse(null, { status: 400 });
  }

  // Append https://sepolia.base.org to the target
  target = `https://sepolia.base.org/tx/${target}`;

  const html = `
      <html>
        <head>
          <meta http-equiv="refresh" content="1;url=${target}" />
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
    `;

  return new NextResponse(html, { headers });
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

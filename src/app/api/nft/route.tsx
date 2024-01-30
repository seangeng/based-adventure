export const runtime = "edge"; // Serve on the edge runtime for faster response times
import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  // Require a FID
  const url = new URL(request.url);
  const fid = url.searchParams.get("fid");
  if (!fid) {
    return new Response(null, { status: 400 });
  }

  const fontData = await fetch(
    new URL("../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  // Fetch the character state from the API
  const characterState = await fetch(
    new URL(`${process.env.domain}/api/character?fid=${fid}`, import.meta.url)
  ).then((res) => res.json());

  console.log(characterState);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "50px 100px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: '"Typewriter"',
        }}
      ></div>
    ),
    {
      width: 1024,
      height: 1024,
      fonts: [
        {
          name: "Silkscreen",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}

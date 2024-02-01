export const runtime = "edge"; // Serve on the edge runtime for faster response times
import { ImageResponse } from "next/og";
import { kv } from "@vercel/kv";
import { version } from "@/lib/constants";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const imageData = await fetch(
    new URL("../../../../../public/base-quest-bg-sm.jpg", import.meta.url)
  ).then((res) => res.arrayBuffer());

  let charactersCount = 0;
  try {
    charactersCount = (await kv.get("charactersCount")) as number;
  } catch (e) {
    console.error(e);
  }

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
      >
        <img
          width="1200"
          height="630"
          // @ts-ignore
          src={imageData}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: -1,
            objectFit: "cover",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 0,
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.7)",
            padding: "0 20px",
            lineHeight: "48px",
            color: "#3773F5",
            fontSize: 18,
          }}
        >
          Version {version}
        </div>

        {charactersCount && charactersCount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 0,
              position: "absolute",
              bottom: 20,
              left: 20,
              background: "rgba(0,0,0,0.7)",
              padding: "0 20px",
              lineHeight: "18px",
            }}
          >
            <p>👑 Join {charactersCount as React.ReactNode} players</p>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
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

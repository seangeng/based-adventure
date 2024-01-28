import { ImageResponse } from "next/og";
export const runtime = "edge";
import { BaseQuestLogo } from "@/lib/gameAssets";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const { searchParams } = new URL(request.url);
  // Get the data from the query string
  const data = searchParams.get("data");
  const leaderboardData = JSON.parse(data || "[]");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 42,
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
        <div
          style={{
            display: "flex",
            flexFlow: "row wrap",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {leaderboardData.map((character: any, index: number) => {
            return (
              <p key={index}>
                {character.class} • Level {character.value}
              </p>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 20,
            right: 30,
            fontSize: 24,
            color: "#3773F5",
          }}
        >
          You are rank $1
        </div>

        <BaseQuestLogo />
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

import { ImageResponse } from "next/og";
export const runtime = "edge";
import { BaseQuestLogo } from "@/lib/gameAssets";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  console.log("rendering leaderboard image");

  const { searchParams } = new URL(request.url);
  // Get the data from the query string
  const data = searchParams.get("data");
  const leaderboardData = JSON.parse(data || "[]") as {
    c: string;
    l: number;
    i: string;
  }[];

  // Get the user's rank
  const userRankParam = searchParams.get("uRank");
  const userRank = userRankParam ? parseInt(userRankParam) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "80px 120px 50px 120px",
          textAlign: "left",
          justifyContent: "flex-start",
          alignItems: "center",
          fontFamily: '"Typewriter"',
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          {leaderboardData.map((character: any, index: number) => {
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flex: "0 0 100%",
                  textAlign: "left",
                  gap: 20,
                }}
              >
                #{index + 1}:{" "}
                <span
                  style={{
                    color: "#3773F5",
                  }}
                >
                  {character.i}
                </span>{" "}
                <span>
                  Level {character.l} - {character.c}
                </span>
              </div>
            );
          })}
        </div>
        {userRank > 0 && (
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
            You are rank #{userRank}
          </div>
        )}

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

export const runtime = "edge";
import { ImageResponse } from "next/og";
import { BaseQuestLogo, calculateExpLevels } from "@/lib/gameAssets";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const { searchParams } = new URL(request.url);
  const hasCharacter = searchParams.has("character");
  const character = hasCharacter ? searchParams.get("character") : "";

  const hasName = searchParams.has("name");
  const name = hasName ? searchParams.get("name") : "";

  const hasImage = searchParams.has("image");
  const image = hasImage ? searchParams.get("image") : "";

  const hasTurns = searchParams.has("turns");
  const turns = hasTurns ? searchParams.get("turns") : "";

  const hasRank = searchParams.has("rank");
  const rank = hasRank ? searchParams.get("rank") : "";

  // Optional params (health and exp)
  const exp = searchParams.get("exp") ?? null;
  const health = searchParams.get("health") ?? null;
  let expPercent = null;

  if (exp) {
    // Used to calculate the exp bar
    const expLevels = calculateExpLevels(Number(exp));
    const nextLevelExp = expLevels.expForNextLevel;
    const prevLevelExp = expLevels.expForPrevLevel;

    expPercent = Math.round(
      ((Number(exp) - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 32,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "50px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: '"Typewriter"',
        }}
      >
        {turns != "" && (
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
            Played {turns} frames
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 50,
          }}
        >
          {hasImage && (
            <div
              style={{
                display: "flex",
                height: 390,
                border: "5px solid #333",
                padding: 10,
              }}
            >
              <img
                width="360"
                height="360"
                // @ts-ignore
                src={image}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexFlow: "column wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 32, color: "#3773F5" }}>{name}</span>
            <span style={{ fontSize: 48 }}>{character}</span>
            <span style={{ fontSize: 32, color: "#3773F5" }}>
              Rank: #{rank}
            </span>
            {health && (
              <div
                style={{
                  display: "flex",
                  flexFlow: "column wrap",
                  color: "#CCC",
                  marginTop: 20,
                  width: "100%",
                  gap: 10,
                }}
              >
                {Number(health) > 0 ? (
                  <span>Health: {health} / 100</span>
                ) : (
                  <span>You are Dead ☠️</span>
                )}
                <div
                  style={{
                    display: "flex",
                    width: 300,
                    height: 12,
                    background: "#333",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${health}%`,
                      backgroundColor: health
                        ? Number(health) >= 70
                          ? "green"
                          : Number(health) >= 30
                          ? "orange"
                          : "red"
                        : "green",
                    }}
                  />
                </div>
              </div>
            )}

            {exp && (
              <div
                style={{
                  display: "flex",
                  color: "#CCC",
                  flexFlow: "column wrap",
                  width: "100%",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                $EXP: {exp}
                {expPercent && expPercent > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      width: 300,
                      height: 12,
                      background: "#333",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${expPercent}%`,
                        backgroundColor: "#3773F5",
                      }}
                    />
                  </div>
                ) : (
                  ""
                )}
              </div>
            )}
          </div>
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

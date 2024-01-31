export const runtime = "edge"; // Serve on the edge runtime for faster response times
import { ImageResponse } from "next/og";
import {
  BaseQuestLogo,
  calculateCharacterState,
  calculateExpLevels,
} from "@/lib/gameAssets";

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
  console.log("Fetching character state");
  const dataEndpoint = `${process.env.DOMAIN}/api/character?fid=${fid}`;
  const characterState = await fetch(
    new URL(dataEndpoint, import.meta.url)
  ).then((res) => res.json());

  console.log("characterState", characterState);

  if (!characterState) {
    return new Response(null, { status: 404 });
  }

  const { health, exp, level, description } =
    calculateCharacterState(characterState);

  console.log(characterState, health, exp, level, description);
  let expPercent = null;
  if (exp !== undefined && typeof exp === "number" && exp > 0) {
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
        <img src={characterState?.nft.image} width="1024" height="1024" />

        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 20,
            right: 30,
            fontSize: 32,
            color: "#FFF",
            filter: "invert(1) grayscale(1)",
            mixBlendMode: "difference",
          }}
        >
          {description}
        </div>
        {health && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 70,
              right: 30,
              fontSize: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 250,
                position: "absolute",
                bottom: -20,
                right: 0,
                height: 14,
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
            <span
              style={{
                color: "#FFF",
                mixBlendMode: "difference",
                filter: "invert(1) grayscale(1)",
              }}
            >
              {Number(health) > 0 ? (
                <span>Health: {health} / 100</span>
              ) : (
                <span>You are Dead ☠️</span>
              )}
            </span>
          </div>
        )}

        {exp && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 60,
              right: 30,
              fontSize: 24,
              color: "transparent",
            }}
          >
            <span
              style={{
                color: "#FFF",
                mixBlendMode: "difference",
                filter: "invert(1) grayscale(1)",
              }}
            >
              $EXP: {exp}
            </span>
            {expPercent && expPercent > 0 ? (
              <div
                style={{
                  display: "flex",
                  width: 200,
                  position: "absolute",
                  bottom: -20,
                  right: 0,
                  height: 10,
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

        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 20,
            left: 20,
            background: "#3773F5",
            border: "3px solid #FFF",
            width: 320,
            height: 80,
          }}
        >
          <BaseQuestLogo top={15} />
        </div>
      </div>
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

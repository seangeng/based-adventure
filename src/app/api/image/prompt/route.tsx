export const runtime = "edge";
import { ImageResponse } from "next/og";
import { BaseQuestLogo, calculateExpLevels } from "@/lib/gameAssets";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const { searchParams } = new URL(request.url);
  const hasText = searchParams.has("text");
  const text = hasText ? searchParams.get("text") : "No text...";

  const hasSubtext = searchParams.has("subtext");
  const subtext = hasSubtext ? searchParams.get("subtext") : "";

  const hasCharacter = searchParams.has("character");
  const character = hasCharacter ? searchParams.get("character") : "";

  const hasImage = searchParams.has("image");
  const image = hasImage ? searchParams.get("image") : "";

  const hasSetting = searchParams.has("s") && searchParams.get("si");
  const settingName = hasSetting ? searchParams.get("s") : "";
  const settingImage = hasSetting ? searchParams.get("si")?.trim() : "";

  // Optional params (health and exp)
  const expChange = searchParams.get("expChange") ?? null;
  const exp = searchParams.get("exp") ?? null;
  const healthChange = searchParams.get("healthChange") ?? null;
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
          textShadow: "0 0 5px black",
        }}
      >
        {hasSetting && settingName != "" ? (
          <div
            style={{
              fontSize: 18,
              color: "#3773F5",
              display: "flex",
              position: "absolute",
              top: 64,
              left: 67,
            }}
          >
            {settingName}
          </div>
        ) : (
          ""
        )}
        {hasSetting && settingImage != "" ? (
          <img
            width="1200"
            height="630"
            // @ts-ignore
            src={`${process.env.DOMAIN}/${settingImage}.webp`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: -1,
              opacity: 0.2,
              boxShadow:
                "0 0 20px 80px rgba(0,0,0,0.7) inset, 0 0 20px 20px rgba(0,0,0,0.7) inset",
              objectFit: "cover",
            }}
          />
        ) : (
          ""
        )}
        <div
          style={{
            display: "flex",
            flexFlow: "row wrap",
            justifyContent: "center",
            gap: 0,
            wordBreak: "break-word",
            textShadow: "2px 0 3px black",
          }}
        >
          <p>{text}</p>
          {hasText && hasSubtext && (
            <p
              style={{
                fontSize: 32,
                color: "#3773F5",
              }}
            >
              {subtext}
            </p>
          )}
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
          {character}
        </div>
        {health && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 60,
              right: 30,
              fontSize: 18,
              color: "#CCC",
            }}
          >
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
            {Number(health) > 0 ? (
              <span>
                {`Health`}
                {healthChange && (
                  <span
                    style={{
                      color: Number(healthChange) > 0 ? "green" : "red",
                      marginLeft: 4,
                    }}
                  >
                    ({Number(healthChange) > 0 ? "+" : ""}
                    {healthChange})
                  </span>
                )}
                : {health} / 100
              </span>
            ) : (
              <span>You are Dead ☠️</span>
            )}
          </div>
        )}

        {exp && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 100,
              right: 30,
              fontSize: 18,
              color: "#CCC",
            }}
          >
            $EXP: {exp}
            {expChange && (
              <span
                style={{
                  color: "green",
                  marginLeft: 10,
                }}
              >
                +{expChange}
              </span>
            )}
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

        {hasImage && (
          <img
            width="128"
            height="128"
            // @ts-ignore
            src={image}
            style={{
              position: "absolute",
              bottom: 30,
              left: 30,
              border: "5px solid #222",
            }}
          />
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

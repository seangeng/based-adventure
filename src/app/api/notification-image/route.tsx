export const runtime = "edge";
import { ImageResponse } from "next/og";
import { BaseQuestLogo, calculateExpLevels } from "@/lib/gameAssets";

export async function GET(request: Request) {
  // Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL("../../../../assets/Silkscreen-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const imageData = await fetch(
    new URL("../../../../public/notification-icon.png", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  const image = searchParams.get("image");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 30,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "40px 100px",
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
            textWrap: "wrap",
            background: "#3a362e",
            border: "10px solid #d8ac5b",
            wordBreak: "break-word",
            gap: 0,
            marginTop: image ? 200 : 0,
          }}
        >
          {image && (
            <img
              width="256"
              height="256"
              // @ts-ignore
              src={image}
              style={{
                borderRadius: 500,
                position: "absolute",
                top: -230,
                left: "50%",
                marginLeft: -128,
                border: "10px solid #222",
              }}
            />
          )}
          <img
            width="100"
            height="100"
            // @ts-ignore
            src={imageData}
            style={{
              position: "absolute",
              top: -60,
              right: -50,
              objectFit: "contain",
            }}
          />
          <p
            style={{
              padding: "10px 20px",
            }}
          >
            {text}
          </p>
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
        ></div>
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

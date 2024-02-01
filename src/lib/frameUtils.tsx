import { NextRequest } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient(process.env.FARCASTER_HUB || "");

export function buildFrameMetaHTML({
  title,
  image,
  post_url,
  buttons,
}: {
  title: string;
  image: string;
  post_url: string;
  buttons: string[];
}) {
  // Build buttons meta
  let buttonsMeta = "";
  const redirects = [] as string[];
  buttons.forEach((button, index) => {
    // If button contains |, it means it's a redirect button
    const redirect = button.split("|");
    console.log("redirect button", redirect);

    if (redirect.length == 2) {
      // If it's a redirect button, add the redirect to the list
      redirects.push(redirect[1]);
      // Add the button meta with the redirect
      buttonsMeta += `<meta name="fc:frame:button:${
        index + 1
      }:post_redirect" content="${redirect[0]}">`;
    } else {
      // If it's not a redirect button, add the regular button meta
      buttonsMeta += `<meta name="fc:frame:button:${
        index + 1
      }" content="${button}">`;
    }
  });

  return `<!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta property="og:title" content="${title}">
            <meta property="og:image" content="${process.env.DOMAIN}/${image}">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${
              process.env.DOMAIN
            }/${image}">
            <meta name="fc:frame:post_url" content="${
              process.env.DOMAIN
            }/${post_url}${
    redirects.length > 0
      ? `&redirects=${encodeURIComponent(redirects.join(","))}`
      : ""
  }">
            ${buttonsMeta}
        </head>
        <body>
            <p>${title}</p>
        </body>
        </html>`;
}

interface frameData {
  fid: number;
  buttonIndex: number;
}

export async function getFrameData(
  req: NextRequest
): Promise<frameData | undefined> {
  let validatedMessage: Message | undefined = undefined;
  try {
    // Retrieve & validate the frame data from the request body
    const body = await req.json();
    if (body) {
      const frameMessage = Message.decode(
        Buffer.from(body?.trustedData?.messageBytes || "", "hex")
      );
      const result = await client.validateMessage(frameMessage);
      if (result.isOk() && result.value.valid && result.value.message) {
        validatedMessage = result.value.message;
      }

      const buttonIndex =
        body?.trustedData?.buttonIndex - 1 ||
        body?.untrustedData.buttonIndex - 1 || // This is used for testing
        0;
      // Button index is 1-indexed, but we want it to be 0-indexed

      return {
        fid: validatedMessage?.data?.fid ?? 0,
        buttonIndex: buttonIndex,
      } as frameData;
    }
  } catch (err) {
    console.error(err);
  }

  return;
}

export async function getFarcasterId(req: NextRequest): Promise<number> {
  let validatedMessage: Message | undefined = undefined;
  let fid = 0;
  try {
    // Retrieve & validate the frame data from the request body
    const body = await req.json();
    if (body) {
      console.log("body", body);

      const frameMessage = Message.decode(
        Buffer.from(body?.trustedData?.messageBytes || "", "hex")
      );
      const result = await client.validateMessage(frameMessage);
      if (result.isOk() && result.value.valid && result.value.message) {
        validatedMessage = result.value.message;
      }

      console.log("validatedMessage", validatedMessage);

      return validatedMessage?.data?.fid as number;
    }
  } catch (err) {
    console.error(err);
  }

  return fid;
}

import { getFrameMetadata } from "@coinbase/onchainkit";
import type { Metadata } from "next";

const frameMetadata = getFrameMetadata({
  buttons: ["Start your Adventure!"],
  image: `https://${process.env.VERCEL_URL}/base-quest-start.jpg`,
  post_url: "https://eo6m4ikat6vrxtj.m.pipedream.net",
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  other: {
    ...frameMetadata,
  },
};

export default function StartScreen() {
  const title = "Base Quest - Start your Adventure!";

  return title;
}

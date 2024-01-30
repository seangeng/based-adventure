import { getFrameMetadata } from "@coinbase/onchainkit";
import type { Metadata } from "next";
import { exampleWarpcastLink } from "@/lib/constants";

const frameMetadata = getFrameMetadata({
  buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
  image: `${process.env.DOMAIN}/api/splash-image`,
  post_url: `${process.env.DOMAIN}/api/menu?buttons=${encodeURIComponent(
    "start,leaderboard" // Buttons should be passed to the menu router
  )}`,
});

export const metadata: Metadata = {
  title: "Base Quest - Start your Adventure!",
  description: "AI Powered Text Adventure on Base L2",
  openGraph: {
    title: "Base Quest - Start your Adventure!",
    description: "AI Powered Text Adventure on Base L2",
    images: [`${process.env.DOMAIN}/api/splash-image`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <a href={exampleWarpcastLink} className="w-2/3">
        <img src="/api/splash-image" className="w-full" />
      </a>
      <p className="mt-8 text-gray-500 w-1/2 text-center">
        Base Quest is an interactive Frames based text adventure game. It can
        only be accessed through Warpcast & clients that support Frames.
      </p>
      <a
        href={exampleWarpcastLink}
        className="mt-8 bg-blue-500 p-4 text-white px-6 rounded-md"
      >
        Play Base Quest
      </a>
    </div>
  );
}

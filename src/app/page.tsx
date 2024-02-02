import { getFrameMetadata } from "@coinbase/onchainkit";
import type { Metadata, ResolvingMetadata } from "next";
import { exampleWarpcastLink } from "@/lib/constants";
import SearchComponent from "@/components/search";
import { db } from "@/lib/dependencies";

export async function generateMetadata(): Promise<Metadata> {
  // Fetchs some basic stats to pass to metadata
  const playersCount = await db.collection("characters").countDocuments();

  const frameMetadata = getFrameMetadata({
    buttons: ["Start your Adventure! ▶️", "Leaderboard 🏆"],
    image: `${process.env.DOMAIN}/api/image/splash?charactersCount=${playersCount}`,
    post_url: `${process.env.DOMAIN}/api/menu?buttons=${encodeURIComponent(
      "start,leaderboard" // Buttons should be passed to the menu router
    )}`,
  });

  return {
    title: "Base Quest - Start your Adventure!",
    description: "AI Powered Text Adventure on Base L2",
    openGraph: {
      title: "Base Quest - Start your Adventure!",
      description: "AI Powered Text Adventure on Base L2",
      images: [`${process.env.DOMAIN}/api/image/splash`],
    },
    other: {
      ...frameMetadata,
    },
  };
}

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 h-full w-full max-sm:p-6">
      <div className="absolute -z-10 bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <a href={exampleWarpcastLink} className="w-2/3 max-sm:w-full">
        <img
          src="/api/image/splash"
          className="w-full border-2 border-gray-600 rounded-md shadow"
        />
      </a>
      <div className="flex max-sm:flex-col w-2/3 max-sm:w-full mt-8 align-middle items-center gap-4">
        <p className="text-gray-400 my-4">
          {`Base Quest is an interactive Frames based text adventure game. It can
          only be accessed through Warpcast & clients that support Frames.`}
        </p>
        <div className="w-auto">
          <a
            href={exampleWarpcastLink}
            className="mt-8 bg-blue-500 p-4 text-white px-6 rounded-md whitespace-nowrap"
          >
            {`🎮 Play Base Quest`}
          </a>
        </div>
      </div>
      <div className="w-2/3 max-sm:w-full my-8 text-center gap-4 ">
        <hr className="w-full border-gray-600 my-8" />
        <p className="text-gray-400 my-4">{`Already have a Base Quest account?`}</p>
        <SearchComponent />
        <hr className="w-full border-gray-600 my-8" />
        <p className="my-20 ">
          <a
            href="https://testnets.opensea.io/0x5a167edeBb4535fe8C90E58D99c94d03c0CBe6ba"
            className=" bg-blue-500 p-4 text-white px-6 rounded-md whitespace-nowrap"
          >
            Discover the NFTs of Base Quest
          </a>
        </p>
      </div>
    </div>
  );
}

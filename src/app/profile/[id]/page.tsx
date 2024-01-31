import type { Metadata, ResolvingMetadata } from "next";
import { getFrameMetadata } from "@coinbase/onchainkit";
import { db, getUserRankByFid } from "@/lib/dependencies";
import CopyPasteInput from "@/components/CopyPasteInput";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id;

  // fetch data
  const characterState = await db
    .collection("characters")
    .findOne({ $or: [{ fid: parseInt(id) }, { "user.username": id }] });

  // Get the rank
  const userRank = await getUserRankByFid(characterState?.fid);

  const profileTitle = `${characterState?.user?.username} • Level ${
    characterState?.level ?? 1
  } • ${characterState?.class ?? "Adventurer"} - Base Quest`;

  const imageParams = `name=${
    characterState?.user?.username
  }&image=${encodeURIComponent(characterState?.nft?.thumbnail)}&turns=${
    characterState?.turns
  }&rank=${userRank}&exp=${characterState?.exp}&health=${
    characterState?.health
  }`;

  const frameMetadata = getFrameMetadata({
    buttons: ["Add to party 🤝", "Fight 🤺", "Heal ❤️‍🩹", "Boost 🔼"],
    image: `${process.env.DOMAIN}/api/image/profile?${imageParams}`,
    post_url: `${process.env.DOMAIN}/api/profile`,
  });

  return {
    title: profileTitle,
    description: "AI Powered Text Adventure on Base L2",
    openGraph: {
      title: profileTitle,
      description: "AI Powered Text Adventure on Base L2",
      images: [`${process.env.DOMAIN}/api/image/profile?${imageParams}`],
    },
    other: {
      ...frameMetadata,
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  // fetch data
  const characterState = await db.collection("characters").findOne({
    $or: [{ fid: parseInt(params.id) }, { "user.username": params.id }],
  });

  // Get the rank
  const userRank = await getUserRankByFid(characterState?.fid);

  const imageParams = `name=${
    characterState?.user?.username
  }&image=${encodeURIComponent(characterState?.nft?.thumbnail)}&turns=${
    characterState?.turns
  }&rank=${userRank}&exp=${characterState?.exp}&health=${
    characterState?.health
  }`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 h-full w-full max-sm:p-6">
      <div className="absolute bottom-0 -z-10 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="flex flex-col gap-8 items-center w-2/3 max-sm:w-full">
        <div className="w-full min-w-[256px]">
          <div className="relative">
            <img
              src={`/api/image/profile?${imageParams}`}
              width={1200}
              height={630}
              className="w-full border-2 border-gray-600 shadow z-10"
            />
            <div className="block absolute -top-2 -right-2 bg-slate-500 w-6 h-6 -z-10">
              <div className="block absolute top-1 right-1 w-5 h-5 bg-black"></div>
            </div>
            <div className="block absolute -bottom-2 -left-2 bg-slate-500 w-6 h-6 -z-10">
              <div className="block absolute bottom-1 left-1 w-5 h-5 bg-black"></div>
            </div>
            <div className="block absolute -bottom-2 -right-2 bg-slate-500 w-6 h-6 -z-10">
              <div className="block absolute bottom-1 right-1 w-5 h-5 bg-black"></div>
            </div>
            <div className="block absolute -top-2 -left-2 bg-slate-500 w-6 h-6 -z-10">
              <div className="block absolute top-1 left-1 w-5 h-5 bg-black"></div>
            </div>
          </div>
        </div>
        <div className="w-2/3 text-center">
          <p className="text-lg text-gray-500">
            Post this URL as a Frame on Warpcast to interact with this profile:
          </p>
          <CopyPasteInput
            value={`${process.env.DOMAIN}/profile/${params.id}`}
          />
        </div>
      </div>
    </div>
  );
}

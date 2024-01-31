import type { Metadata, ResolvingMetadata } from "next";
import { getFrameMetadata } from "@coinbase/onchainkit";
import { db } from "@/lib/dependencies";

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

  const frameMetadata = getFrameMetadata({
    buttons: ["Add to party 🤝", "Fight 🤺", "Heal ❤️‍🩹", "Boost 🔼"],
    image: `${process.env.DOMAIN}/api/profile-image?fid=${id}`,
    post_url: `${process.env.DOMAIN}/api/profile`,
  });

  // fetch data
  const characterState = await db
    .collection("characters")
    .findOne({ $or: [{ fid: parseInt(id) }, { "user.username": id }] });

  const profileTitle = `${characterState?.user?.username} • Level ${
    characterState?.level ?? 1
  } • ${characterState?.class ?? "Adventurer"} - Base Quest`;

  return {
    title: profileTitle,
    description: "AI Powered Text Adventure on Base L2",
    openGraph: {
      title: profileTitle,
      description: "AI Powered Text Adventure on Base L2",
      images: [`${process.env.DOMAIN}/api/profile-image?fid=${id}`],
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 h-full w-full max-sm:p-6">
      <div className="absolute bottom-0 -z-10 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="flex gap-8 items-center w-2/3 max-sm:w-full">
        <div className="w-1/3 max-sm:w-full min-w-[256px]">
          <div className="relative">
            <img
              src={
                characterState?.nft.thumbnail ?? characterState?.user.pfp_url
              }
              width={256}
              height={256}
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
        <div className="w-2/3 max-sm:w-full">
          <h1 className="text-3xl font-semibold text-white mb-5">
            {characterState?.user.username}
          </h1>
          <p className="text-white">
            {characterState?.class} • Level {characterState?.level}
          </p>
          <input
            type="text"
            readOnly
            value={`${process.env.DOMAIN}/profile/${params.id}`}
            className="min-w-0 my-5 w-full flex-auto rounded-md border-0 bg-white/5 px-6 py-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-md sm:leading-6"
          />
        </div>
      </div>
    </div>
  );
}

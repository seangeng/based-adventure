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
  const characterState = await db.collection("characters").findOne({ fid: id });

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

export default function Page({ params, searchParams }: Props) {}

import type { Metadata, ResolvingMetadata } from "next";
import { getFrameMetadata } from "@coinbase/onchainkit";
import { db, getUserRankByFid } from "@/lib/dependencies";
import CopyPasteInput from "@/components/CopyPasteInput";
import { calculateCharacterState } from "@/lib/gameAssets";
import ProfileButtons from "@/components/ProfileButtons";
import ogs from "open-graph-scraper";

function truncateHash(hash: string): string {
  if (hash.length <= 12) {
    return hash;
  }

  const start = hash.substring(0, 6);
  const end = hash.substring(hash.length - 6);
  return `${start}...${end}`;
}

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

interface NFTData {
  fid: number;
  contractAddress: string;
  contractHash: string;
}

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

  const { description, exp } = calculateCharacterState({
    class: characterState?.class,
    exp: characterState?.exp ?? 0,
    health: characterState?.health ?? 100,
  });

  const profileTitle = `${characterState?.user?.username} • Level ${
    characterState?.level ?? 1
  } • ${characterState?.class ?? "Adventurer"} - Base Quest`;

  const imageParams = `name=${
    characterState?.user?.username
  }&image=${encodeURIComponent(
    characterState?.nft?.thumbnail
  )}&character=${encodeURIComponent(description)}&turns=${
    characterState?.turns
  }&rank=${userRank}&exp=${exp ?? 0}&health=${characterState?.health ?? 100}`;

  const buttons = ["Add to party 🤝"];
  const buttonMap = ["add-to-party"];
  if (characterState?.health < 100) {
    buttons.push("Heal ❤️‍🩹 (+10 HP)");
    buttonMap.push("heal");
  }
  if (characterState?.health > 0) {
    buttons.push("Fight 🤺");
    buttonMap.push("fight");
  }
  buttons.push("Boost 🔼 (+10 EXP)");
  buttonMap.push("boost");

  const frameMetadata = getFrameMetadata({
    buttons: buttons,
    image: `${process.env.DOMAIN}/api/image/profile?${imageParams}`,
    post_url: `${process.env.DOMAIN}/api/profile?fid=${
      characterState?.fid
    }&buttons=${encodeURIComponent(buttonMap.join(","))}`,
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

  if (!characterState) {
    // Return 404
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2 h-full w-full max-sm:p-6">
        <h1 className="text-4xl text-gray-500">Character not found</h1>
      </div>
    );
  }

  // Get the rank
  const userRank = await getUserRankByFid(characterState?.fid);

  const { description } = calculateCharacterState({
    class: characterState?.class,
    exp: characterState?.exp ?? 0,
    health: characterState?.health ?? 100,
  });

  const buttons = ["Add to party 🤝"];
  const buttonMap = ["add-to-party"];
  if (characterState?.health < 100) {
    buttons.push("Heal ❤️‍🩹 (+10 HP)");
    buttonMap.push("heal");
  }
  if (characterState?.health > 0) {
    buttons.push("Fight 🤺");
    buttonMap.push("fight");
  }
  buttons.push("Boost 🔼 (+10 EXP)");
  buttonMap.push("boost");

  const imageParams = `name=${
    characterState?.user?.username
  }&image=${encodeURIComponent(
    characterState?.nft?.thumbnail
  )}&character=${encodeURIComponent(description)}&turns=${
    characterState?.turns
  }&rank=${userRank}&exp=${characterState?.exp ?? 0}&health=${
    characterState?.health ?? 100
  }`;

  // Load the NFT
  let nft = false as NFTData | false;
  if (characterState?.fid) {
    nft = (await db.collection("nfts").findOne({
      fid: characterState?.fid,
    })) as unknown as NFTData;
  }

  const userWalletAddress =
    characterState?.user?.verifications[0] ??
    characterState?.user?.custody_address;

  let nftImage = `${process.env.DOMAIN}/api/nft?fid=${characterState?.fid}`;
  let marketplaceUrl = "";
  if (nft && nft?.contractAddress) {
    marketplaceUrl = `https://testnets.opensea.io/assets/base-sepolia/${nft.contractAddress}/1`;

    const { result } = await ogs({
      url: marketplaceUrl,
    });

    // If has OG image and doesn't contain og-images/Metadata-Image.png
    if (
      result.ogImage &&
      result.ogImage[0].url &&
      !result.ogImage[0].url.includes("og-images/Metadata-Image.png")
    ) {
      nftImage = result.ogImage[0].url;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 h-full w-full max-sm:p-6">
      <div className="absolute bottom-0 -z-10 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="flex flex-col gap-8 items-center w-2/3 max-sm:w-full">
        <div className="w-2/3 max-sm:w-full text-center">
          <p className="text-lg text-gray-500">
            {`Post this URL as a Frame on Warpcast for others to interact with this profile:`}
          </p>
          <CopyPasteInput
            value={`${process.env.DOMAIN}/profile/${params.id}`}
          />
          <ProfileButtons buttons={buttons} />
        </div>
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
        {nft && (
          <div className="w-full text-center flex flex-col gap-5 mb-10">
            <p className="text-gray-500">
              Onchain data on{" "}
              <a
                href="https://base.org"
                target="_blank"
                className=" text-blue-600"
              >
                Base
              </a>{" "}
              {`for ${characterState?.user?.username}'s character:`}
            </p>

            {nftImage != "" && (
              <div className="flex flex-col gap-4 border border-slate-700 p-5 items-center w-1/2 mx-auto">
                <p className="text-gray-500">Character NFT</p>
                <a href={marketplaceUrl} target="_blank">
                  <img
                    src={nftImage}
                    className="w-full border-2 border-slate-800"
                  />
                </a>
                <a
                  href={marketplaceUrl}
                  target="_blank"
                  className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 w-full font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  View NFT
                </a>
              </div>
            )}

            <a
              href={`https://sepolia.basescan.org/address/${nft.contractAddress}`}
              target="_blank"
            >
              NFT Contract Address:{" "}
              <span className="text-blue-500 p-1 px-2 rounded bg-slate-800">
                {truncateHash(nft.contractAddress)}
              </span>
            </a>
            <a
              href={`https://sepolia.basescan.org/tx/${nft.contractHash}`}
              target="_blank"
            >
              Minting Transaction:{" "}
              <span className="text-blue-500 p-1 px-2 rounded bg-slate-800">
                {truncateHash(nft.contractHash)}
              </span>
            </a>
            <a
              href={`https://sepolia.basescan.org/address/${userWalletAddress}`}
              target="_blank"
            >
              Minted to:{" "}
              <span className="text-blue-500 p-1 px-2 rounded bg-slate-800">
                {truncateHash(userWalletAddress)}
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

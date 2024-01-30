import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { db, openai } from "@/lib/dependencies";
import { ethers } from "ethers";
import InstaMintContract from "../app/assets/contracts/InstaMint.json";
import InstaMintFactory from "../app/assets/contracts/InstaMintFactory.json";
import { getFarcasterUsersFromFID } from "@/lib/farcasterUtils";
import { default as axios } from "axios";
import FormData from "form-data";
import { put } from "@vercel/blob";
import { JsonRpcProvider } from "ethers";

async function mint(contractAddress: string, userWalletAddress: string) {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new NonRetriableError("No key");
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);

  const mintContract = new ethers.Contract(
    contractAddress,
    InstaMintContract.abi,
    signer
  );
  const reponse = await mintContract.mint(userWalletAddress, 1);
  return reponse.hash;
}

async function getNewContractAddress(
  txHash: string,
  provider: JsonRpcProvider
) {
  const receipt = await provider.getTransactionReceipt(txHash);
  const newMintCreatedABI = [
    "event NewMintCreated(address indexed contractAddress)",
  ];
  const iface = new ethers.Interface(newMintCreatedABI);

  if (!receipt?.logs) {
    throw new Error("No logs found");
  }

  // Loop through the logs to find the new contract address
  for (const log of receipt.logs) {
    const logdata = iface.parseLog({
      topics: Array.from(log.topics),
      data: log.data,
    });
    console.log("Log data", logdata);
    if (logdata?.name == "NewMintCreated") {
      return logdata?.args?.contractAddress;
    }
  }
}

export const createCharacterNFT = inngest.createFunction(
  { id: "createCharacterNFT" },
  { event: "createCharacterNFT" },
  async ({ event, step }) => {
    if (!event.data.fid) {
      // A FID is required to create an NFT
      throw new NonRetriableError("Missing or invalid parameters");
    }

    // Fetch the database state
    const { character, nft, userWalletAddress } = await step.run(
      "Fetching Character",
      async () => {
        // Check to make sure an NFT has not been created for this FID
        const characterData = await db.collection("characters").findOne({
          fid: event.data.fid,
        });

        if (!characterData) {
          throw new NonRetriableError("No character found");
        }

        const nft = await db.collection("nfts").findOne({
          fid: event.data.fid,
        });

        if (characterData?.nft?.tx || nft?.txnHash) {
          throw new NonRetriableError("NFT already created");
        }

        if (!characterData?.user) {
          const users = await getFarcasterUsersFromFID(event.data.fid);

          if (users[event.data.fid]) {
            // Update the character with the user data
            db.collection("characters").updateOne(
              { fid: event.data.fid },
              {
                $set: {
                  user: users[event.data.fid],
                },
              }
            );
          }

          characterData.user = users[event.data.fid];
        }

        // Make sure user has a verifications address
        const userWalletAddress =
          characterData?.user?.verifications[0] ??
          characterData?.user?.custody_address;
        if (!userWalletAddress) {
          throw new NonRetriableError("No user wallet address");
        }

        return {
          character: characterData,
          nft,
          userWalletAddress,
        };
      }
    );

    // Generate an AI image
    let image = null;
    if (character?.nft?.image) {
      image = character.nft.image;
    } else {
      image = await step.run("Generating NFT Avatar", async () => {
        // If the user has a PFP, use that to generate the NFT
        let pfpDescription = "";
        if (character?.user?.pfp_url && character?.user?.pfp_url !== "") {
          const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Describe this picture in detail (up to 255 characters)",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: character.user.pfp_url,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
            temperature: 0.5,
          });

          if (
            response.choices[0] &&
            response.choices[0].finish_reason == "stop" &&
            response.choices[0].message?.content
          ) {
            pfpDescription = response.choices[0].message.content;
          }
        }

        // Generate a new image using Dall-E 3
        const prompt = `An pixel art style ${character?.class} game character icon, ${pfpDescription}`;
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });

        if (!response.data[0]?.url) {
          throw new Error("No image generated");
        }

        // Get the image buffer
        const imageResponse = await axios.get(response.data[0].url, {
          responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Upload the image to Vercel
        const { url } = await put(
          `${event.data.fid}-${event.id}.png`,
          imageBuffer,
          {
            contentType: "image/png",
            access: "public",
          }
        );

        // Update the character with the pre-transformed image
        await db.collection("characters").updateOne(
          { fid: event.data.fid },
          {
            $set: {
              "nft.image": url,
            },
          }
        );

        return url;
      });
    }

    // Create the NFT
    const factoryContractAddress = process.env.NFT_FACTORY_CONTRACT;
    if (!factoryContractAddress) {
      // Required
      throw new NonRetriableError("No factory contract address");
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey || !process.env.RPC_URL) {
      // Required
      throw new NonRetriableError("No key");
    }
    // Initalize the background wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider);

    let nftContractHash = nft?.contractHash;
    if (!nft?.contractHash) {
      nftContractHash = await step.run(
        "Deploying Open Edition 721 Instamint NFT Contract",
        async () => {
          const factory = new ethers.Contract(
            factoryContractAddress,
            InstaMintFactory.abi,
            signer
          );

          console.log("Creating new contract...");

          const createContractTx = await factory.createNewMint(
            wallet.address,
            `${character?.user?.username ?? "Base Quest"} - ${
              character?.class ?? "Character"
            }`, // Name
            `${
              character?.user?.username ?? event.data.fid
            }'s character on Base Quest - an AI powered Farcaster Frames game.  Visit basequest.ai to learn more.`, // Description
            "BASEQUEST", // Symbol
            `https://basequest.ai/api/nft?fid=${event.data.fid}`, // Image URL
            0, // Cost
            1 // Quantity
          );

          if (!createContractTx.hash) {
            throw new Error("No TXN hash");
          }

          console.log("Contract created", createContractTx.hash);

          // Update database
          await db.collection("nfts").updateOne(
            { fid: event.data.fid },
            {
              $set: {
                contractHash: createContractTx.hash,
              },
            },
            { upsert: true }
          );

          return createContractTx.hash;
        }
      );

      // Wait for 15 seconds
      await step.sleep("wait-for-contract", "15s");
    }

    let nftContract = nft?.contractAddress;
    if (!nft?.contractAddress) {
      nftContract = await step.run("Getting NFT Contract Address", async () => {
        // Determine the new contract address of the NFT contract
        const contractAddress = await getNewContractAddress(
          nftContractHash,
          provider
        );

        console.log("Contract address", contractAddress);

        // Update database
        await db.collection("nfts").updateOne(
          { fid: event.data.fid },
          {
            $set: {
              contractAddress,
            },
          },
          { upsert: true }
        );

        return contractAddress;
      });
    }

    // Update the database with a notification state
    await db.collection("characters").updateOne(
      { fid: event.data.fid },
      {
        $set: {
          notification: {
            type: "nft",
            message: `Your character NFT has been minted to: ${userWalletAddress}`,
            txn: nftContractHash,
            post_url: "api/prompt",
            buttons: [`Got it!  TX: ` + nftContractHash],
          },
        },
      }
    );

    // Log the final output
    return {
      image,
      contract: nftContract,
      contractHash: nftContractHash,
    };
  }
);

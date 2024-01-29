import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { db } from "@/lib/dependencies";
import { ethers } from "ethers";
import InstaMintContract from "../app/assets/contracts/InstaMint.json";
import InstaMintFactory from "../app/assets/contracts/InstaMintFactory.json";

async function mint(to: string) {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new NonRetriableError("No key");
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);

  const mintContract = new ethers.Contract(
    "0xaf57ec2cf1d60e8a26aad46593598879b593327e", // Temp
    InstaMintContract.abi,
    signer
  );
  const reponse = await mintContract.mint(to, 1);
  return reponse.hash;
}

export const createCharacterNFT = inngest.createFunction(
  { id: "createCharacterNFT" },
  { event: "createCharacterNFT" },
  async ({ event, step }) => {
    if (!event.data.fid) {
      // A FID is required to create an NFT
      throw new NonRetriableError("Missing or invalid parameters");
    }

    const factoryContractAddress = process.env.NFT_FACTORY_CONTRACT;
    if (!factoryContractAddress) {
      throw new NonRetriableError("No factory contract address");
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new NonRetriableError("No key");
    }
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider);

    const createNFTContract = await step.run(
      "Deploying Open Edition 721 Instamint NFT Contract",
      async () => {
        const factory = new ethers.Contract(
          factoryContractAddress,
          InstaMintFactory.abi,
          signer
        );
        const creatContractTx = await factory.createNewMint(
          wallet.address,
          "My custom NFT Contract",
          "Awesome NFT description",
          "BASEQUEST",
          `https://basequest.ai/api/nft?fid=${event.data.fid}`,
          1,
          1
        );

        return creatContractTx;
      }
    );

    const hash = await step.run(
      `Minting an NFT for ${event.data.fid}`,
      async () => {
        const txnHash = await mint(event.data.fid);

        return txnHash;
      }
    );

    return hash;
  }
);

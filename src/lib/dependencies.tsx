import { MongoClient } from "mongodb";
export const mongoClient = new MongoClient(process.env.MONGODB_URI as string);
export const db = mongoClient.db("basequest");

import OpenAI from "openai";
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { ethers } from "ethers";
import InstaMintContract from "../app/assets/contracts/InstaMint.json";

export function parseJSON(json: string): any {
  try {
    const jsonStart = json.indexOf("{");
    const jsonEnd = json.lastIndexOf("}");
    const jsonString = json.substring(jsonStart, jsonEnd + 1);
    const json_obj = JSON.parse(jsonString);

    return json_obj;
  } catch (error) {
    const jsonStart = json.indexOf("{");
    const jsonEnd = json.lastIndexOf("}");
    const jsonString = json.substring(jsonStart, jsonEnd + 1);

    throw new Error("Error parsing JSON: " + jsonString);
  }
}

export async function getUserRankByFid(fid: number) {
  const usersSortedByLevel = await db
    .collection("characters")
    .find(
      {
        level: { $gt: 0 },
      },
      {
        sort: { exp: -1, level: -1, turns: 1 },
        projection: { _id: 0, fid: 1 },
      }
    )
    .toArray();

  // Find the index of the user with the given fid in the sorted array
  return usersSortedByLevel.findIndex((user) => user.fid === fid) + 1 || 0;
}

export async function mint(
  contractAddress: string,
  userWalletAddress: string
): Promise<string> {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No wallet private key found");
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

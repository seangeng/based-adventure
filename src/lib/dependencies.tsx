import { MongoClient } from "mongodb";
export const mongoClient = new MongoClient(process.env.MONGODB_URI as string);
export const db = mongoClient.db("basequest");

import OpenAI from "openai";
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

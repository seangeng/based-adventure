const { MongoClient } = require("mongodb");
export const mongoClient = new MongoClient(process.env.MONGODB_URI);
export const db = mongoClient.db("basequest");

const mongoose = require("mongoose");

const DB_NAME = process.env.MONGODB_DB_NAME || "Grand_Wiki";

async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected to database: ${DB_NAME}`);
  return mongoose.connection;
}

module.exports = { connectDatabase, DB_NAME };

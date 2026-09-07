const mongoose = require("mongoose");

const INTERNAL_AFFAIRS_DB_NAME = "Internal_Affairs";
let connectionPromise;

/**
 * Internal Affairs is deliberately isolated from the public Grand Wiki data.
 * `dbName` wins over the database name that may be present in MONGO_URI.
 */
function connectInternalAffairsDatabase() {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGO_URI is not defined in environment variables."));
  }

  const connection = mongoose.createConnection(uri, {
    dbName: INTERNAL_AFFAIRS_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  connectionPromise = connection.asPromise().then((readyConnection) => {
    console.log(`MongoDB connected to Internal Affairs database: ${INTERNAL_AFFAIRS_DB_NAME}`);
    return readyConnection;
  });

  return connectionPromise;
}

module.exports = { connectInternalAffairsDatabase, INTERNAL_AFFAIRS_DB_NAME };

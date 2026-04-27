const { CosmosClient } = require("@azure/cosmos");

let client;
let database;
let usersContainer;
let resultsContainer;

function initializeCosmos() {
  if (client) return;

  const endpoint = process.env.COSMOS_URI;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.DATABASE_NAME || "resumeDB";

  if (!endpoint || !key) {
    throw new Error("COSMOS_URI and COSMOS_KEY must be provided.");
  }

  client = new CosmosClient({ endpoint, key });
  database = client.database(databaseId);

  usersContainer = database.container("users");
  resultsContainer = database.container("results");

  console.log("[Cosmos] Initialized successfully");
}

function getUsersContainer() {
  if (!usersContainer) {
    throw new Error("Cosmos DB not initialized. Call initializeCosmos() first.");
  }
  return usersContainer;
}

function getResultsContainer() {
  if (!resultsContainer) {
    throw new Error("Cosmos DB not initialized. Call initializeCosmos() first.");
  }
  return resultsContainer;
}

module.exports = {
  initializeCosmos,
  getUsersContainer,
  getResultsContainer
};

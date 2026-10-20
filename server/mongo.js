const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
  serverSelectionTimeoutMS: 5000,
});
const dbName = process.env.MONGODB_DB || 'ai_class';

let connection;

// Connect once and reuse the same client for every request.
function getMongoDb() {
  if (!connection) {
    connection = client.connect().catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection.then((connectedClient) => connectedClient.db(dbName));
}

module.exports = { getMongoDb, mongoClient: client };

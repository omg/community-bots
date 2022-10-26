const { MongoClient } = require('mongodb');

// Connection URL
const url = process.env.MONGO_URL;
const client = new MongoClient(url);

let db;

// Database Name
const dbName = 'lame';

// async function getDatabase() {
//   if (db) return db;
//   await client.connect();
//   console.log('Connected successfully to server');
//   db = client.db(dbName);
//   return db;
// }

let defaultGameID;
async function getDefaultGameID() {
  if (defaultGameID) return defaultGameID;
  defaultGameID = (await client.db(dbName).collection('games').find({}).limit(1).toArray())[0]._id;
  return defaultGameID;
}

let allTimeLeaderboardID;
async function getAllTimeLeaderboardID() {
  if (allTimeLeaderboardID) return allTimeLeaderboardID;
  allTimeLeaderboardID = (await client.db(dbName).collection('leaderboards').find({}).limit(1).toArray())[0]._id;
  return allTimeLeaderboardID;
}

async function getPlayerRanking(userID) {
  // leaderboards contains all the leaderboards and ids for the leaderboards
  // rankings contains scores for players + leaderboard id
}

async function getCurrentRoundInfo() {
  let defaultID = await getDefaultGameID();

  let lastWinnerArray = await client.db(dbName).collection('rounds').find({ gameID: defaultGameID }).sort({ timestamp: -1 }).limit(1).toArray();
  if (lastWinnerArray.length == 0) return { lastWinner: undefined, streak: 0 };

  let lastWinner = lastWinnerArray[0].winner;

  let lastRoundWinnerHasntWon = (await client.db(dbName).collection('rounds').find({ gameID: defaultGameID, winner: { $ne: lastWinner } }).limit(1).toArray());
  let streak;
  if (lastRoundWinnerHasntWon.length == 0) {
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID: defaultID });
  } else {
    let lastTimeWinnerHasntWon = lastRoundWinnerHasntWon[0].timestamp;
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID: defaultID, winner: lastWinner, timestamp: { $gt: lastTimeWinnerHasntWon } });
  }

  return { lastWinner, streak };
}

async function solvePrompt(user, prompt, solution) {
  let gameID = await getDefaultGameID();
  //client.db(dbName)
}

// main()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close());

module.exports = {
  // getDatabase,
  getCurrentRoundInfo,
  getAllTimeLeaderboardID,
}
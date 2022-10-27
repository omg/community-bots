const { MongoClient } = require('mongodb');

// Connection URL
const url = process.env.MONGO_URL;
const client = new MongoClient(url);

let db;

// Database Name
const dbName = 'lame';

// Round collection document:
// gameID
// winner
// solvers (user + word) (includes winner)
// startedAt
// completedAt
// prompt
// promptWord
// solutionCount
// solution
// usedVivi
// exact
// timestamp

// Rankings collection document:
// User
// Leaderboard ID
// Score
// Wins
// Solves
// Late solves
// Exact solves
// Vivi uses
// Jinxes

async function getSolutionCount(solution) {
  // get number of times solution appears in the rounds collection
  let gameID = await getDefaultGameID();
  let count = await client.db(dbName).collection('rounds').countDocuments({ gameID, solution });
  return count;
}

// get amount of times a user has solved a prompt
async function getUserSolveCountForPrompt(user, prompt) {
  let gameID = await getDefaultGameID();
  let count = await client.db(dbName).collection('rounds').countDocuments({ gameID, winner: user, prompt });
  return count;
}

// get a user's first solution to a specific prompt by completion timestamp
async function getFirstSolutionToPrompt(user, prompt) {
  let gameID = await getDefaultGameID();
  let solution = await client.db(dbName).collection('rounds').find({ gameID, winner: user, prompt }).sort({ completedAt: 1 }).limit(1).toArray();
  return solution[0];
}

// update database after a round is completed
async function finishRound(solvers, startedAt, prompt, promptWord, solutionCount) {
  let gameID = await getDefaultGameID();
  let allTimeLeaderboardID = await getAllTimeLeaderboardID();

  let winner = solvers[0].user;

  // push round to rounds collection
  await client.db(dbName).collection('rounds').insertOne({
    gameID,
    winner,
    solvers,
    startedAt,
    completedAt: Date.now(),
    prompt,
    promptWord,
    solutionCount,
    solution: solvers[0].solution,
    usedVivi: solvers[0].usedVivi,
    exact: promptWord === solvers[0].solution
  });
  
  // iterate through solvers
  for (let solve of solvers) {
    let { user, solution, usedVivi } = solve;

    let isJinx = solvers.some(s => s.word === solution && s.user !== user);
    let isWinner = user === winner;
    let isExact = promptWord === solution;

    await client.db(dbName).collection('rankings').updateOne({ user, leaderboardID: allTimeLeaderboardID }, { $inc: {
      wins: isWinner ? 1 : 0,
      solves: isWinner ? 1 : 0,
      score: isWinner ? 1 : 0,
      exactSolves: isExact && isWinner ? 1 : 0,
      lateSolves: !isWinner ? 1 : 0,
      viviUses: usedVivi ? 1 : 0,
      jinxes: isJinx ? 1 : 0
    }});
  }

  // add a late solve to every solver after the first one
  
}

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

// TODO this can be expensive to call twice
// get user ranking in the default leaderboard by score using rank aggregation
async function getUserRanking(user) {
  let leaderboardID = await getAllTimeLeaderboardID();
  let ranking = await client.db(dbName).collection('rankings').aggregate([
    { $match: { leaderboardID } },
    { $setWindowFields: {
      sortBy: { score: -1 },
      output: { rank: { $rank: {} } }
    }},
    { $match: { user } }
  ]).toArray();
  if (ranking.length === 0) return null;
  return ranking[0].rank;
}

async function getCurrentRoundInfo() {
  let gameID = await getDefaultGameID();

  let lastWinnerArray = await client.db(dbName).collection('rounds').find({ gameID }).sort({ completedAt: -1 }).limit(1).toArray();
  if (lastWinnerArray.length == 0) return { lastWinner: undefined, streak: 0 };

  let lastWinner = lastWinnerArray[0].winner;

  let lastRoundWinnerHasntWon = (await client.db(dbName).collection('rounds').find({ gameID, winner: { $ne: lastWinner } }).limit(1).toArray());
  let streak;
  if (lastRoundWinnerHasntWon.length == 0) {
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID });
  } else {
    let lastTimeWinnerHasntWon = lastRoundWinnerHasntWon[0].completedAt;
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID, winner: lastWinner, completedAt: { $gt: lastTimeWinnerHasntWon } });
  }

  return { lastWinner, streak };
}

module.exports = {
  // getDatabase,
  getCurrentRoundInfo,
  getAllTimeLeaderboardID,
}
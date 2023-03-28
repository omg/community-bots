const mongoose = require('mongoose');

// Connection URL
const url = process.env.MONGO_URL;
const client = await mongoose.connect(url, {
  sslValidate: false
});

// Database Name
const dbName = 'lame';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/*
    gameID,
    winner,
    solvers: solves,
    startedAt,
    completedAt: Date.now(),
    prompt: prompt.source,
    promptWord,
    promptLength,
    solutionCount,
    solution: solves[0].solution,
    usedVivi: solves[0].usedVivi,
    exact: promptWord === solves[0].solution
*/

const RoundSchema = new Schema({
  gameID: { type: ObjectId, required: true },
  winner: { type: String, required: true },
  solvers: [{
    user: String,
    solution: String,
    usedVivi: Boolean
  }],
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: Date.now },
  prompt: String,
  promptWord: String,
  solutionCount: Number,
  solution: String,
  usedVivi: Boolean,
  exact: Boolean
});

const LeaderboardSchema = new Schema({
  name: { type: String, required: true },
  guild: String,
  channel: String,
  active: { type: Boolean, default: true },
  auto: { type: Boolean, required: true },
  startedAt: { type: Date, default: Date.now },
  closedAt: Date
});

// i want some leaderboards to be auto - but if some blitz games go to the All-Time leaderboard, that would be terrible
// all-time should be locked to normal games only at normal speeds

const ScoreSchema = new Schema({
  leaderboardID: { type: ObjectId, required: true },
  user: { type: String, required: true },
  score: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  solves: { type: Number, default: 0 },
  lateSolves: { type: Number, default: 0 },
  exactSolves: { type: Number, default: 0 },
  viviUses: { type: Number, default: 0 },
  jinxes: { type: Number, default: 0 }
});

// with this type in GameSchema, maybe we can do games that extend past word bomb mini and into some other fun types of games

export const GameSchema = new Schema({
  type: { type: String, required: true },
  guild: String,
  channel: String,
  replyMessage: String,
  startedAt: { type: Date, default: Date.now },
  closedAt: Date,
});

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

async function getSolutionCount(solution, options = {}) {
  // get number of times solution appears in the rounds collection
  // let gameID = await getDefaultGameID();
  let count = await client.db(dbName).collection('rounds').countDocuments({ ...options, solution });
  return count;
}

// this would be better in mongoose using default values
async function getUserSolveCount(user) {
  let leaderboardID = await getAllTimeLeaderboardID();
  let userStats = await client.db(dbName).collection('rankings').find({ user, leaderboardID }).limit(1).toArray();
  if (userStats.length === 0) return 0;
  return userStats[0].solves;
}

async function getUserExactSolves(user) {
  let leaderboardID = await getAllTimeLeaderboardID();
  let userStats = await client.db(dbName).collection('rankings').find({ user, leaderboardID }).limit(1).toArray();
  if (userStats.length === 0) return 0;
  return userStats[0].exactSolves;
}

// get amount of times a user has solved a prompt
async function getUserSolveCountForPrompt(user, prompt, promptLength) {
  let gameID = await getDefaultGameID();
  let count = await client.db(dbName).collection('rounds').countDocuments({ gameID, winner: user, prompt: prompt.source, promptLength });
  return count;
}

// get a user's first solution to a specific prompt by completion timestamp
async function getFirstSolutionToPrompt(user, prompt, promptLength) {
  let gameID = await getDefaultGameID();
  let solutionRound = await client.db(dbName).collection('rounds').find({ gameID, winner: user, prompt: prompt.source, promptLength }).sort({ completedAt: 1 }).limit(1).toArray();
  if (solutionRound.length === 0) return null;
  return solutionRound[0].solution;
}

// update database after a round is completed
async function finishRound(solves, startedAt, prompt, promptWord, promptLength, solutionCount) {
  let gameID = await getDefaultGameID();
  let allTimeLeaderboardID = await getAllTimeLeaderboardID();

  let winner = solves[0].user;

  // push round to rounds collection
  await client.db(dbName).collection('rounds').insertOne({
    gameID,
    winner,
    solvers: solves,
    startedAt,
    completedAt: Date.now(),
    prompt: prompt.source,
    promptWord,
    promptLength,
    solutionCount,
    solution: solves[0].solution,
    usedVivi: solves[0].usedVivi,
    exact: promptWord === solves[0].solution
  });
  
  // iterate through solvers
  for (let solve of solves) {
    let { user, solution, usedVivi } = solve;

    let isJinx = solves.some(s => s.solution === solution && s.user !== user);
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
    }}, { upsert: true });
  }
}

let defaultGameID;
async function getDefaultGameID() {
  if (defaultGameID) return defaultGameID;
  defaultGameID = (await client.db(dbName).collection('games').find({}).limit(1).toArray())[0]._id;
  return defaultGameID;
}

let defaultGameChannel;
async function getDefaultGameChannel() {
  if (defaultGameChannel) return defaultGameChannel;
  defaultGameChannel = (await client.db(dbName).collection('games').find({}).limit(1).toArray())[0].channel;
  return defaultGameChannel;
}

let defaultGameGuild;
async function getDefaultGameGuild() {
  if (defaultGameGuild) return defaultGameGuild;
  defaultGameGuild = (await client.db(dbName).collection('games').find({}).limit(1).toArray())[0].guild;
  return defaultGameGuild;
}

async function getReplyMessage() {
  let replyMessage = (await client.db(dbName).collection('games').find({}).limit(1).toArray())[0].replyMessage;
  return replyMessage;
}

async function setReplyMessage(message) {
  await client.db(dbName).collection('games').updateOne({}, { $set: { replyMessage: message.id }});
}

let allTimeLeaderboardID;
async function getAllTimeLeaderboardID() {
  if (allTimeLeaderboardID) return allTimeLeaderboardID;
  allTimeLeaderboardID = (await client.db(dbName).collection('leaderboards').find({ global: true }).limit(1).toArray())[0]._id;
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

  let lastRoundWinnerHasntWon = await client.db(dbName).collection('rounds').find({ gameID, winner: { $ne: lastWinner } }).sort({ completedAt: -1 }).limit(1).toArray();
  let streak;
  if (lastRoundWinnerHasntWon.length == 0) {
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID });
  } else {
    let lastTimeWinnerHasntWon = lastRoundWinnerHasntWon[0].completedAt;
    console.log("Winner has last lost at " + lastTimeWinnerHasntWon);
    streak = await client.db(dbName).collection('rounds').countDocuments({ gameID, winner: lastWinner, completedAt: { $gte: lastTimeWinnerHasntWon } });
  }

  return { lastWinner, streak };
}

module.exports = {
  getSolutionCount,
  getUserSolveCount,
  getUserExactSolves,
  getUserSolveCountForPrompt,
  getFirstSolutionToPrompt,
  finishRound,
  getDefaultGameID,
  getDefaultGameChannel,
  getDefaultGameGuild,
  getAllTimeLeaderboardID,
  getUserRanking,
  getCurrentRoundInfo,
  getReplyMessage,
  setReplyMessage
}
import { MongoClient, ObjectId } from "mongodb";
import { SaveState } from "../games/wbmgame";

// Connection URL
const url = process.env.MONGO_URL;
const client = new MongoClient(url, {
  sslValidate: false
});

// let db;

// Database Name
const dbName = "lame";

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

export async function getSolutionCount(solution) {
  // get number of times solution appears in the rounds collection
  let gameID = await getDefaultGameID();
  let count = await client
    .db(dbName)
    .collection("rounds")
    .countDocuments({ gameID, solution });
  return count;
}

export async function getProfile(user) {
  let profile = await client
    .db(dbName)
    .collection("profiles")
    .find({ user })
    .limit(1)
    .toArray();
  if (profile.length === 0) {
    await client
      .db(dbName)
      .collection("profiles")
      .insertOne({ user, cash: 100, points: 0 });
    profile = await client
      .db(dbName)
      .collection("profiles")
      .find({ user })
      .limit(1)
      .toArray();
  }
  return profile[0];
}

export async function getCash(user) {
  let profile = await getProfile(user);
  return profile.cash || 0;
}

export async function spendCash(user, amount) {
  if (amount < 0) return false;
  let profile = await getProfile(user);
  if (profile.cash < amount) return false;
  await client
    .db(dbName)
    .collection("profiles")
    .updateOne({ user }, { $set: { cash: profile.cash - amount } });
}

export async function setBoosterRole(user, role) {
  await client
    .db(dbName)
    .collection("profiles")
    .updateOne({ user }, { $set: { boosterRole: role } });
}

export async function getUserSolveCount(user) {
  let allTimeLeaderboardID = await getAllTimeLeaderboardID();
  let userStats = await client
    .db(dbName)
    .collection("rankings")
    .find({ user, leaderboardID: allTimeLeaderboardID })
    .limit(1)
    .toArray();
  if (userStats.length === 0) return 0;
  return userStats[0].solves;
}

export async function getUserExactSolves(user) {
  let allTimeLeaderboardID = await getAllTimeLeaderboardID();
  let userStats = await client
    .db(dbName)
    .collection("rankings")
    .find({ user, leaderboardID: allTimeLeaderboardID })
    .limit(1)
    .toArray();
  if (userStats.length === 0) return 0;
  return userStats[0].exactSolves;
}

// get amount of times a user has solved a prompt
export async function getUserSolveCountForPrompt(user, prompt, promptLength) {
  let gameID = await getDefaultGameID();
  let count = await client.db(dbName).collection("rounds").countDocuments({
    gameID,
    winner: user,
    prompt: prompt.source,
    promptLength,
  });
  // this is really slow because there are so many rounds
  return count;
}

// get a user's first solution to a specific prompt by completion timestamp
export async function getFirstSolutionToPrompt(user, prompt, promptLength) {
  let gameID = await getDefaultGameID();
  let solutionRound = await client
    .db(dbName)
    .collection("rounds")
    .find({ gameID, winner: user, prompt: prompt.source, promptLength })
    .sort({ completedAt: 1 })
    .limit(1)
    .toArray();
  if (solutionRound.length === 0) return null;
  return solutionRound[0].solution;
}

// update database after a round is completed
export async function finishRound(solves, startedAt, prompt, promptWord, promptLength, solutionCount) {
  const gameID = await getDefaultGameID();
  const allTimeLeaderboardID = await getAllTimeLeaderboardID();

  const winner = solves[0].user;

  const round = {
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
  };

  const operations = solves.map((solve) => {
    const { user, solution, usedVivi } = solve;

    const isJinx = solves.some(
      (s) => s.solution === solution && s.user !== user
    );
    const isWinner = user === winner;
    const isExact = promptWord === solution;

    return {
      updateOne: {
        filter: { user: solve.user, leaderboardID: allTimeLeaderboardID },
        update: {
          $inc: {
            wins: isWinner ? 1 : 0,
            solves: isWinner ? 1 : 0,
            score: isWinner ? 1 : 0,
            exactSolves: isExact && isWinner ? 1 : 0,
            lateSolves: !isWinner ? 1 : 0,
            viviUses: usedVivi ? 1 : 0,
            jinxes: isJinx ? 1 : 0
          }
        },
        upsert: true
      }
    };
  });

  const promises = [
    client.db(dbName).collection("rounds").insertOne(round),
    client.db(dbName).collection("rankings").bulkWrite(operations),
  ];

  await Promise.all(promises);
}

let defaultGameID;
export async function getDefaultGameID() {
  if (defaultGameID) return defaultGameID;
  defaultGameID = (
    await client.db(dbName).collection("games").find({}).limit(1).toArray()
  )[0]._id;
  return defaultGameID;
}

let defaultGameChannel;
export async function getDefaultGameChannel() {
  if (defaultGameChannel) return defaultGameChannel;
  defaultGameChannel = (
    await client.db(dbName).collection("games").find({}).limit(1).toArray()
  )[0].channel;
  return defaultGameChannel;
}

let defaultGameGuild;
export async function getDefaultGameGuild(): Promise<string> {
  if (defaultGameGuild) return defaultGameGuild;
  defaultGameGuild = (
    await client.db(dbName).collection("games").find({}).limit(1).toArray()
  )[0].guild;
  return defaultGameGuild;
}

export async function getReplyMessage() {
  let replyMessage = (
    await client.db(dbName).collection("games").find({}).limit(1).toArray()
  )[0].replyMessage;
  return replyMessage;
}

export async function setReplyMessage(message) {
  await client
    .db(dbName)
    .collection("games")
    .updateOne({}, { $set: { replyMessage: message.id } });
}

let allTimeLeaderboardID;
export async function getAllTimeLeaderboardID() {
  if (allTimeLeaderboardID) return allTimeLeaderboardID;
  allTimeLeaderboardID = (
    await client
      .db(dbName)
      .collection("leaderboards")
      .find({})
      .limit(1)
      .toArray()
  )[0]._id;
  return allTimeLeaderboardID;
}

// TODO this can be expensive to call twice
// get user ranking in the default leaderboard by score using rank aggregation
export async function getUserRanking(user) {
  let leaderboardID = await getAllTimeLeaderboardID();
  let ranking = await client
    .db(dbName)
    .collection("rankings")
    .aggregate([
      { $match: { leaderboardID } },
      {
        $setWindowFields: {
          sortBy: { score: -1 },
          output: { rank: { $rank: {} } }
        }
      },
      { $match: { user } }
    ])
    .toArray();
  if (ranking.length === 0) return null;
  return ranking[0].rank;
}

export async function getCurrentRoundInfo() {
  let gameID = await getDefaultGameID();

  let lastWinnerArray = await client
    .db(dbName)
    .collection("rounds")
    .find({ gameID })
    .sort({ completedAt: -1 })
    .limit(1)
    .toArray();
  if (lastWinnerArray.length == 0) return { lastWinner: undefined, streak: 0 };

  let lastWinner = lastWinnerArray[0].winner;

  let lastRoundWinnerHasntWon = await client
    .db(dbName)
    .collection("rounds")
    .find({ gameID, winner: { $ne: lastWinner } })
    .sort({ completedAt: -1 })
    .limit(1)
    .toArray();
  let streak;
  if (lastRoundWinnerHasntWon.length == 0) {
    streak = await client
      .db(dbName)
      .collection("rounds")
      .countDocuments({ gameID });
  } else {
    let lastTimeWinnerHasntWon = lastRoundWinnerHasntWon[0].completedAt;
    streak = await client
      .db(dbName)
      .collection("rounds")
      .countDocuments({
        gameID,
        winner: lastWinner,
        completedAt: { $gte: lastTimeWinnerHasntWon }
      });
  }

  return { lastWinner, streak };
}

// export async function getLeaderboardSection(id, startIndex: number, endIndex: number) {
//   let leaderboardID = id ?? await getAllTimeLeaderboardID();
  
//   let limit = endIndex ? endIndex - startIndex : 0;

//   let leaderboard = await client
//     .db(dbName)
//     .collection("rankings")
//     .find({ leaderboardID })
//     .sort({ score: -1 })
//     .skip(startIndex)
//     .limit(limit)
//     .toArray();

//   return leaderboard;
// }

// leaderboards should end up looking like this:
export interface LeaderboardDocument {
  _id: ObjectId;
  name: string;
  active: boolean;
}

// Yes you can overload this instead, but overloading for a single parameter looks so ugly and seems dumb for this
export async function getLeaderboard(id: string | ObjectId | string[] | ObjectId[]): Promise<LeaderboardDocument[]> {
  // searching _id with $in only works if its an array of objectids, so strings need to be converted
  // strings in this function are also just a convenience, we probably never use them
  let leaderboardID: ObjectId[];
  if (typeof id === "string") {
    leaderboardID = [new ObjectId(id)];
  } else if (Array.isArray(id)) {
    leaderboardID = id.map(id => new ObjectId(id));
  } else {
    // its not a string or a array so its a objectid already
    leaderboardID = [id];
  }
  
  let leaderboard = await client
    .db(dbName)
    .collection<LeaderboardDocument>("leaderboards")
    .find({ _id: {"$in": leaderboardID } })
    .toArray()
  
  return leaderboard.map(leaderboard => {
    return {
      _id: leaderboard._id,
      name: leaderboard.name,
      active: leaderboard.active
    }
  });
}

export async function getRankingLeaderboard(id: string | ObjectId) {
  let leaderboardID = id ?? await getAllTimeLeaderboardID();
  
  let leaderboard = await client
    .db(dbName)
    .collection("rankings")
    .find({ leaderboardID })
    .sort({ score: -1 })
    .toArray();
  return leaderboard;
}

// export async function getLeaderboard(id: string | ObjectId) {
//   let leaderboardID = id ?? await getAllTimeLeaderboardID();
  
//   let leaderboard = await client
//     .db(dbName)
//     .collection("rankings")
//     .find({ leaderboardID })
//     .sort({ score: -1 })
//     .toArray();
//   return leaderboard;
// }

// this might be worth typing with a real type instead but i think its fine since its so small
export async function getActiveLeaderboards(): Promise<{ id: ObjectId, name: string }[]> {
  let leaderboards = await client
    .db(dbName)
    .collection<LeaderboardDocument>("leaderboards")
    .find({ active: true })
    .toArray();
  
  return leaderboards.map(leaderboard => {
    return {
      id: leaderboard._id,
      name: leaderboard.name
    }
  });
}

// export interface RankingDocument {
//   _id: ObjectId;
//   user: string;
//   leaderboardID: ObjectId;
//   exactSolves: number;
//   jinxes: number;
//   lateSolves: number;
//   score: number;
//   solves: number;
//   viviUses: number;
//   wins: number;
// }


// previous i was thinking of adding a "data" field to the ranking document
// and just shoving everything else in there but i think extending the interface
// is a better idea because it gives type hinting/inference whatever its called
// i liked data better since you never need to specify which document you want
// you just get given all the data and you choose which fields you want but
// i can see how it might be annoying to work with when theres no types
export interface RankingDocument {
  _id: ObjectId;
  leaderboardID: ObjectId;
  user: string;
}

// Check this out when im back on this: https://discord.com/channels/916735613808545872/1061085161317466184/1260762051484188682
// TODO: There needs to be a good way of getting only active leaderboard ranking documents, its a bit of a mess either way
// either we filter the results via whichever leaderboards the game wants or we give everything and the game filters it
export async function getUserRankingInfo<T extends RankingDocument>(user_id: string): Promise<T[]> {
  // for some reason putting the generic on collection (.collection<T>()) gives us a `WithId<T>` type
  // no clue what the reason is but it seems we would need to extend RankingDocument with WithId to make it work together
  // but applying the generic to find<T> gives us the outcome we want

  return await client
    .db(dbName)
    .collection("rankings")
    .find<T>({ user: user_id })
    .toArray();
}

// TODO: Change these to use generics for savestate
export async function getSaveState(channel: string): Promise<SaveState | null> {
  let saveState = await client
    .db(dbName)
    .collection("saves")
    .find<SaveState>({ channel })
    .limit(1)
    .toArray();
  console.log(saveState);
  return saveState.length === 1 ? saveState[0] : null;
}

export async function storeSaveState(channel: string, state: SaveState) {
  await client
    .db(dbName)
    .collection("saves")
    .updateOne(
      { channel },
      { $set: state },
      { upsert: true },
    );
}
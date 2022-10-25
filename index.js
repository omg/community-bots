require('dotenv').config();

//require('./discord.js');
const { getCurrentRoundInfo } = require('./db.js');
const { setPresence, sendImportantMessageThatNeedsToBeReceived } = require('./discord.js');

let streak;
let lastWinner;

// for jinxes
let solves = {
  "209023094092902490": "DANCER"
}

// on-solve calculations:
// submit solve to leaderboard
// calc ranking movement remarks
// calc solve remarks
// calc prompt stats
// calc solve streak
// calc if player used the solver
// submit these remarks to the database in case the bot goes down as: (rankings, solveStats, promptStats, roundDetails)

// after-round calculations (if the bot didn't go down):
// jinxes goes below late solves

// jinxes
// ranking movements
// solve stats:
// first solve - first solve being related to firstness - exact solve
// 10,000th solve - related to 10,000thness
// 1,000th solve - related to thousandness
// 100th solve - related to hundredness
// 69th and such solves
// 666..6 and such solves - relatedness to devilish activities
// exact solves
// first time the solve has ever been used - once this happens less than 2 times in the past 150 solves
// promptiversary - using the same solve as your first time (only appears once) - probably add more to this remark
// solve streak - solve streak ended
// player used the solver during the round

async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  // sendImportantMessageThatNeedsToBeReceived("813091079322599425", "hey");
  // console.log("test")
  // await sendImportantMessageThatNeedsToBeReceived("813091079322599425", "yo");
  // console.log("test 2");
  console.log(streak);
  console.log(lastWinner);
}

setPresence("doodoo", true);

// getCurrentRoundInfo().then((info) => {
//   console.log(info);
// });

// getDatabase().then((db) => {
  
// });

main().then(() => {
  console.log("Done!");
})
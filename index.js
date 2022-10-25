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

// Late solvers can't be stored in the round until the round ends
// This isn't preferred because ideally I'd just like to push to the database once per round
// I could make it so that the round is only pushed after late solving completes - but the bot could go down during this time
// (Does that even matter?)
// I think this time is so negligible we should just just wait until late solving completes to finish the round
// If the bot goes down at any point during a round - Lame will proceed with a new round

// Round
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

// Player stats
// Wins
// Solves
// Late solves
// Exact solves
// Vivi uses
// Jinxes

// On a solve:
// Calculate ranking movement remarks (rankRemarks)
// Calculate solve remarks (solveRemarks)
// Calculate prompt statistic remarks (promptStatRemarks)
// Create streak remarks (streakRemarks)
// Add remark if player used the solver (extraRemarks)
// Wait for the end of the round for late solvers
// Add remarks for late solvers (topRemarks)
// Add remarks for jinxes (topRemarks)
// Submit round to the database
// Add statistics to all players

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
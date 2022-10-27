require('dotenv').config();

// require('./discord.js');
const { getCurrentRoundInfo, getAllTimeLeaderboardID } = require('./db.js');
// const { setPresence, sendImportantMessageThatNeedsToBeReceived } = require('./discord.js');

let streak;
let lastWinner;

// for jinxes
let solves = [
  {
    user: "209023094092902490",
    solution: "DANCER",
    usedVivi: false
  }
];

// If the bot goes down at any point during a round - Lame will proceed with a new round

// On a solve:
// Calculate ranking movement remarks (rankRemarks)
// Calculate solve remarks (solveRemarks)
//   first solve - first solve being related to firstness - exact solve
//   10,000th solve - related to 10,000thness
//   1,000th solve - related to thousandness
//   100th solve - related to hundredness
//   69th and such solves
//   666..6 and such solves - relatedness to devilish activities
//   exact solves
// Calculate prompt statistic remarks (promptStatRemarks)
//   first time the solve has ever been used - once this happens less than 2 times in the past 150 solves
//   promptiversary - using the same solve as your first time (only appears once) - probably add more to this remark
// Add remarks for the player's streak (roundRemarks)
// Add remark if player used the solver (roundRemarks)
//   Wait for the end of the round for late solvers
// Add remarks for late solvers (topRemarks)
// Add remarks for jinxes (topRemarks)
// Submit round to the database
// Add statistics to all players
// Update all-time leaderboard

async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  // sendImportantMessageThatNeedsToBeReceived("813091079322599425", "hey");
  // console.log("test")
  // await sendImportantMessageThatNeedsToBeReceived("813091079322599425", "yo");
  // console.log("test 2");
  console.log(streak);
  console.log(lastWinner);
  console.log(await getAllTimeLeaderboardID());
}

// setPresence("doodoo", true);

main().then(() => {
  console.log("Done!");
})
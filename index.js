require('dotenv').config();

//require('./discord.js');
const { getCurrentRoundInfo } = require('./db.js');
const { setPresence, sendImportantMessageThatNeedsToBeReceived } = require('./discord.js');

let streak;
let lastWinner;

async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  sendImportantMessageThatNeedsToBeReceived("813091079322599425", "hey");
  console.log("test")
  await sendImportantMessageThatNeedsToBeReceived("813091079322599425", "yo");
  console.log("test 2");
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
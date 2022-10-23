require('dotenv').config();

//require('./discord.js');
const { getCurrentRoundInfo } = require('./db.js');

let streak;
let lastWinner;

async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  
}

// getCurrentRoundInfo().then((info) => {
//   console.log(info);
// });

// getDatabase().then((db) => {
  
// });
const { getCurrentRoundInfo, getAllTimeLeaderboardID, getUserRanking, getSolutionCount, getUserSolveCount, getDefaultGameChannel } = require('../../src/database/db.js');
const { isWord, generatePrompt, solverCache } = require('../../src/dictionary/dictionary.js');
const { getRemarkEmoji, getPromptRegexDisplayText, getPromptRegexText } = require('../../src/emoji-renderer.js');
const { lameBotClient, getChannel } = require('./client.js');

let wordBombMiniChannel;

let streak;
let lastWinner;

let prompt;
let promptWord;
let solutions;
let lengthRequired;

let rankRemarks;
let solveRemarks;
let promptStatRemarks;
let roundRemarks;

let inProgress = false;

// for jinxes
let solves = [
  // {
  //   user: "209023094092902490",
  //   solution: "DANCER",
  //   usedVivi: false
  // }
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

function isNumberVowelSound(x) {
  return x == 11 || x.toString().startsWith('8');
}

async function startRound() {
  if (inProgress) return;
  inProgress = true;

  rankRemarks = "";
  solveRemarks = "";
  promptStatRemarks = "";
  roundRemarks = "";

  solves = [];
  solverCache.clear();

  // make prompt
  ({ prompt, promptWord, solutions, lengthRequired } = generatePrompt());

  // send prompt to the channel
  wordBombMiniChannel.send(getRemarkEmoji("bomb") + ' **Quick!** Type a word containing:' + '\n\n' + getPromptRegexDisplayText(prompt) + " ***｡✲ﾟ** (" + formatNumber(solutions) + (solutions === 1 ? " solution)" : " solutions)") + (state.lengthRequired ? '\n\n• Must be **' + promptWord.length + '** characters!' : ''));
  
  lameBotClient.user.setPresence({
    activities: [{
      name: lengthRequired ? getPromptRegexText(prompt) + ' - ' + promptWord.length : getPromptRegexText(prompt)
    }],
    status: 'online'
  });
}

(async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  wordBombMiniChannel = await getChannel(await getDefaultGameChannel());

  // start a new round
  startRound();
})();

// setPresence("doodoo", true);

async function endRound() {
  if (!inProgress) return;

  lameBotClient.user.setPresence({ status: 'idle' });

  let winnerObject = solves[0];
  let winner = winnerObject.user;
  let winnerSolve = winnerObject.solution;
  let winnerUsedVivi = winnerObject.usedVivi;

  // get the current ranking for the winner
  let currentRanking = await getUserRanking(winner);

  // solve remarks
  let solveNumber = await getUserSolveCount(winner) + 1;
  let solveNumberOnlyHas6 = solveNumber.toString().split("").every((digit) => digit === "6");
  let solveNumberEndsIn69 = solveNumber % 100 === 69;
  let solveNumberStartsWith6 = solveNumber.toString().startsWith("6");
  let solveNumberHas9 = solveNumber.toString().includes("9");
  let solveNumberOnlyHas6and9 = solveNumber.toString().split("").every((digit) => digit === "6" || digit === "9");
  if (solveNumber === 1) {
    solveRemarks += "First solve! "; // TODO
    // TODO solve relates to firstness
  } else if (solveNumber % 10000 === 0) {
    solveRemarks += "10000th solve! "; // TODO
    // TODO solve relates to 10,000thness
  } else if (solveNumber % 1000 === 0) {
    solveRemarks += "1000th solve! "; // TODO
    // TODO solve relates to thousandness
  } else if (solveNumber % 100 === 0) {
    solveRemarks += "100th solve! "; // TODO
    // TODO solve relates to hundredness
  }
  // check if number only has 6s
  else if (solveNumberOnlyHas6) {
    solveRemarks += "Uhh.. "; // TODO
    // TODO solve relates to devilish activities
  }
  else if (solveNumberEndsIn69 || (solveNumberStartsWith6 && solveNumberHas9 && solveNumberOnlyHas6and9)) {
    solveRemarks += "Nice. "; // TODO
  }

  // exact solve
  if (winnerSolve === promptWord) {
    solveRemarks += "Exact solve! "; // TODO
  }




  // 

  // check if user has a ranking
  if (currentRanking) {

  } else {

  }
}

// listen for messages from discord
lameBotClient.on('messageCreate', (message) => {
  // ignore messages from the bot
  if (message.author.bot) return;

  // stop if the game is not in progress
  if (!inProgress) return;

  // ignore messages not in the default game channel
  if (message.channel.id !== getDefaultGameChannel()) return;

  // stop if this user has already solved
  if (solves.some(s => s.user === message.author.id)) return;

  // check if the guess is a solve and if it contains the prompt
  let guess = cleanWord(message.content.toUpperCase());
  if (isWord(guess) && guess.includes(prompt)) {
    // add the solve to the list of solves
    solves.push({
      user: message.author.id,
      solution: guess,
      usedVivi: solverCache.has(message.author.id)
    });

    // if this player is the first to solve, start a timer to end the round after 300 milliseconds
    if (solves.length === 1) {
      setTimeout(endRound, 300);
    }
  }
});
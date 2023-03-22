const { getCurrentRoundInfo, getAllTimeLeaderboardID, getUserRanking, getSolutionCount, getUserSolveCount, getDefaultGameChannel, finishRound, getUserExactSolves, getUserSolveCountForPrompt, getFirstSolutionToPrompt, getDefaultGameGuild, getReplyMessage, setReplyMessage } = require('../../src/database/db.js');
const { isWord, generatePrompt, solverCache, cleanWord, escapeRegExp, getPromptRepeatableText, is1Related, is1000Related, is10000Related, is100Related, isDoomRelated } = require('../../src/dictionary/dictionary.js');
const { getRemarkEmoji, getPromptRegexDisplayText, getPromptRegexText, getPromptRegexInlineText, getStreakNumbers, getSolveLetters } = require('../../src/emoji-renderer.js');
const { formatNumber, formatPlacement, escapeDiscordMarkdown, createEnglishList, formatPercentage } = require('../../src/utils.js');
const { lameBotClient, getChannel, sendMessage, getGuild, sendMessageAsReply } = require('./client.js');

let guild;
let wordBombMiniChannel;

let streak;
let lastWinner;

let startedAt;
let prompt;
let promptWord;
let solutions;
let lengthRequired;

let topRemarks;
let funRemarks;
let rankRemarks;
let solveRemarks;
let promptStatRemarks;
let roundRemarks;

let replyMessage;

let inProgress = false;

let appearances = 0;
let uniqueSolutions = 0;

let solves = [];

function isNumberVowelSound(x) {
  return x == 11 || x.toString().startsWith('8');
}

function getCurrentPromptName() {
  return getPromptRegexText(prompt) + (lengthRequired ? ' - ' + promptWord.length : '');
}

function getCurrentPromptNameForMessage() {
  return getPromptRegexInlineText(prompt) + (lengthRequired ? ' - ' + promptWord.length : '');
}

async function startRound() {
  if (inProgress) return;
  inProgress = true;

  topRemarks = "";
  funRemarks = "";
  rankRemarks = "";
  solveRemarks = "";
  promptStatRemarks = "";
  roundRemarks = "";

  solves = [];
  solverCache.clear();
  startedAt = Date.now();

  // make prompt
  ({ prompt, promptWord, solutions, lengthRequired } = generatePrompt());

  // send prompt to the channel
  console.log(wordBombMiniChannel.id);
  console.log(prompt);
  console.log(promptWord);
  
  await sendMessageAsReply(replyMessage, getRemarkEmoji("bomb") + ' **Quick!** Type a word containing:' + '\n\n' + getPromptRegexDisplayText(prompt) + " ***｡✲ﾟ** (" + formatNumber(solutions) + (solutions === 1 ? " solution)" : " solutions)") + (lengthRequired ? '\n\n• Must be **' + promptWord.length + '** characters!' : ''));
  
  lameBotClient.user.setPresence({
    activities: [{
      name: getCurrentPromptName()
    }],
    status: 'online'
  });
}

(async function main() {
  ({ streak, lastWinner } = await getCurrentRoundInfo());
  guild = await getGuild(await getDefaultGameGuild());
  wordBombMiniChannel = await getChannel(await getDefaultGameChannel());

  replyMessage = await getReplyMessage();
  if (!replyMessage) {
    console.log("Setting the reply message - hold on a bit.");
    replyMessage = await sendMessage(wordBombMiniChannel, '<:e:775931479124344883> **Heads up!** A new round is starting! ***｡✲ﾟ**');
    await setReplyMessage(replyMessage);
    await new Promise(resolve => setTimeout(resolve, 8888));
  } else {
    replyMessage = await wordBombMiniChannel.messages.fetch(replyMessage);
  }

  // start a new round
  console.log("Starting a new round..");
  await startRound();
})();

function getCleanName(name) {
  let cleanName = escapeDiscordMarkdown(name.replace(/﷽/g, ''));
  if (cleanName === '') {
    if (name.length === 0) {
      return 'Lame Member';
    } else {
      return '\\' + name[0];
    }
  }
  return cleanName;
}

async function getDisplayName(userID) {
  return await guild.members.fetch(userID).then(member => {
    return getCleanName(member.displayName);
  }).catch(() => {
    return 'Lame Guest';
  });
}

const numberWords = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  6: "sixth",
  7: "seventh",
  8: "eighth",
  9: "ninth",
  10: "tenth",
}

// TODO: terrible name
function formatPlacementWithEnglishWords(x) {
  return numberWords[x] || formatPlacement(x);
}

async function endRound() {
  if (!inProgress) return;
  inProgress = false;

  lameBotClient.user.setPresence({ status: 'idle', activities: [] });

  let winnerObject = solves[0];
  let winner = winnerObject.user;
  let winnerSolution = winnerObject.solution;
  let winnerUsedVivi = winnerObject.usedVivi;

  let rankingBefore = await getUserRanking(winner);
  await finishRound(solves, startedAt, prompt, promptWord, lengthRequired ? promptWord.length : null, solutions);
  let rankingAfter = await getUserRanking(winner);

  let isSolveExact = winnerSolution === promptWord;
  let hasRemarkedExactness = false;

  // top remarks

  if (solves.length > 1) {
    // Add late solvers to the remarks
    let lateSolverNames = await Promise.all(solves.slice(1).map(async solve => {
      return await getDisplayName(solve.user);
    }));
    topRemarks += `**${createEnglishList(lateSolverNames)}** ${lateSolverNames.length === 1 ? "was" : "were"} too late..\n`;
  }

  // fun remarks

  if (solves.length > 1) {
    // Find if anyone jinxed each other
    let jinxers = [];
    let jinxWord;
    let areMultipleJinxWordsPresent = false;
    for (let solve of solves) {
      let { user, solution } = solve;

      let isJinx = solves.some(s => s.solution === solution && s.user !== user);
      if (isJinx) {
        jinxers.push(user);
        if (jinxWord) {
          if (jinxWord !== solution) {
            areMultipleJinxWordsPresent = true;
          }
        } else {
          jinxWord = solution;
        }
      }
    }

    if (jinxers.length > 0) {
      // People jinxed each other
      if (areMultipleJinxWordsPresent) {
        // Multiple jinx words - keep it simple
        roundRemarks += getRemarkEmoji("jinx") + " **" + jinxers.length + " people** just jinxed each other!\n";
      } else {
        // One jinx word - be more specific on who jinxed who
        let jinxerNames = await Promise.all(jinxers.map(async user => {
          return await getDisplayName(user);
        }));
        roundRemarks += getRemarkEmoji("jinx") + " **" + createEnglishList(jinxerNames) + "** just jinxed each other!\n";
      }
    }
  }

  // solve remarks

  let solveNumber = await getUserSolveCount(winner);
  let solveNumberOnlyHas6 = solveNumber.toString().split("").every((digit) => digit === "6");
  let solveNumberEndsIn69 = solveNumber % 100 === 69;
  let solveNumberStartsWith6 = solveNumber.toString().startsWith("6");
  let solveNumberEndsWith9 = solveNumber.toString().endsWith("9");
  let solveNumberOnlyHas6and9 = solveNumber.toString().split("").every((digit) => digit === "6" || digit === "9");
  
  if (solveNumber === 1) {
    // Solve number is 1!
    solveRemarks += getRemarkEmoji("solve1") + " Congratulations on your **first solve**!\n";
    
    // Solve number relates to the number 1
    if (is1Related(winnerSolution)) {
      solveRemarks += getRemarkEmoji("solve1Related") + ` **Amazing!** Your first solve was "${winnerSolution.toLowerCase()}"!\n`;
    }

    // Solve is exact on the first solve :o
    if (isSolveExact && !hasRemarkedExactness) {
      solveRemarks += getRemarkEmoji("solve1Exact") + " **What?!** It's your first exact solve too?!\n";
      hasRemarkedExactness = true;
    }
  } else if (solveNumber % 10000 === 0) {
    // Solve number is a multiple of 10000!
    solveRemarks += getRemarkEmoji("solve10000") + ` This is your **${formatNumber(solveNumber)}th solve**!!! Unbelievable!\n`;

    // Solve number is 10000 and relates to the number 10000
    if (solveNumber === 10000 && is10000Related(winnerSolution)) {
      solveRemarks += getRemarkEmoji("solve10000Related") + ` **AMAZING!** Your 10,000th solve was "${winnerSolution.toLowerCase()}"!\n`;
    }
  } else if (solveNumber % 1000 === 0) {
    // Solve number is a multiple of 1000!
    solveRemarks += getRemarkEmoji("solve1000") + ` This is your **${formatNumber(solveNumber)}th solve**!!! Awesome!\n`;

    // Solve number is 1000 and relates to the number 1000
    if (solveNumber === 1000 && is1000Related(winnerSolution)) {
      solveRemarks += getRemarkEmoji("solve1000Related") + ` **Amazing!** Your 1,000th solve was "${winnerSolution.toLowerCase()}"!\n`;
    }
  } else if (solveNumber % 100 === 0) {
    // Solve number is a multiple of 100!
    solveRemarks += getRemarkEmoji("solve100") + ` This is your **${formatNumber(solveNumber)}th solve**!\n`;

    // Solve number is 100 and relates to the number 100
    if (solveNumber === 100 && is100Related(winnerSolution)) {
      solveRemarks += getRemarkEmoji("solve100Related") + ` **Awesome!** Your 100th solve was "${winnerSolution.toLowerCase()}"!\n`;
    }
  } else if (solveNumberEndsIn69 || (solveNumberStartsWith6 && solveNumberEndsWith9 && solveNumberOnlyHas6and9)) {
    // Solve number ends in 69 or starts with 6 and has 9 and only consists of 6s and 9s
    solveRemarks += getRemarkEmoji("solve69") + ` This is your **${formatNumber(solveNumber)}th solve**. Nice.\n`;
  } else if (solveNumberOnlyHas6 && solveNumber > 600) {
    // Solve number only has 6s and has 3 digits
    solveRemarks += getRemarkEmoji("solve666") + ` **${formatNumber(solveNumber)}th solve..**\n`;
    
    // Solve number relates to doomy stuff
    if (isDoomRelated(winnerSolution)) {
      solveRemarks += getRemarkEmoji("solve666Related") + ` **Of course,** you solved it with "${winnerSolution.toLowerCase()}"..\n`;
    }
  }

  if (isSolveExact && !hasRemarkedExactness) {
    // Solve is exact
    let exactSolves = await getUserExactSolves(winner);
    solveRemarks += getRemarkEmoji("exactSolve") + ` **Lucky!** That's your **${formatPlacementWithEnglishWords(exactSolves)}** exact solve!\n`;
  }

  // rank remarks

  if (rankingBefore && solveNumber > 1) {
    if (rankingAfter < rankingBefore) {
      if (rankingAfter === 1) {
        rankRemarks = getRemarkEmoji("firstPlace") + " **You have taken first place!** (All-Time)\n";
      } else {
        rankRemarks += getRemarkEmoji("rankingMovement") + " You went up **" + formatNumber(rankingBefore - rankingAfter) + "** place" + (rankingBefore - rankingAfter === 1 ? "" : "s") + ", you're now **" + formatPlacement(rankingAfter) + "**! (All-Time)\n";
      }
    }
  }

  // prompt stat remarks

  appearances++;

  let solutionCount = await getSolutionCount(winnerSolution);
  let promptiversary = await getUserSolveCountForPrompt(winner, prompt, lengthRequired ? promptWord.length : null);
  
  if (solutionCount === 1) {
    // First time this solution has ever been used
    uniqueSolutions++;
    // Uncomment this when there are enough unique solutions
    // promptStatRemarks += getRemarkEmoji("uniqueSolve") + " That's the **first time** this solve has ever been used!\n";
  }
  
  if (promptiversary === 5 || promptiversary === 10 || promptiversary % 25 === 0) {
    // It's an important promptiversary for the winner!
    promptStatRemarks += getRemarkEmoji("promptiversary") + ` It's your **${formatPlacementWithEnglishWords(promptiversary)} promptiversary** with "${getCurrentPromptNameForMessage()}"!\n`;

    if (promptiversary === 5) {
      let firstSolutionToPrompt = await getFirstSolutionToPrompt(winner, prompt, lengthRequired ? promptWord.length : null);
      if (firstSolutionToPrompt === winnerSolution) {
        // The winner has solved this prompt with this solution before
        promptStatRemarks += getRemarkEmoji("promptiversaryStale") + " You solved this prompt with the **same word** as your first time!\n";
      }
    }
  }

  console.log(appearances, formatPercentage(uniqueSolutions / appearances));
  if (appearances > 99) {
    appearances = 0;
    uniqueSolutions = 0;
  }

  // round remarks

  // Update solve streaks
  if (lastWinner === winner) {
    // Winner is the same as last winner
    streak++;
    if (streak >= 3) {
      // Winner is on a solve streak
      let solveStreakEmoji;
      switch (winner) {
        case "320593811531235328":
          solveStreakEmoji = "solveStreakChristine";
          break;
        case "711739947606081676":
          solveStreakEmoji = "solveStreakDubious";
          break;
        default:
          solveStreakEmoji = "solveStreak";
          break;
      }
      roundRemarks += `**${getRemarkEmoji(solveStreakEmoji)} You're on ${isNumberVowelSound(streak) ? "an" : "a"} ${getStreakNumbers(streak)} solve streak! ${getRemarkEmoji(solveStreakEmoji)}**\n`;
    }
  } else {
    // Winner is different from last winner
    if (streak >= 3) {
      // A streak has been broken
      let lastWinnerName = await getDisplayName(lastWinner);
      roundRemarks += getRemarkEmoji("streakEnded") + ` **${lastWinnerName + (lastWinnerName.endsWith("s") ? "'" : "'s")}** solve streak of **${streak}** has been ended!\n`;
    }
    streak = 1;
    lastWinner = winner;
  }

  if (winnerUsedVivi) {
    // Winner used Vivi
    roundRemarks += getRemarkEmoji("usedVivi") + " This player **used the solver** during this round.\n";
  }

  roundRemarks += `This prompt was created from "${promptWord.toLowerCase()}"\n`;

  // last details that i can't be arsed to organise

  let solvedItString = `**${getRemarkEmoji("solvedIt")} <@${winner}> solved it! ${getRemarkEmoji("solvedIt")}**\n`;
  let roundEndedString = getRemarkEmoji("roundEnded") + " **Round ended!**\n";
  let solveDisplayString = getSolveLetters(winnerSolution, prompt) + "\n";

  // send the message
  await sendMessage(wordBombMiniChannel, 
    solvedItString + "\n"
    + roundEndedString
    + solveDisplayString
    + topRemarks + "\n"
    + funRemarks
    + rankRemarks
    + solveRemarks
    + promptStatRemarks
    + roundRemarks
  );

  setTimeout(startRound, 8000);
}

// listen for messages from discord
lameBotClient.on('messageCreate', (message) => {
  // ignore messages from the bot
  if (message.author.bot) return;

  // stop if the game is not in progress
  if (!inProgress) return;

  // ignore messages not in the default game channel
  if (message.channel.id !== wordBombMiniChannel.id) return;

  // stop if this user has already solved
  if (solves.some(s => s.user === message.author.id)) return;

  // check if the guess is a solve and if it contains the prompt
  let guess = cleanWord(message.content);
  if (prompt.test(escapeRegExp(guess)) && isWord(guess)) {
    let repeatablePrompt = getPromptRepeatableText(prompt);
    if (repeatablePrompt && (guess === repeatablePrompt || guess === repeatablePrompt + "S")) {
      if (solves.length > 0) return;
      message.reply('<@' + message.author.id + '>, you cannot repeat the prompt!').catch((error) => {
        console.log(error);
      });
      return;
    }

    if (lengthRequired) {
      if (guess.length < promptWord.length) {
        if (solves.length > 0) return;
        message.reply('<@' + message.author.id + '>, the word must be **' + promptWord.length + '** characters!\nYours was **' + guess.length + '**, go higher ' + getRemarkEmoji("higher")).catch((error) => {
          console.log(error);
        });
        return;
      } else if (guess.length > promptWord.length) {
        if (solves.length > 0) return;
        message.reply('<@' + message.author.id + '>, the word must be **' + promptWord.length + '** characters!\nYours was **' + guess.length + '**, go lower ' + getRemarkEmoji("lower")).catch((error) => {
          console.log(error);
        });
        return;
      }
    }

    // add the solve to the list of solves
    solves.push({
      user: message.author.id,
      solution: guess,
      usedVivi: solverCache.has(message.author.id)
    });

    // if this player is the first to solve, start a timer to end the round after 300 milliseconds
    if (solves.length === 1) {
      setTimeout(endRound, 350);
    }
  }
});
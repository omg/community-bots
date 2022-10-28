function replaceTextWithLetterMap(string, letterMap) {
  // replace every letter in the string with an emoji from the letterMap
  return string.split("").map((letter) => {
    if (letterMap[letter]) {
      return letterMap[letter];
    } else {
      // return unknown from the letterMap if it exists, otherwise return empty string
      return letterMap.unknown || "";
    }
  }).join("");
}

function getEmojiFromMap(emoji, emojiMap) {
  if (emojiMap[emoji]) {
    return emojiMap[emoji];
  } else {
    // return unknown from the emojiMap if it exists, otherwise return empty string
    return emojiMap.unknown || "";
  }
}

const remarkEmojiMap = require("./emojiMaps/remark-emoji.js");
function getRemarkEmoji(emoji) {
  return getEmojiFromMap(emoji, remarkEmojiMap);
}

// const blueLettersMap = require("./emojiMaps/blue-letters.js");
const goldLettersMap = require("./emojiMaps/gold-letters.js");
function getPromptLetters(prompt) {
  return replaceTextWithLetterMap(prompt, goldLettersMap);
}

const streakNumbersMap = require("./emojiMaps/streak-numbers.js");
function getStreakNumbers(number) {
  return replaceTextWithLetterMap(number.toString(), streakNumbersMap);
}

const whiteLettersMap = require("./emojiMaps/white-letters.js");
function getNormalLetters(string) {
  return replaceTextWithLetterMap(string, whiteLettersMap);
}

function getSolveLetters(solution, prompt) {
  // get match for the prompt in the solution with regex
  let match = solution.match(prompt);
  // get the index of the match
  let matchIndex = match.index;
  // get the end of the match
  let matchEnd = matchIndex + match[0].length;
  
  // get the string before the match
  let beforeMatch = solution.slice(0, matchIndex);
  // get the string after the match
  let afterMatch = solution.slice(matchEnd);
  // get the string of the match
  let matchString = solution.slice(matchIndex, matchEnd);

  // combine the matches together with the correct emojiMaps
  return getNormalLetters(beforeMatch) + getPromptLetters(matchString) + getNormalLetters(afterMatch);
}
const { escapeDiscordMarkdown } = require("./utils.js");

// const blueLettersMap = require("./emojiMaps/blue-letters.js");
const remarkEmojiMap = require("./emojiMaps/remark-emojis.js");
const goldLettersMap = require("./emojiMaps/gold-letters.js");
const whiteLettersMap = require("./emojiMaps/white-letters.js");
const streakNumbersMap = require("./emojiMaps/streak-numbers.js");

const invalidPromptDisplayRegex = /[^A-Z0-9'\-@ ]/g;

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

function getRemarkEmoji(emoji) {
  return getEmojiFromMap(emoji, remarkEmojiMap);
}

function getPromptLetters(prompt) {
  return replaceTextWithLetterMap(prompt, goldLettersMap);
}

function getStreakNumbers(number) {
  return replaceTextWithLetterMap(number.toString(), streakNumbersMap);
}

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

function getPromptRegexDisplayText(regex) {
  // get the string of the regex
  let regexString = regex.toString();
  // remove the slashes from the start and end of the regex
  regexString = regexString.slice(1, regexString.length - 1);
  
  if (regexString.startsWith("/.*") && regexString.endsWith(".*/")) {
    let displayString = regexString.slice(3, regexString.length - 3);
    if (!invalidPromptDisplayRegex.test(displayString)) {
      return getNormalLetters(displayString);
    }
  }

  return "`" + escapeDiscordMarkdown(regexString) + "`";
}

module.exports = {
  getRemarkEmoji,
  getSolveLetters,
  getStreakNumbers,
  getPromptRegexDisplayText
}
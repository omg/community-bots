const { escapeDiscordMarkdown } = require("./utils.js");

// const blueLettersMap = require("./emojiMaps/blue-letters.js");
const remarkEmojiMap = require("./emojiMaps/remark-emojis.js");
const goldLettersMap = require("./emojiMaps/gold-letters.js");
const whiteLettersMap = require("./emojiMaps/white-letters.js");
const streakNumbersMap = require("./emojiMaps/streak-numbers.js");

const invalidPromptDisplayRegex = /[^A-Z0-9'\-@ ]/;

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

function getSolveLetters(solution, promptRegex) {
  // remake the regex without the global flag
  if (promptRegex.flags.includes("g")) {
    promptRegex = new RegExp(promptRegex.source, promptRegex.flags.replace("g", ""));
  }
  
  let match = solution.match(promptRegex);
  if (!match) return "";

  let promptStartIndex = solution.search(promptRegex);
  let promptEndIndex = promptStartIndex + match[1].length;

  console.log(promptStartIndex, promptEndIndex);

  let beforePrompt = solution.slice(0, promptStartIndex);
  let promptLetters = solution.slice(promptStartIndex, promptEndIndex);
  let afterPrompt = solution.slice(promptEndIndex);

  // combine the matches together with the correct emojiMaps
  return getNormalLetters(beforePrompt) + getPromptLetters(promptLetters) + getNormalLetters(afterPrompt);
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
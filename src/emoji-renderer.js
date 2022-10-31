const { escapeDiscordMarkdown } = require("./utils.js");

// const blueLettersMap = require("./emojiMaps/blue-letters.js");
const remarkEmojiMap = require("../assets/emoji-maps/remark-emojis.js");
const goldLettersMap = require("../assets/emoji-maps/gold-letters.js");
const whiteLettersMap = require("../assets/emoji-maps/white-letters.js");
const streakNumbersMap = require("../assets/emoji-maps/streak-numbers.js");

const invalidPromptDisplayRegex = /[^A-Z0-9'\-@ ]/;

function getEmojiFromMap(emoji, emojiMap) {
  if (emojiMap[emoji]) {
    // if the emoji is a string, return it
    if (typeof emojiMap[emoji] === "string") {
      return emojiMap[emoji];
    }
    
    // if the emoji is an array, return a random emoji from the array
    if (Array.isArray(emojiMap[emoji])) {
      return emojiMap[emoji][Math.floor(Math.random() * emojiMap[emoji].length)];
    }
  }

  // return unknown from the emojiMap if it exists, otherwise return empty string
  return emojiMap.unknown || "";
}

function replaceTextWithLetterMap(string, letterMap) {
  // replace every letter in the string with an emoji from the letterMap
  return string.split("").map((letter) => {
    return getEmojiFromMap(letter, letterMap);
  }).join("");
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
  // slice the regex to only include the capturing group by finding the first and last parentheses
  let regexString = promptRegex.source;
  let capturingGroupString = regexString.slice(regexString.indexOf("(") + 1, regexString.lastIndexOf(")"));
  let capturingRegex = new RegExp(capturingGroupString);

  let match = capturingRegex.exec(solution);
  if (!match) return getNormalLetters(solution);

  let promptStartIndex = solution.search(capturingRegex);
  let promptEndIndex = promptStartIndex + match[0].length;

  let beforePrompt = solution.slice(0, promptStartIndex);
  let promptLetters = solution.slice(promptStartIndex, promptEndIndex);
  let afterPrompt = solution.slice(promptEndIndex);

  // combine the matches together with the correct emojiMaps
  return getNormalLetters(beforePrompt) + getPromptLetters(promptLetters) + getNormalLetters(afterPrompt);
}

function getPromptRegexDisplayText(regex) {
  // get the string of the regex
  let regexString = regex.source;
  // remove the anchors from the start and end of the regex
  regexString = regexString.slice(1, regexString.length - 1);

  // remove the first opening parenthesis from a string
  regexString = regexString.replace(/\(/, "");
  let lastParenthesisIndex = regexString.lastIndexOf(")");
  // remove the last closing parenthesis from a string
  regexString = regexString.slice(0, lastParenthesisIndex) + regexString.slice(lastParenthesisIndex + 1);

  let startsWithWildcard = regexString.startsWith(".*");
  let endsWithWildcard = regexString.endsWith(".*");
  
  if (startsWithWildcard && endsWithWildcard) {
    let displayString = regexString.slice(2, regexString.length - 2);
    displayString = displayString.replace(/(?<!\\)(?:(?:\\\\)*)\./g, " "); // replace all periods that aren't escaped with a space for prompt rendering
    if (!invalidPromptDisplayRegex.test(displayString)) {
      return getNormalLetters(displayString);
    }
  }

  if (startsWithWildcard) regexString = regexString.slice(2);
  if (endsWithWildcard) regexString = regexString.slice(0, regexString.length - 2);
  if (!startsWithWildcard) regexString = "^" + regexString;
  if (!endsWithWildcard) regexString = regexString + "$";

  return "`/" + regexString + "/`";
}

// TODO just incorporate this into the function above
function getPromptRegexText(regex) {
  // get the string of the regex
  let regexString = regex.source;
  // remove the anchors from the start and end of the regex
  regexString = regexString.slice(1, regexString.length - 1);

  // remove the first opening parenthesis from a string
  regexString = regexString.replace(/\(/, "");
  let lastParenthesisIndex = regexString.lastIndexOf(")");
  // remove the last closing parenthesis from a string
  regexString = regexString.slice(0, lastParenthesisIndex) + regexString.slice(lastParenthesisIndex + 1);

  let startsWithWildcard = regexString.startsWith(".*");
  let endsWithWildcard = regexString.endsWith(".*");
  
  if (startsWithWildcard && endsWithWildcard) {
    let displayString = regexString.slice(2, regexString.length - 2);
    let testDisplayString = displayString.replace(/(?<!\\)(?:(?:\\\\)*)\./g, " "); // replace all periods that aren't escaped with a space for prompt rendering
    if (!invalidPromptDisplayRegex.test(testDisplayString)) {
      return displayString;
    }
  }

  if (startsWithWildcard) regexString = regexString.slice(2);
  if (endsWithWildcard) regexString = regexString.slice(0, regexString.length - 2);
  if (!startsWithWildcard) regexString = "^" + regexString;
  if (!endsWithWildcard) regexString = regexString + "$";

  return "/" + regexString + "/";
}

module.exports = {
  getRemarkEmoji,
  getSolveLetters,
  getStreakNumbers,
  getPromptRegexDisplayText,
  getPromptRegexText
}
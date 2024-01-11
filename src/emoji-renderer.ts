// const blueLettersMap = require("./emojiMaps/blue-letters.js");
import goldLettersMap from "../assets/emoji-maps/goldLetters";
import remarkEmojiMap from "../assets/emoji-maps/remarkEmojis";
import streakNumbersMap from "../assets/emoji-maps/streakNumbers";
import whiteLettersMap from "../assets/emoji-maps/whiteLetters";

/**
 * Regular expression used to check if the prompt display contains any invalid characters. Only uppercase letters, numbers, apostrophes, hyphens, at symbols, and spaces are considered valid.
 */
const invalidPromptDisplayRegex = /[^A-Z0-9'\-@ ]/;

type EmojiMap = { [key: string]: string | string[] };

/**
 * This function takes an emoji and an emojiMap as arguments and returns the corresponding emoji from the emojiMap.
 * If the emojiMap defines the emoji as an array, a random emoji from the array is returned.
 * If the emoji does not exist in the emojiMap, the value associated with the "unknown" key in the emojiMap is returned.
 *
 * @param emoji The emoji to search for in the emoji map
 * @param emojiMap The map object that maps emojis to their respective values
 * @returns The string representation of the emoji from the emojiMap, or an empty string if no emoji was found
 */
export function getEmojiFromMap(emoji: string, emojiMap: EmojiMap): string {
  let value = emojiMap[emoji];
  if (value) {
    // if the emoji is a string, return it
    if (typeof value === "string") {
      return value;
    }

    // if the emoji is an array, return a random emoji from the array
    if (Array.isArray(emojiMap[emoji])) {
      return emojiMap[emoji][
        Math.floor(Math.random() * emojiMap[emoji].length)
      ];
    }
  }

  // return unknown from the emojiMap if it exists, otherwise return empty string
  if (emojiMap.unknown && typeof emojiMap.unknown === "string") return emojiMap.unknown;
  return "";
}

/**
 * Replaces every letter in the given string with an emoji from the provided letter map.
 *
 * @param string The input string
 * @param letterMap A map of letters to emojis
 * @returns The resulting string with letters replaced by emojis
 */
export function replaceTextWithLetterMap(string: string, letterMap: EmojiMap): string {
  // replace every letter in the string with an emoji from the letterMap
  return string
    .split("")
    .map((letter) => {
      return getEmojiFromMap(letter, letterMap);
    })
    .join("");
}

/**
 * Returns the emoji associated with a given remark.
 * This calls getEmojiFromMap with the remarkEmojiMap.
 *
 * @param emoji The emoji to retrieve from the map
 * @returns The emoji associated with the given remark, or an empty string if the emoji does not exist
 */
export function getRemarkEmoji(emoji: string): string {
  return getEmojiFromMap(emoji, remarkEmojiMap);
}

/**
 * Returns the "prompt letters" of a given prompt string.
 * This calls replaceTextWithLetterMap with the goldLettersMap.
 *
 * @param prompt The prompt string for which to get the letters
 */
export function getPromptLetters(prompt: string): string {
  return replaceTextWithLetterMap(prompt, goldLettersMap);
}

/**
 * Returns the "streak numbers" of a given number.
 * This calls replaceTextWithLetterMap with the streakNumbersMap.
 *
 * @param number The number to be converted into streak numbers
 */
export function getStreakNumbers(number: number): string {
  return replaceTextWithLetterMap(number.toString(), streakNumbersMap);
}

/**
 * Returns the "normal letters" of a given string.
 * This calls replaceTextWithLetterMap with the whiteLettersMap.
 *
 * @param string The string to be converted into normal letters
 */
export function getNormalLetters(string: string): string {
  return replaceTextWithLetterMap(string, whiteLettersMap);
}

/**
 * Returns the "solve letters" of a given solution string using a given prompt regex.
 * The matched portion of the solution string is replaced with the prompt letters, and the rest of the solution string is replaced with the normal letters.
 * This is how the bot displays solutions in various different commands.
 * 
 * **NOTE:** The prompt regex **MUST** contain a single capturing group, or it will behave unexpectedly.
 *
 * @param solution The input solution string.
 * @param promptRegex The regular expression used to find the capturing group.
 * @returns The resulting string with the emoji display text.
 */
export function getSolveLetters(solution: string, promptRegex: RegExp): string {
  // slice the regex to only include the capturing group by finding the first and last parentheses
  let regexString = promptRegex.source;
  let capturingGroupString = regexString.slice(
    regexString.indexOf("(") + 1,
    regexString.lastIndexOf(")")
  );
  let capturingRegex = new RegExp(capturingGroupString);

  // console.log("getting solve display from regex:", capturingRegex.source);

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

/**
 * This function will take a prompt regex as input and return either a display string using emojis, or regex encapsulated in backticks, for use in a place such as a Discord text channel.
 * 
 * **NOTE:** The prompt regex **MUST** contain a single capturing group and anchors at the start and end, or it will behave unexpectedly.
 *
 * @param regex The regular expression used to generate the prompt display text
 * @returns The display string for the prompt, using white letters if it can be rendered that way, or as regex encapsulated in backticks (`).
 * 
 * @example
 * ```typescript
 * getPromptRegexDisplayText(new RegExp("^.*([A-Z]{3})$")); // returns "`/[A-Z]{3}$/`"
 * getPromptRegexDisplayText(new RegExp("^.*(AB).*$")); // returns AB in white letters
 * ```
 */
export function getPromptRegexDisplayText(regex: RegExp): string {
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
/**
 * This function will take a prompt regex as input and return either a display string **WITHOUT** using emojis, or a regex **NOT** encapsulated in backticks, for use in a place such as a Discord presence.
 * 
 * **NOTE:** The prompt regex **MUST** contain a single capturing group and anchors at the start and end, or it will behave unexpectedly.
 *
 * @param regex The regular expression used to generate the prompt display text
 * @returns The display string for the prompt.
 * 
 * @example
 * ```typescript
 * getPromptRegexDisplayText(new RegExp("^.*([A-Z]{3})$")); // returns "/[A-Z]{3}$/"
 * getPromptRegexDisplayText(new RegExp("^.*(AB).*$")); // returns "AB"
 * ```
 */
export function getPromptRegexText(regex: RegExp): string {
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

// TODO now we're just trolling
/**
 * This function will take a prompt regex as input and return either a display string **WITHOUT** using emojis, or a regex encapsulated in backticks, for use in a place such as a display for a command where you would want to display a prompt without using the fancy letter emojis.
 * 
 * **NOTE:** The prompt regex **MUST** contain a single capturing group and anchors at the start and end, or it will behave unexpectedly.
 *
 * @param regex The regular expression used to generate the prompt display text
 * @returns The display string for the prompt.
 * 
 * @example
 * ```typescript
 * getPromptRegexDisplayText(new RegExp("^.*([A-Z]{3})$")); // returns "`/[A-Z]{3}$/`"
 * getPromptRegexDisplayText(new RegExp("^.*(AB).*$")); // returns "AB"
 * ```
 */
export function getPromptRegexInlineText(regex: RegExp): string {
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

  return "`/" + regexString + "/`";
}

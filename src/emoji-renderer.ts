// const blueLettersMap = require("./emojiMaps/blue-letters.js");
import goldLettersMap from "../assets/emoji-maps/goldLetters";
import remarkEmojiMap from "../assets/emoji-maps/remarkEmojis";
import streakNumbersMap from "../assets/emoji-maps/streakNumbers";
import whiteLettersMap from "../assets/emoji-maps/whiteLetters";

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

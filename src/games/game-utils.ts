import { normalizeUserInput } from "../dictionary/dictionary";
import { getPromptRepeatableText } from "../regex";
import { formatPlacement } from "../utils";

/**
 * Returns if the prompt was repeated in the guess
 *
 * @param prompt The prompt string
 * @param guess The guess string
 *
 * @returns true if the prompt was repeated in the guess
 */
export function isRepeatedPrompt(prompt: RegExp, guess: string): boolean {
  const repeatablePrompt = getPromptRepeatableText(prompt);
  if (!repeatablePrompt) {
    return false;
  }
  
  guess = normalizeUserInput(guess);

  return repeatablePrompt === guess || repeatablePrompt + "S" === guess;
}

const NUMBER_WORDS = {
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
};

// TODO: terrible name
export function formatPlacementWithEnglishWords(x: number): string {
  return NUMBER_WORDS[x] || formatPlacement(x);
}

/**
 * Uses the singular or plural string based on the provided amount or items in an array.
 *
 * @param amount The amount to determine the plurality of
 * @param singular The singular form of the word
 * @param plural The plural form of the word
 * @returns The singular, if the amount is 1, otherwise the plural
 */
export function usePlural(
  amount: number | any[] | Set<any>,
  singular: string,
  plural: string
): string {
  if (amount instanceof Set) {
    return amount.size === 1 ? singular : plural;
  }

  if (amount instanceof Array) {
    return amount.length === 1 ? singular : plural;
  }

  return amount === 1 ? singular : plural;
}

/**
 * Determines if a number starts with a vowel sound.
 * 
 * This is useful when determining if "a" or "an" should be used before a number.
 * 
 * @param x The number to check
 * @returns true if the number starts with a vowel sound
 */
export function isNumberVowelSound(x: number): boolean {
  return x == 11 || x == 18 || x.toString().startsWith("8");
}

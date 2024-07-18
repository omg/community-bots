import { escapeDiscordMarkdown, formatPlacement } from "../utils";

/**
 * Returns true of false if the prompt was repeated in the guess
 * 
 * @param prompt The prompt string
 * @param guess The guess string
 * 
 * @returns True or false based on if the prompt was repeated in the guess
 */
export function isRepeatedPrompt(prompt: string, guess: string): boolean {
  prompt = prompt.toLowerCase();
  guess = guess.toLowerCase();

  return (prompt === guess || prompt + "s" === guess)
}

export function getCleanName(name) {
  let cleanName = escapeDiscordMarkdown(name.replace(/﷽𒐫𒈙⸻꧅ဪ௵௸/g, ""));
  if (cleanName === "") {
    if (name.length === 0) {
      return "Lame Member";
    } else {
      return "\\" + name[0];
    }
  }
  return cleanName;
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
export function formatPlacementWithEnglishWords(x) {
  return NUMBER_WORDS[x] || formatPlacement(x);
}

// replacement for engNum/engLen
/**
 * Helper function for Determining if a given amount is of singular or plural form
 * 
 * @param amount A number or an array of items
 * @param singular The singular form of the word
 * @param plural The plural form of the word
 * @returns The parameter singular or plural
 */
export function isPlural(amount: number | any[], singular: string, plural: string): string {
  if (amount instanceof Array) {
    return amount.length === 1 ? singular : plural;
  }

  return amount === 1 ? singular : plural;
}

export function isNumberVowelSound(x) {
  return x == 11 || x == 18 || x.toString().startsWith("8");
}
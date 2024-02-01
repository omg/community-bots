import { escapeRegExp, getDictionary } from "../../src/dictionary/dictionary";

const SPLIT_DICTIONARY = getDictionary().split("\r\n");

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

/**
 * Checks if a word is in the dictionary
 * 
 * @param word The word to check if its in the dictionary
 * @returns True or false based on if the word is in the dictionary
 */
export function isInDictionary(word: string): boolean {
    return SPLIT_DICTIONARY.includes(word);
}
import { fork } from "child_process";
import fs from "node:fs";
import path from "path";
import appRoot from "app-root-path";
import { escapeRegExp } from "../regex";

// TODO: pull dictionaries from Vivi API
try {
  var dictionarySet = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/dictionaries/english.txt"), "utf8"));
  var related1Set = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/lists/1-related.txt"), "utf8"));
  var related100Set = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/lists/100-related.txt"), "utf8"));
  var related1000Set = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/lists/1000-related.txt"), "utf8"));
  var related10000Set = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/lists/10000-related.txt"), "utf8"));
  var relatedDoomSet = stringIntoSet(fs.readFileSync(appRoot.resolve("assets/word-lists/lists/doom-related.txt"), "utf8"));
  var frequencyMapString = fs.readFileSync(appRoot.resolve("assets/word-lists/frequency-maps/prompts-frequency-map.txt"), "utf8");
} catch (e) {
  throw "Couldn't retrieve word lists from files.";
}

const frequencyMap = parseFrequencyMap(frequencyMapString);

// filter frequency maps to match the generatePrompts requirements
frequencyMap.forEach((value, key) => {
  if (isNaN(value)) {
    frequencyMap.delete(key);
    return;
  }

  // are we Dead Set on length required needing the like 40+ solves, or should we just cope and hardlock it to 23 still?
  // TODO: Check the above comment out
  if ((key.length < 3 || key.length > 5) || (key.includes("-") || key.includes("'")) || (key.match(/\./g) && key.match(/\./g).length > 2) || value < 23) {
    frequencyMap.delete(key);
  };
});

/**
 * Helper function to parse a frequency map string into a Map object.
 * 
 * @param map Frequency map string
 * @returns Frequency map as a Map object
 */
function parseFrequencyMap(map: string): Map<string, number> {
  let fMap = new Map<string, number>();
  let lines = map.split("\n");
  for (let line of lines) {
    let [numSolutions, prompt] = line.split("\t");
    fMap.set(prompt, parseInt(numSolutions));
  }

  return fMap;
}

/**
 * Helper function to turn dictionary strings into sets.
 * 
 * @param dstring Dictionary string
 */
function stringIntoSet(dstring: string): Set<string> {
  return new Set(dstring.toUpperCase().split("\r\n"));
}

// TODO holy copy-paste batman
/**
 * Checks if a word is "related to firstness". This checks if the specified word is found in the 'related1String' variable. The word is cleaned and standardized before performing the check.
 */
export function is1Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return related1Set.has(cleanInput);
}

/**
 * Checks if a word is related to 100. This checks if the specified word is found in the 'related100String' variable. The word is cleaned and standardized before performing the check.
 */
export function is100Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return related100Set.has(cleanInput);
}

/**
 * Checks if a word is related to 1000. This checks if the specified word is found in the 'related1000String' variable. The word is cleaned and standardized before performing the check.
 */
export function is1000Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return related1000Set.has(cleanInput);
}

/**
 * Checks if a word is related to 10000. This checks if the specified word is found in the 'related10000String' variable. The word is cleaned and standardized before performing the check.
 */
export function is10000Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return related10000Set.has(cleanInput);
}

/**
 * Checks if a word is doomy. This checks if the specified word is found in the 'relatedDoomString' variable. The word is cleaned and standardized before performing the check.
 */
export function isDoomRelated(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return relatedDoomSet.has(cleanInput);
}

// is standardize the best name for this?
/**
 * Standardizes a word by performing the following operations:
 * 1. Replaces any occurrences of curly single quotes ‘’ with straight single quotes ' (iOS and macOS may use curly quotes by default)
 * 2. Replaces any occurrences of hyphens - with hyphens -. (...what the FUCK?)
 * 3. Replaces any occurrences of ellipsis … with three consecutive dots ... (iOS and macOS - when users are trying to enter regex)
 * 4. Trims any leading or trailing whitespace from the word.
 * 
 * **NOTE:** Trimming might ruin some searches.
 * This function will also not convert the word to uppercase. Make sure you implement case insensitivity.
 *
 * @param word The word to be standardized
 * @returns The standardized string
 */
export function standardizeWord(word: string): string {
  return word
    .toUpperCase()
    .replace(/[‘’]/g, "'")
    .replace(/\-/g, "-")
    .replace(/…/g, "...")
    .trim();
}

/**
 * Creates a new PromptException.
 *
 * @param message The error message
 */
export function PromptException(message: string) {
  this.message = message;
  this.name = "PromptException";
}

/**
 * Checks if the given word is in the English dictionary.
 *
 * @param word The word to be checked
 */
export function isWord(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word)).toUpperCase();
  return dictionarySet.has(cleanInput);
  // return new RegExp("^" + cleanInput + "$", "mi").test(dictionaryString);
}

/**
 * Creates a new SolveWorkerException.
 *
 * @param message The error message
 */
export function SolveWorkerException(message: string) {
  this.message = message;
  this.name = "SolveWorkerException";
}

/**
 * A Set instance used to store who has used the solver recently.
 * It is used in Word Bomb Mini to determine if the winner of a round has used the solver.
 */
export let solverCache = new Set();

/**
 * Finds all solutions in the English dictionary to a prompt regular expression with a timeout. The user is stored so that Word Bomb Mini can know who has used the solver recently.
 *
 * @param promptRegex The regular expression pattern to match words to
 * @param timeout The timeout in milliseconds
 * @param user The user who is using the solver
 * 
 * @returns A promise that resolves with a set of solutions, or rejects with an error
 */
export function solvePromptWithTimeout(promptRegex: RegExp, timeout: number, user: string): Promise<string[]> {
  if (user) solverCache.add(user);
  let dictionary = Array.from(dictionarySet);

  return new Promise((resolve, reject) => {
    const worker = fork(path.join(__dirname, "solve-worker"));

    let timeoutId = setTimeout(() => {
      worker.kill();
      reject(new SolveWorkerException("Your regex took too long to compute and timed out."));
    }, timeout);

    worker.on("message", (solutions: string[]) => {
      clearTimeout(timeoutId);
      worker.kill();
      resolve(solutions);
    });

    worker.on("error", (e) => {
      clearTimeout(timeoutId);
      worker.kill();
      reject(e);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timeoutId);
        reject(new SolveWorkerException("Your regex failed to compute."));
      }
    });

    worker.send({ dictionary, regex: promptRegex.source }, (e) => { console.log(e); });
  });
}

// TODO move this to utils
/**
 * Generates a random integer between the specified minimum and maximum values.
 *
 * @param min The minimum value for the random integer.
 * @param max The maximum value for the random integer.
 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Naming this Prompt feels almost misleading, so this works for now
type GeneratedPrompt = {
  promptWord: string,
  solutions: Set<string>,
  lengthRequired: boolean,
  prompt: RegExp,
}

// i Feel like doing this is bad, but i need it to be a array for the random selection
// so why not just have it permanently as a array instead of remaking it every time
const preMadePromptList = Array.from(frequencyMap.keys());

/**
 * Generates a prompt. It is guaranteed that the prompt will have at least 23 solutions.
 */
export async function generatePrompt(): Promise<GeneratedPrompt> {
  let promptLength = randInt(3, 5);
  let requiredCharacters = promptLength + 2;

  let randPromptIndex = Math.floor(Math.random() * preMadePromptList.length);
  let prompt = preMadePromptList[randPromptIndex];
  
  let solutions = await solvePromptWithTimeout(new RegExp(prompt, "i"), 999999999, null);

  let randWordIndex = Math.floor(Math.random() * solutions.length);
  let promptWord = solutions[randWordIndex];
  // we can be sure the prompt has more than 23 solutions because of the frequency map filtering
  let lengthRequired = promptWord.length < 17 && frequencyMap.get(prompt) > 45 && randInt(1, 7) == 1;
  if (lengthRequired) {
    solutions = solutions.filter((word) => {
      return word.length == promptWord.length;
    });
  };

  return {
    promptWord: promptWord,
    solutions: new Set(solutions),
    lengthRequired: lengthRequired,
    prompt: new RegExp(prompt, "i")
  }
};

/**
 * Gets the amount of words in the dictionary.
 * 
 * @returns Number of words in the dictionary
 */
export function getWordsInDictionary(): number {
  // Lol
  return dictionarySet.size;
}

/**
 * @deprecated Use {@link standardizeWord} instead.
 */
export const cleanWord = standardizeWord;

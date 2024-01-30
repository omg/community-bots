import { fork } from "child_process";
import fs from "node:fs";
import path from "path";
import appRoot from "app-root-path";

// TODO: pull dictionaries from Vivi API
try {
  var dictionaryString = fs.readFileSync(appRoot.resolve("assets/word-lists/dictionaries/english.txt"), "utf8");
  var related1String = fs.readFileSync(appRoot.resolve("assets/word-lists/lists/1-related.txt"), "utf8");
  var related100String = fs.readFileSync(appRoot.resolve("assets/word-lists/lists/100-related.txt"), "utf8");
  var related1000String = fs.readFileSync(appRoot.resolve("assets/word-lists/lists/1000-related.txt"), "utf8");
  var related10000String = fs.readFileSync(appRoot.resolve("assets/word-lists/lists/10000-related.txt"), "utf8");
  var relatedDoomString = fs.readFileSync(appRoot.resolve("assets/word-lists/lists/doom-related.txt"), "utf8");
} catch (e) {
  throw "Couldn't retrieve word lists from files.";
}

// TODO holy copy-paste batman

/**
 * Checks if a word is "related to firstness". This checks if the specified word is found in the 'related1String' variable. The word is cleaned and standardized before performing the check.
 */
export function is1Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(related1String);
}

/**
 * Checks if a word is related to 100. This checks if the specified word is found in the 'related100String' variable. The word is cleaned and standardized before performing the check.
 */
export function is100Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(related100String);
}

/**
 * Checks if a word is related to 1000. This checks if the specified word is found in the 'related1000String' variable. The word is cleaned and standardized before performing the check.
 */
export function is1000Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(related1000String);
}

/**
 * Checks if a word is related to 10000. This checks if the specified word is found in the 'related10000String' variable. The word is cleaned and standardized before performing the check.
 */
export function is10000Related(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(related10000String);
}

/**
 * Checks if a word is doomy. This checks if the specified word is found in the 'relatedDoomString' variable. The word is cleaned and standardized before performing the check.
 */
export function isDoomRelated(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(relatedDoomString);
}

// is standardize the best name for this?
/**
 * Standardizes a word by performing the following operations:
 * 1. Converts the word to uppercase.
 * 2. Replaces any occurrences of curly single quotes ‘’ with straight single quotes ' (iOS and macOS may use curly quotes by default)
 * 3. Replaces any occurrences of hyphens - with hyphens -. (...what the FUCK?)
 * 4. Replaces any occurrences of ellipsis … with three consecutive dots ... (iOS and macOS - when users are trying to enter regex)
 * 5. Trims any leading or trailing whitespace from the word.
 * 
 * **NOTE:** Trimming might ruin some searches.
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
 * A regular expression used to determine if a search is regex or not.
 */
const regexTest = /(?:^| )\/(.*)\/(?: |$)/;

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
 * Returns a regex used for searching based on a query.
 * The query may be in a prompt format (AB) or regex format (/AB/).
 * 
 * The function will interpret either format and return a regex pattern.
 *
 * @param promptQuery A query string to convert to regex
 * @returns A regular expression pattern based on the query. If the query contains a valid regular expression, the function constructs and returns the regex pattern. If the query does not contain a valid regular expression, the function constructs and returns a regex pattern that matches the query as a literal string.
 * 
 * @example
 * ```typescript
 * getPromptRegexFromPromptSearch("AB") // new RegExp("AB")
 * getPromptRegexFromPromptSearch("/A.B$/") // new RegExp("A.B$")
 * ```
 */
export function getPromptRegexFromPromptSearch(promptQuery: string): RegExp {
  let cleanQuery = standardizeWord(promptQuery);
  let regexResult = regexTest.exec(cleanQuery);

  // TODO find args in the query

  // let's just be safe with backticks
  if (cleanQuery.includes("`")) {
    throw new PromptException("The prompt you've entered is invalid.");
  }

  if (regexResult) {
    // This has regex

    let regexInput = regexResult[1];

    if (regexInput === "") {
      // This regex is empty
      throw new PromptException("The regex you've entered is empty.");
    }

    // check if the regex is valid
    let regex;
    try {
      regex = new RegExp(regexInput);
    } catch (e) {
      throw new PromptException("The regex you've entered is invalid.");
    }

    return regex;
  } else {
    // This isn't regex

    // will this even work? I don't know. I'm not a regex expert. I'm just a guy who wants to make a bot. :(
    return new RegExp(escapeRegExp(cleanQuery).replace(/\\\?|\\\./g, "."));
  }
}

/**
 * Escapes all RegExp special characters.
 *
 * @param string The input string to be escaped.
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Checks if the given word is in the English dictionary.
 *
 * @param word The word to be checked
 */
export function isWord(word: string): boolean {
  let cleanInput = standardizeWord(escapeRegExp(word));
  return new RegExp("^" + cleanInput + "$", "m").test(dictionaryString);
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
 */
export function solvePromptWithTimeout(promptRegex: RegExp, timeout: number, user: string): Promise<any> {
  if (user) solverCache.add(user);

  return new Promise((resolve, reject) => {
    const worker = fork(path.join(__dirname, "solve-worker"));

    let timeoutId = setTimeout(() => {
      worker.kill();
      reject(new SolveWorkerException("Your regex took too long to compute and timed out."));
    }, timeout);

    worker.on("message", (solutions) => {
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

    worker.send({ dictionaryString, regexSource: promptRegex.source });
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

// TODO: remake this because it's inefficient
/**
 * Generates a prompt. It is guaranteed that the prompt will have at least 23 solutions.
 */
export async function generatePrompt() {
  let promptLength = randInt(3, 5);
  let requiredCharacters = promptLength + 2;

  let solves = [];
  let repeatedRegex = "";
  for (let i = 0; i < requiredCharacters; i++) repeatedRegex += "[^\r\n'-]";
  let regex = new RegExp("(" + repeatedRegex + "[^\r\n'-]*)$", "gm");

  let match: RegExpExecArray;
  while (match = regex.exec(dictionaryString)) {
    solves.push(match[1]);
  }

  while (true) {
    let randIndex = Math.floor(Math.random() * solves.length);
    let actualPromptWord = solves[randIndex];
    let promptWord = actualPromptWord;
    let promptSubStart = randInt(0, promptWord.length - promptLength);

    let blanks = Math.min(promptLength - 2, 2);
    for (let i = 0; i < blanks; i++) {
      let rand = randInt(promptSubStart, promptSubStart + promptLength - 1);
      promptWord = promptWord.substring(0, rand) + "`" + promptWord.substring(rand + 1, promptWord.length); //only thru substart and subend
    }

    // completely unreadable
    let prompt = new RegExp(
      escapeRegExp(
        promptWord.slice(promptSubStart, promptSubStart + promptLength)
      ).replace(/`/g, ".")
    );
    console.log(prompt);

    let lengthRequired = promptWord.length < 17 && randInt(1, 7) == 1;
    let solutions = await solvePromptWithTimeout(prompt, 99999999999, null);
    if (lengthRequired) {
      solutions = solutions.filter((word) => {
        return word.length == promptWord.length;
      });
    }
    if (solutions.length < 23) continue; // || solutions.length > 1200
    if (lengthRequired && solutions.length < 46) continue;

    return {
      promptWord: actualPromptWord,
      solutions: solutions.length,
      lengthRequired: lengthRequired,
      prompt
    };
  }
}

/**
 * @deprecated Use {@link standardizeWord} instead.
 */
export const cleanWord = standardizeWord;

import { PromptException } from "./dictionary/dictionary";
import { getNormalLetters, getPromptLetters } from "./emoji-renderer";

/*
  Parts of the regex

  some prompts may use either ^ or $ to indicate the puzzle is anchored to the start or end of the string
  
  if there is no flexible wildcard (.*) after ^ or before $, it means that the prompt is anchored directly to the start or end of the string

  a prompt can have multiple "piston prompts", which are prompts separated by .*
  as in:
  /^AB.*ED/
  (anchored at the start (no flexible wildcard after ^), AB, then anything in the middle, followed by ED)

  capturing groups will automatically be applied between flexible wildcards
  this is so that the prompt may be rendered with the correct emojiMaps for each part of the prompt
  by iterating through the capturing groups and rendering each one with gold letters

  flags
  in most cases, i will be applied
*/

// regex modifiers

export function changeRegexFlags(regex: RegExp, flags: string = "") {
  return new RegExp(regex.source, flags);
}

export function removeRegexFlags(regex: RegExp) {
  return new RegExp(regex.source);
}

export function addRegexFlags(regex: RegExp, flags: string) {
  return new RegExp(regex.source, regex.flags + flags);
}

// emoji rendering

/*
  Applying capturing groups to the puzzle regex is for emoji rendering
  This will apply capturing groups between flexible wildcards (.*) in the regex
  Between each flexible wildcard is a prompt

  /AB/ - puts a capturing group around AB
  /^AB/ - puts a capturing group around AB
  /^AB.*ED/ - puts a capturing group around AB and ED
  /^.*AB.*ED.*FD.*$/ - still only AB, ED, FD

  When rendered later, each capturing group should be rendered with gold letters
*/
export function applyCapturingGroupsToPuzzleRegex(puzzleRegex: RegExp) {
  // let puzzleSource = puzzleRegex.source;

  // // ignore ^ and $ anchors (which may or may not be present in this regex),
  // // then split the rest by .* (the flexible wildcards)

  // const anchoredToStart = puzzleSource.startsWith("^");
  // const anchoredToEnd = puzzleSource.endsWith("$");

  // // remove the anchors from the start and end of the regex
  // const strippedPuzzle = puzzleSource.slice(
  //   anchoredToStart ? 1 : 0,
  //   anchoredToEnd ? puzzleSource.length - 1 : puzzleSource.length
  // );

  // // stopped here due to capturing group issues with user inputted regexes
  // // (i.e. the user may have already applied capturing groups to the regex)
  // // meaning that their \1 may be replaced with a different capturing group by this function
  // // const
}

/**
 * Constant name for renaming capture groups in user regexes
 * 
 * im trying to keep this as short as possible to avoid any potential issues with renaming regex groups
 */
const CUSTOM_REGEX_CAPTURE_NAME = "c";

/**
 * Helper function to get a unique name for a capture group
 * 
 * @param index Any number to make the name "unique"
 * @returns CUSTOM_REGEX_CAPTURE_NAME + index
 */
function getUniqueCapturingNames(index: number) {
  return CUSTOM_REGEX_CAPTURE_NAME + index;
}

/**
 * Replaces a character at a given index in the string with a different string
 * 
 * @param string String to replace text in
 * @param index Where to replace the text
 * @param replacement What to replace the text with
 */
function replaceAt(string: string, index: number, replacement: string): string {
  return string.substring(0, index) + replacement + string.substring(index + 1);
}

/**
 * Helper function to trim the <> from a named group so we can get just the name
 * 
 * @param string String to trim the arrows from
 * @returns String without the arrows
 */
function trimArrows(string: string): string {
  return string.replace(/^<|>$/g, "");
}


/**
 * This function renames all of the groups in a regex to unique names, and transforms all backreferences into named backreferences
 * 
 * It is **REQUIRED** that the regex is valid before passing it to this function, this function works under the assumption that it is valid
 * 
 * @param regex Regex to rename all of the groups in, (named and unnamed)
 * @returns A regex with all of the groups renamed to unique names, and all backreferences transformed into named backreferences, pointing to the correct groups
 */
export function renameRegexGroups(regex: RegExp): RegExp {
  let regexString = regex.source;

  // this is the map of all the named groups and their new names
  // so if a users group is called <asd> and we rename it to <c0>, then this map will have { asd: c0 }
  let orderedNamedGroups: string[] = [];
  let namedGroupsMap: { [key: string]: string } = {};
  let groupIndex = 0;

  // i realized that since we are modifying the string multiple times we need to keep track of where the correct indexes are supposed to be
  // because we cant just .replace the string since we might hit a named group '(' by accident
  // this means we need to keep track of how the string is being offset by our past replacements
  // we do this by taking the difference between the length of the string we are replacing and the length of the string we are replacing it with
  // and then adding that to the index of the next replacement
  let runningIndexDifferance = 0;

  // :D, this is super ugly but essentially it turns the returned IterableIterator<RegExpMatchArray> into a RegExpMatchArray[] instead, which is much easier to work with
  let matches: RegExpMatchArray[] = [...regexString.matchAll(/(?<!\\)(\(\?(<.*?>)|\((?!\?))/gi)];
  // if its a named group the matches are as follows: ['(?<name>', '(?<name>', <name>]
  // if its a normal group the matches are as follows: ['(', '(']
  // the first match is always the same as the second because of the capture groups, so we can just use the second match onwards for all cases
  for (let match of matches) {
    // '(?<name>' or '('
    let matchString = match[1];
    
    // if its a named group we want to replace Every instance of the <name> with a new name
    if (matchString.startsWith('(?<')) {
      // when getting a unique name we need to remember to increase the groupIndex so we dont have duplicates
      let uniqueName = getUniqueCapturingNames(groupIndex);
      groupIndex++;
      // add the groups to ordered list for fixing numeric backreferences later
      orderedNamedGroups.push(uniqueName);
      // and add to the map for fixing named backreferences later (only if its a named group)
      namedGroupsMap[trimArrows(match[2])] = uniqueName;

      regexString = regexString.replace(matchString, `(?<${uniqueName}>`);
      
      // here we subtract the difference between the length of the match and the length of the replacement, to correct our next replacement index
      runningIndexDifferance -= matchString.length - (uniqueName.length + 4);
    } else {
      let uniqueName = getUniqueCapturingNames(groupIndex);
      groupIndex++;
      orderedNamedGroups.push(uniqueName);

      // we use replaceAt here because we want to make sure we are replacing the correct '('
      regexString = replaceAt(regexString, match.index + runningIndexDifferance, `(?<${uniqueName}>`);
      runningIndexDifferance += uniqueName.length + 3; // +3 because we are replacing '(' with '(?<uniqueName>'
    }
  }

  // replace any named backreferences
  for (let backref of regexString.matchAll(/(?<=\\k)<(.+?)>/gi)) {
    // backref[0] is the name with the <> wrapped around it
    // backref[1] is the name of the group
    let backrefName= backref[1];
    let match = new RegExp(`\<${backrefName}\>`, "g");

    regexString = regexString.replace(match, `<${namedGroupsMap[backrefName]}>`)
  }

  // replace numeric backreferences
  for (let backref of regexString.matchAll(/\\([1-9])/gi)) {
    // backref[0] is \\1
    // backref[1] is 1
    // when parsing the backref as a int, we have to -1 because arrays are 0 indexed 👍

    regexString = regexString.replace(backref[0], `\\k<${orderedNamedGroups[parseInt(backref[1]) - 1]}>`)
  }

  return new RegExp(regexString, regex.flags);
}

// nukeUserRegex(/(.*)(?<a>AB)\k<a>\1\1\2/)

/**
 * Small const to rename groups that should be highlighted for bots response later
 */
const HIGHLIGHT_GROUP = "HIGHLIGHT";

export function setHighlightGroups(regex: RegExp): RegExp {
  let regexString = regex.source;
  let idx = 0;

  let newRegex = regexString.split(".*").map((string) => {
    return `(?<${HIGHLIGHT_GROUP + idx.toString()}>${string})`;
  }).join(".*");

  return new RegExp(newRegex, regex.flags);
}

// // didn't get to this yet
// export function getSolveLetters(solution: string, promptRegex: RegExp) {
//   let match = promptRegex.exec(solution);
//   if (!match) return getNormalLetters(solution);

//   let promptStartIndex = solution.search(promptRegex);
//   let promptEndIndex = promptStartIndex + match.length; // was match[0]

//   let beforePrompt = solution.slice(0, promptStartIndex);
//   let promptLetters = solution.slice(promptStartIndex, promptEndIndex);
//   let afterPrompt = solution.slice(promptEndIndex);

//   // combine the matches together with the correct emojiMaps
//   return getNormalLetters(beforePrompt) + getPromptLetters(promptLetters) + getNormalLetters(afterPrompt);
// }

// export function getPromptRegexDisplayText(promptRegex: RegExp) {
//   // get the string of the regex
//   let regexString = promptRegex.source;
//   // remove the anchors from the start and end of the regex
//   regexString = regexString.slice(1, regexString.length - 1);

//   // remove the first opening parenthesis from a string
//   regexString = regexString.replace(/\(/, "");
//   let lastParenthesisIndex = regexString.lastIndexOf(")");
//   // remove the last closing parenthesis from a string
//   regexString = regexString.slice(0, lastParenthesisIndex) + regexString.slice(lastParenthesisIndex + 1);

//   let startsWithWildcard = regexString.startsWith(".*");
//   let endsWithWildcard = regexString.endsWith(".*");

//   if (startsWithWildcard && endsWithWildcard) {
//     let displayString = regexString.slice(2, regexString.length - 2);
//     displayString = displayString.replace(/(?<!\\)(?:(?:\\\\)*)\./g, " "); // replace all periods that aren't escaped with a space for prompt rendering
//     if (!invalidPromptDisplayRegex.test(displayString)) {
//       return getNormalLetters(displayString);
//     }
//   }

//   if (startsWithWildcard) regexString = regexString.slice(2);
//   if (endsWithWildcard) regexString = regexString.slice(0, regexString.length - 2);
//   if (!startsWithWildcard) regexString = "^" + regexString;
//   if (!endsWithWildcard) regexString = regexString + "$";

//   return "`/" + regexString + "/`";
// }
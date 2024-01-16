// import { getNormalLetters, getPromptLetters } from "./emoji-renderer";

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
 */
const CUSTOM_REGEX_CAPTURE_NAME = "_cc";

/**
 * Returns a unique name for a capture group
 * 
 * @param index number
 * @returns string
 */
function getUniqueCapturingNames(index: number) {
  return CUSTOM_REGEX_CAPTURE_NAME + index;
}

/**
 * Replaces a character at a given index in the string with a different string
 * 
 * @param string string
 * @param index number
 * @param replacement string
 * @returns string
 */
function replaceAt(string: string, index: number, replacement: string): string {
  return string.substring(0, index) + replacement + string.substring(index + 1);
}

/*
  TODO: Test the regex string BEFORE sending it here, we make assumptions that its a valid regex string to nuke it

  We need to know where all of the backreferences and groups(+named groups) are,
  named groups should be changed to follow our own system
    - but this also means that references to the previous group name needs to be changed with it
  numerical backreferences should be replaced with named backreferences to the CORRECT group

  solution:
  - iterate over all the groups in the regex
    
    - replace "/(?<!\\)\(/" and "/(?<.*?>/" with "(?<__CUSTOM_LARD_CAPTURE{index}>"
      - when replacing named groups, take the <.*?> part and find any NAMED backreferences to it, and replace them with the new name
    
    - replace numeric backreferences with named ones
      - this part becomes Easy because we keep the order of groups when renaming them, so we can just replace the number with the index of the orderedNamedGroups array
        - (ex: replace \1 with orderedNamedGroups[0])

  - at the end replace any backslashes that aren't escaped IF they dont adhere to a whitelist of allowed backslash sequences
    
    (ex: remove anything with \u as we have no reason to let them use unicode character codes)
    - after further thought this might be impossible to do (reliably) without a full regex parser, so its not worth it right now
*/

/**
 * Renames all capturing groups (named and unnamed) and transforms all backreferences into named backreferences  
 * for when we add capturing groups to the regex after
 * 
 * @param regex RegExp
 * @returns RegExp
 */
export function nukeUserRegex(regex: RegExp): RegExp {
  let regexString = regex.source;

  let orderedNamedGroups = [];
  let groupIndex = 0;
  let tempRegexString = regexString;
  // iterate over all groups
  for (let match of tempRegexString.matchAll(/(?<!\\)(\(\?(<.*?>)|\((?!\?))/gmi)) {
    let matchString = match[0];
    if (matchString.startsWith("(?<")) {
      // im pretty sure the third match from this is always gonna be the NAME of the group (if applicable)
      let uniqueName = getUniqueCapturingNames(groupIndex);
      groupIndex++;
      orderedNamedGroups.push(uniqueName);

      // replace the group
      regexString = regexString.replace(match[2], "<" + uniqueName + ">");

      // replace any named backreferences
      for (let match2 of regexString.matchAll(/(?<=\\k)<(.*?)>/gmi)) {
        // match2[0] is the name with the <> wrapped around it
        // match2[1] is the name of the group
        regexString = regexString.replace(match2[0], `<${uniqueName}>`)
      }

    } else {
      let uniqueName = getUniqueCapturingNames(groupIndex);
      groupIndex++;
      orderedNamedGroups.push(uniqueName);

      regexString = replaceAt(regexString, match.index, `(?<${uniqueName}>`);
    }
  }

  // replace numeric backreferences
  // i thought about checking for \\1 instead of \1 but i dont think its a Real issue?
  for (let match of regexString.matchAll(/\\([1-9])/gmi)) {
    // match[0] is \\1
    // match[1] is 1
    regexString = regexString.replace(match[0], `\\k<${orderedNamedGroups[parseInt(match[1]) - 1]}>`);
  }
  
  // console.log(new RegExp(regexString, regex.flags).exec("asdfABABasdasdasdasdABABasdasdABABABAB"))
  // pass the original flags back with it
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
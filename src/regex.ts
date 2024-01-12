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
  let puzzleSource = puzzleRegex.source;

  // ignore ^ and $ anchors (which may or may not be present in this regex),
  // then split the rest by .* (the flexible wildcards)

  const anchoredToStart = puzzleSource.startsWith("^");
  const anchoredToEnd = puzzleSource.endsWith("$");

  // remove the anchors from the start and end of the regex
  const strippedPuzzle = puzzleSource.slice(
    anchoredToStart ? 1 : 0,
    anchoredToEnd ? puzzleSource.length - 1 : puzzleSource.length
  );

  // stopped here due to capturing group issues with user inputted regexes
  // (i.e. the user may have already applied capturing groups to the regex)
  // meaning that their \1 may be replaced with a different capturing group by this function
  // const
}


}

    }
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
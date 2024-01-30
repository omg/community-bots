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
// these aren't currently used anywhere it seems..

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
 * Replaces a character at a given index in the string with another string
 * 
 * @param string The string to replace a character in
 * @param index Where to replace the character
 * @param replacement The string to replace the character with
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
 * Helper function to make sure a regex is valid and renames the groups in it.
 * 
 * This will call {@link renameRegexGroups} after validating that the regex is valid.
 * 
 * @param regex Regex to validate
 * @returns The validated regex
 * @throws PromptException if the regex is invalid
 */
export function validateRegex(regex: string): RegExp {
  try {
    let r = new RegExp(regex);
    r = renameRegexGroups(r);
    return r;
  } catch {
    throw new PromptException("Invalid regex");
  }
}

/**
 * This function renames all of the groups in a regex to unique names, and transforms all backreferences into named backreferences.
 * 
 * It is **REQUIRED** that the regex is valid before passing it to this function, this function works under the assumption that it is valid.
 * Use {@link validateRegex} if you need to validate the regex first.
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

/**
 * Small const to rename groups that shouldnt be highlighted for bots response later
 */
const HIGHLIGHT_GROUP = "NOHIGHLIGHT";

/**
 * This function takes a regex and replaces all instances of .* with (?<NOHIGHLIGHT_>.*)
 * 
 * @param regex Regex to replace all instances of .*
 * @returns A regex with all instances of .* replaced with (?<NOHIGHLIGHT_>.*)
 */
export function setHighlightGroups(regex: RegExp): RegExp {
  let regexString = regex.source;
  let lastIndex = 0;
  let gIndex = 0;

  // find all .* in the regex, and replace them with (?<NOHIGHLIGHT_>.*)
  // unless they have a group around them, in which case we ignore them, because the user wanted them highlighted for whatever reason, technically
  let text = regexString.indexOf(".*");
  // i Autofilled this with chatgpt and modified it a bit so i hope it works without any issues :D
  while (text !== -1) {
    // check if there is a group around the .*, > is for named groups :D
    let groupAround = (regexString[text - 1] === "(" || regexString[text - 1] === ">") && regexString[text + 2] === ")";
    // if there is no group around the .*, then replace it with (?<NOHIGHLIGHT_>.*)
    if (!groupAround) {
      let groupText = `(?<${HIGHLIGHT_GROUP}${gIndex}>.*)`;
      gIndex++;
      regexString = regexString.slice(0, text) + groupText + regexString.slice(text + 2);
      lastIndex = text + groupText.length;
    }
    lastIndex = text + 2;

    // find the next .*
    text = regexString.indexOf(".*", lastIndex);
  }

  return new RegExp(regexString, regex.flags);
}

/**
 * A type to represent letters in a string, and if they should be highlighted or not
 */
type Letters = {
  text: string,
  highlighted: boolean
}

/**
 * Pulls some black magic to get the highlighted letters from a regex match.
 * 
 * @param solution Text to get the highlighted letters from
 * @param regex Regex to use to get the highlighted letters
 * @returns A Letters array with the letters marked for highlighting
 */
export function getHighlightedLetters(solution: string, regex: RegExp): Letters[] {
  let match = regex.exec(solution);
  if (!match) return [{text: solution, highlighted: false}];

  let nonHighlightGroups = Object.keys(match.groups || {}).filter((x) => x.startsWith(HIGHLIGHT_GROUP));

  let lastReplacedIndex = 0;
  let lastMatchedIndex = match[0].length;
  let cutString: Letters[] = [];

  // if the match starts 3 letters in, we know the first 3 letters are included in the match
  if (match.index > 0) {
    cutString.push({text: solution.slice(0, match.index), highlighted: false});
    lastReplacedIndex = match.index;
  }

  for (let group of nonHighlightGroups) {
    // we know this string is highlighted because its been matched, but isnt part of the group
    // (its the text between the match.index/lastReplacedIndex and the start of the nonHighlightGroup)
    let ourString = solution.slice(lastReplacedIndex, solution.indexOf(match.groups[group], lastReplacedIndex));
    cutString.push({text: ourString, highlighted: true});
    
    // we know this string isnt highlighted because its the exact match of the nonHighlightGroup
    cutString.push({text: match.groups[group], highlighted: false})

    lastReplacedIndex += ourString.length + match.groups[group].length;
  }
  // if the .* doesnt end at the end of the string, and theres another character to match (/x.*e/) for explosive
  // we have to add that to the cutString as highlighted
  if (lastReplacedIndex < match[0].length + match.index) {
    cutString.push({text: solution.slice(lastReplacedIndex, match[0].length + match.index), highlighted: true});
    lastReplacedIndex = match[0].length + match.index;
  }
  cutString.push({text: solution.slice(lastReplacedIndex), highlighted: false});

  // TODO: fix this
  // theres a small issue if the .* is at the start or end it will push a empty string to those spots, and i cba to fix it rn
  // it also doesnt make sense for someone to do that :D but alas, this filter works for now
  return cutString.filter((x) => x.text.length > 0);
}

/**
 * Conversion function to turn a Letters Array into a string with the letters converted to emoji letters
 * 
 * @param letters A Letters array to convert
 * @returns A string with the letters converted to emoji letters
 */
export function convertLettersToEmojiLetters(letters: Letters[]): string {
  let emojiString = "";
  for (let text of letters) {
    emojiString += text.highlighted ? getPromptLetters(text.text) : getNormalLetters(text.text);
  }

  return emojiString;
}

/**
 * Conversion function to turn a Letters Array into a string with the letters converted to text
 * 
 * @param letters A Letters array to convert
 * @returns A string with the letters converted to text
 */
export function convertLettersToText(letters: Letters[]): string {
  let textString = "";
  for (let text of letters) {
    textString += text.highlighted ? `**${text.text}**` : text.text;
  }

  return textString;
}

/**
 * Converts a string to a string with the letters converted to emojis or text based on the highlight parameter
 * 
 * @param text A string to convert
 * @param regex A regex to use to highlight the string
 * @param highlight If the string should be emojis (default: true)
 * @returns A string with the letters converted for highlighting
 */
export function convertTextToHighlights(text: string, regex: RegExp, highlight: boolean = true): string {
  regex = setHighlightGroups(regex);
  let letters = getHighlightedLetters(text, regex);
  return highlight ? convertLettersToEmojiLetters(letters) : convertLettersToText(letters);
}

/**
 * Regular expression used to check if the prompt display contains any invalid characters. Only uppercase letters, numbers, apostrophes, hyphens, at symbols, and spaces are considered valid.
 */
const invalidPromptDisplayRegex = /[^A-Z0-9'\-@ ]/;

/**
 * This function will take a regex as input and return either a prompt-like display string or a regex encapsulated in backticks.
 * 
 * If fancy is true, it is expected for use in a place such as a Discord text channel.
 * The prompt display string will use white letters emojis, and the regex will be encapsulated in backticks (`).
 * 
 * If fancy is false, it is expected for use in a place such as a Discord presence.
 * The prompt display string will use normal letters, and the regex will be returned without encapsulation.
 *
 * @param regex The regular expression
 * @returns The display string
 * 
 * @example
 * ```typescript
 * getPromptRegexDisplayText(new RegExp("[A-Z]{3}")); // returns "`/[A-Z]{3}/`"
 * getPromptRegexDisplayText(new RegExp("AB")); // returns AB in white emoji letters
 * 
 * getPromptRegexDisplayText(new RegExp("[A-Z]{3}"), false); // returns "/[A-Z]{3}/"
 * getPromptRegexDisplayText(new RegExp("AB"), false); // returns "AB"
 * ```
 */
export function getPromptRegexDisplayText(regex: RegExp, fancy: boolean = true): string {
  // get the string of the regex
  let regexString = regex.source;

  // check if the regex string has only displayable charaacters.
  // this is not a perfect check, but it should totally be good enough for our purposes
  if (!invalidPromptDisplayRegex.test(regexString)) {
    return fancy ? getNormalLetters(regexString) : regexString;
  }

  return fancy ? "`/" + regexString + "/`" : "/" + regexString + "/";
}

/**
 * Finds the repeatable portion of a prompt regular expression. This is used to determine if a player has repeated the prompt in Word Bomb Mini.
 *
 * @param regex The regular expression used to extract the repeatable text
 * @returns The repeatable portion of the regex, or undefined if the regex is not repeatable
 * 
 * @example
 * ```typescript
 * getPromptRepeatableText(new RegExp("AB")); // "AB"
 * getPromptRepeatableText(/(.*)(\1)/); // undefined
 * ```
 */
export function getPromptRepeatableText(regex: RegExp): string | undefined {
  // get the string of the regex
  let regexString = regex.source;

  // check if the regex string has only displayable charaacters.
  // this is not a perfect check, but it should totally be good enough for our purposes
  if (!invalidPromptDisplayRegex.test(regexString)) {
    return regexString;
  }

  return undefined;
}
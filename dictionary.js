const fs = require('node:fs');

// TODO: pull dictionaries from Vivi API
try {
  var dictionaryString = fs.readFileSync('./dictionaries/english.txt', 'utf8');
  console.log("Retrieved the English dictionary from file.");
} catch (e) {
  console.log("Couldn't read the English dictionary!");
}

function cleanWord(word) {
  return word.toUpperCase().replace(/[‘’]/g, "'").replace(/\-/g, '\-').replace(/…/g, '...').trim();
}

const regexTest = /(?:^| )\/(.*)\/(?: |$)/;

function PromptException(message) {
   this.message = message;
   this.name = "PromptException";
}

function getPromptRegexFromPromptSearch(promptQuery) {
  let cleanQuery = cleanWord(promptQuery);
  let regexResult = regexTest.exec(cleanQuery);
  
  // TODO find args in the query
  
  if (regexResult) {
    // This has regex

    if (cleanQuery.includes("`")) {
      throw new PromptException("The regex you've entered is invalid.");
    }

    let regexInput = regexResult[1];

    // escape parentheses from the regex input
    regexInput = regexInput.replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    if (regexInput === "") {
      // This regex is empty
      throw new PromptException("The regex you've entered is empty.");
    }

    // add capturing group to the regex
    regexInput = "(" + regexInput + ")";

    if (!regexInput.startsWith("^")) regexInput = ".*" + regexInput;
    if (!regexInput.endsWith("$")) regexInput = regexInput + ".*";

    // check if the regex is valid
    let regex;
    try {
      regex = new RegExp("^" + regexInput + "$", "m");
    } catch (e) {
      throw new PromptException("The regex you've entered is invalid.");
    }

    return regex;
  } else {
    // This isn't regex

    if (cleanQuery.includes("`")) {
      throw new PromptException("The prompt you've entered is invalid.");
    }

    // will this even work? I don't know. I'm not a regex expert. I'm just a guy who wants to make a bot. :(
    return new RegExp("^.*(" + escapeRegExp(cleanQuery).replace(/\\\?|\\\./g, '.') + ").*$", "m");
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isWord(word) {
  let cleanInput = cleanWord(escapeRegExp(word));
  return new RegExp("^.*" + cleanInput + ".*$", "m").test(dictionaryString);
}

function solveRegex(regex) {
  // recreate the regex with the global flag
  if (!regex.flags.includes("g")) {
    regex = new RegExp(regex.source, regex.flags + "g");
  }

  let solutions = [];

  let match;
  while (match = regex.exec(dictionaryString)) {
    solutions.push(match[0]);
  }
  
  return solutions;
}

function solvePrompt(prompt) {
  return solveRegex(new RegExp("^.*(" + escapeRegExp(prompt) + ").*$", "gm"));
}

module.exports = {
  cleanWord,
  getPromptRegexFromPromptSearch,
  isWord,
  solvePrompt,
  solveRegex
}
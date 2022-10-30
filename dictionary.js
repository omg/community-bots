// TODO: pull dictionaries from Vivi API
try {
  var dictionaryString = fs.readFileSync('./Dictionaries/English/Dictionary.txt', 'utf8');
  console.log("Retrieved the English dictionary from file.");
} catch (e) {
  console.log("Couldn't read the English dictionary!");
}

function cleanWord(word) {
  return word.toUpperCase().replace(/[‘’]/g, "'").replace(/\-/g, '\-').replace(/…/g, '...');
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

    let regexInput = regexResult[1];

    if (regexInput === "") {
      // This regex is empty
      throw new PromptException("The regex you've entered is empty.");
    }

    // check if the regex is valid
    let regex;
    try {
      regex = new RegExp("^.*" + regexInput + ".*$", "gm");
    } catch (e) {
      throw new PromptException("The regex you've entered is invalid.");
    }

    return regex;
  } else {
    // This isn't regex

    // will this even work? I don't know. I'm not a regex expert. I'm just a guy who wants to make a bot. :(
    return new RegExp("^.*" + escapeRegExp(cleanQuery).replace(/\\\?|\\\./g, '.') + ".*$", "gm");
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isWord(word) {
  let cleanWord = cleanWord(escapeRegExp(word));
  return new RegExp("^.*" + cleanWord + ".*$", "m").test(dictionaryString);
}

function solveRegex(regex) {
  let solves = [];

  let match;
  while (match = regex.exec(dictionaryString)) {
    solves.push(match[1]);
  }
  
  return solves;
}

function solvePrompt(prompt) {
  return solveRegex(new RegExp("^.*" + escapeRegExp(prompt) + ".*$", "gm"));
}

module.exports = {
  cleanWord,
  getPromptRegexFromPromptSearch,
  isWord,
  solvePrompt,
  solveRegex
}
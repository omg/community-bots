// TODO: pull dictionaries from Vivi API
try {
  var dictionaryString = fs.readFileSync('./Dictionaries/English/Dictionary.txt', 'utf8');
  console.log("Retrieved the English dictionary from file.");
} catch (e) {
  console.log("Couldn't read the English dictionary!");
}

function cleanWord(word) {
  return word.replace(/[‘’]/g, "'").replace(/\-/g, '\-').replace(/…/g, '...');
}

const regexTest = /(?:^| )\/(.*)\/(?: |$)/;

function getPromptRegexFromPromptSearch(promptQuery) {
  let cleanQuery = cleanWord(promptQuery);
  let regexResult = regexTest.exec(promptQuery);
  
  // TODO find args in the query
  
  if (regexResult) {
    // This has regex
    if (regexResult[1] === "") {
      // This regex is empty
      throw "The regex you've entered is empty.";
    }

    return regexResult[1]; // TODO
  } else {
    // This isn't regex
    return cleanQuery.replace(/\?/g, '.');
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isMessageASolution(word) {
  let cleanWord = cleanWord(escapeRegExp(word));
  return new RegExp("^.*" + cleanWord + ".*$", "m").test(dictionaryString);
}
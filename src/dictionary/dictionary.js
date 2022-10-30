const { fork } = require('child_process');
const fs = require('node:fs');
const path = require('path');

// TODO: pull dictionaries from Vivi API
try {
  var dictionaryString = fs.readFileSync(path.join(__dirname, '../../assets/word-lists/dictionaries/english.txt'), 'utf8');
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

    if (regexInput === "") {
      // This regex is empty
      throw new PromptException("The regex you've entered is empty.");
    }

    if (regexInput.startsWith("^")) {
      regexInput = "(" + regexInput.slice(1);
    } else {
      regexInput = ".*(" + regexInput;
    }
    if (regexInput.endsWith("$")) {
      regexInput = regexInput.slice(0, -1) + ")";
    } else {
      regexInput = regexInput + ").*";
    }

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

async function solvePrompt(promptRegex) {
  // recreate the regex with the global flag
  if (!promptRegex.flags.includes("g")) {
    promptRegex = new RegExp(promptRegex.source, promptRegex.flags + "g");
  }

  let solutions = [];

  let match;
  while (match = promptRegex.exec(dictionaryString)) {
    solutions.push(match[0]);
  }
  
  return solutions;
}

function SolveWorkerException(message) {
  this.message = message;
  this.name = "SolveWorkerException";
}

function solvePromptWithTimeout(promptRegex, timeout) {
  return new Promise((resolve, reject) => {
    const worker = fork('./solve-worker.js');

    let timeoutId = setTimeout(() => {
      worker.kill();
      reject(new SolveWorkerException("Your regex took too long to compute and timed out."));
    }, timeout);
    
    worker.on('message', (solutions) => {
      clearTimeout(timeoutId);
      worker.kill();
      resolve(solutions);
    });
    
    worker.on('error', (e) => {
      clearTimeout(timeoutId);
      worker.kill();
      reject(e);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timeoutId);
        reject(new SolveWorkerException('Your regex failed to compute.'));
      }
    });
    
    worker.send({ dictionaryString, regexSource: promptRegex.source });
  });
}

module.exports = {
  cleanWord,
  getPromptRegexFromPromptSearch,
  isWord,
  solvePrompt,
  solvePromptWithTimeout
}
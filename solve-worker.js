process.on('message', (data) => {
  const { dictionaryString, regexSource } = data;
  const promptRegex = new RegExp(regexSource, "gm");

  let solutions = [];

  let match;
  while (match = promptRegex.exec(dictionaryString)) {
    solutions.push(match[0]);
  }

  process.send(solutions);
});

setTimeout(() => {}, 10000);
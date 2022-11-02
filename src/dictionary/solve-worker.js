process.on('message', (data) => {
  const { dictionaryString, regexSource } = data;
  const promptRegex = new RegExp(regexSource, "gm");

  // /^.*(\R).*$/gm

  // console.log("Solving prompt with regex: " + promptRegex);
  // console.log("Source: " + promptRegex.source);

  let solutions = [];

  let match;
  while (match = promptRegex.exec(dictionaryString)) {
    solutions.push(match[0]);
  }

  process.send(solutions);
});

setTimeout(() => {}, 10000);
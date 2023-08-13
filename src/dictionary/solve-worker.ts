type SolveData = {
  dictionaryString: string;
  regexSource: RegExp;
};

process.on("message", (data: SolveData) => {
  const { dictionaryString, regexSource } = data;
  const promptRegex = new RegExp(regexSource, "gm");

  // /^.*(\R).*$/gm

  // console.log("Solving prompt with regex: " + promptRegex);
  // console.log("Source: " + promptRegex.source);

  let solutions = [];

  let match: RegExpExecArray;
  while (match = promptRegex.exec(dictionaryString)) {
    solutions.push(match[0]);
  }

  process.send(solutions);
});

setTimeout(() => {}, 10000);

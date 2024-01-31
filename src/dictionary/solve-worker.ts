type SolveData = {
  dictionaryString: string;
  regexSource: RegExp;
};

process.on("message", (data: SolveData) => {
  const start = Date.now();
  const { dictionaryString, regexSource } = data;

  const promptRegex = new RegExp(regexSource, "i"); // why recreate the regex ..?
  console.log("Solving prompt with regex: " + promptRegex);

  // split the dictionary by newlines
  let words = dictionaryString.split("\n");

  let solutions = [];

  let word;
  for (let i = 0; i < words.length; i++) {
    word = words[i];
    if (promptRegex.test(word)) {
      solutions.push(word);
    }
  }

  const end = Date.now();

  console.log("Took " + (end - start) + "ms to solve prompt.");

  process.send(solutions);
});

setTimeout(() => {}, 10000);

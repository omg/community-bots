type ExtendedSolveData = {
  dictionary: Set<string>;
  regex: RegExp;
  filter?: (word: string) => boolean;
}

process.on("message", (data: ExtendedSolveData) => {
  const start = Date.now();
  
  let { dictionary, regex, filter } = data;
  
  console.log("Solving " + regex.source + "...");
  
  let solutions = [];
  dictionary.forEach(word => {
    if (regex.test(word) && filter(word)) {
      solutions.push(word);
    };
  });

  
  const end = Date.now();
  console.log("Took " + (end - start) + "ms to solve.");
  
  process.send(solutions);
});

setTimeout(() => {}, 10000);
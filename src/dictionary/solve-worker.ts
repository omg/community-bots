process.on("message", (data: { dictionary: string[], regex: string }) => {

  let { regex } = data;
  let newRegex = new RegExp(regex, "i");
  let solutions = [];
  // console.time("Solving");
  for (let word of data.dictionary) {
    if (newRegex.test(word)) {
      solutions.push(word);
    }
  };
  // console.timeEnd("Solving");
  
  process.send(solutions);
});

setTimeout(() => {}, 10000);
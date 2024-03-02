// type ExtendedSolveData = {
//   dictionary: Set<string>;
//   regex: RegExp;
//   filter: (word: string) => boolean;
// }
import { getDictionary } from "./dictionary";
let dictionary = getDictionary();


process.on("message", (data: { dictionary: string[], regex: string }) => {
  const start = Date.now();

  let { regex } = data;
  let newRegex = new RegExp(regex, "i");
  
  let solutions = [];
  console.time("Solving");
  for (let word of dictionary) {
    if (newRegex.test(word)) {
      solutions.push(word);
    }
  };
  console.timeEnd("Solving");

  const end = Date.now();
  console.log("Took " + (end - start) + "ms to solve.");
  
  process.send(solutions);
});

setTimeout(() => {}, 10000);
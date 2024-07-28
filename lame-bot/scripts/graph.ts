import * as fs from "fs";
import { generatePrompt } from "../../src/dictionary/dictionary";

// Kil lMe
(async () => {
  const solutionCounts = [];
  let promises = [];
  for (let i = 0; i < 50; i++) {
    for (let i = 0; i < 100; i++) {
      promises.push(generatePrompt());
    }
    const results = await Promise.all(promises);
    results.forEach(result => {
      solutionCounts.push(result.solutions.size);
    });
    promises = [];
    console.log("Batch complete --------------------------------------------- " + i);
  }
  const file = fs.createWriteStream("dist/solutions.txt");
  file.write(solutionCounts.join("\n"));
  file.end();
  console.log("Done!");
})();
import { WBMRemarkData } from "../games/wbmgame";
import fs from "node:fs";
import path from "node:path";


// TODO: Maybe right ?
const REMARKDIR = path.join(__dirname, "modules");
const ALLREMARKS: Remark[] = [];
walkRemarkDir();

type Remark = {
  index?: number;

  execute: (data: WBMRemarkData) => string;
}

function walkRemarkDir() {
  const remarkFiles = fs
    .readdirSync(REMARKDIR)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  remarkFiles.forEach((file) => {
    const remark = require(`${REMARKDIR}/${file}`);

    // disable a remark if its testing or somethings wrong with it
    if (remark.execute && !remark.disabled) {
      ALLREMARKS.push({ index: remark.index ? remark.index : -1, execute: remark.execute });
    };
  });

  ALLREMARKS.sort((a, b) => b.index - a.index);
}

export async function getRemarks(data: WBMRemarkData): Promise<string> {
  let promiseResults = await Promise.all(ALLREMARKS.map(async (remark) => {
    // remarks should be executed in the same order they are added (sorted by index)
    // so we shouldnt have to worry about ordering them later
    // will there be issues with remarks having the same index..? hope not...
    return await remark.execute(data);
  }));
  let r = promiseResults.filter((s) => s !== "" && s).join("\n");
  console.log(promiseResults.filter((s) => s !== "" && s), r);
  return r;
}


// let exampleData: RemarkRelatedData = {
//   prevRound: {
//     winner: {
//       userDisplayName: "Jeft",
//       user: "425117122767618058",
//       solution: "plonk",
//       usedVivi: true,
//     },
//     solvers: [
//       {
//         userDisplayName: "Jeft",
//         user: "425117122767618058",
//         solution: "plonk",
//         usedVivi: true,
//       },
//     ],
//     rawPrompt: "lon",
//     prompt: /lon/i,
//     promptWord: "plonk",
//     promptWordLength: 3,
//     solutionCount: 1,
//     solutions: new Set(["plonk"]),
//     lengthRequired: false,

//     startedAt: 0,
//     completedAt: 0,
//   },

//   round: {
//     winner: {
//       userDisplayName: "Jeft",
//       user: "425117122767618058",
//       solution: "plank",
//       usedVivi: true,
//     },
//     solvers: [
//       {
//         userDisplayName: "Jeft",
//         user: "425117122767618058",
//         solution: "plank",
//         usedVivi: true,
//       },
//     ],
//     rawPrompt: "pl.",
//     prompt: /pl./i,
//     promptWord: "plank",
//     promptWordLength: 3,
//     solutionCount: 1,
//     solutions: new Set(["plank"]),
//     lengthRequired: false,

//     startedAt: 0,
//     completedAt: 0,
//   },
  
//   streak: {
//     user: "425117122767618058",
//     userDisplayName: "Jeft",
//     consecutiveWins: 9999,

//     previous: {
//       user: "425117122767618058",
//       userDisplayName: "Jeft",
//       consecutiveWins: 9998,
//     }
//   },

//   postRoundWinnerData: {
//     rankingBefore: 2,
//     rankingAfter: 1,
//     solveCount: 100000,
//     exactSolves: 100000,
//   }
// };

// (async () => {
//   let remarks = await getRemarks(exampleData);
//   console.log(remarks);
// })();
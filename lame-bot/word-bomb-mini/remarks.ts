// const REMARK = {
//     // top remarks
//     jinx: 97,
//     tooLate: 94,
  
//     // separator
//     topSeparator: 89,
  
//     // rank remarks
//     rankShift: 79,
  
//     // solve remarks
//     solveNumber: 59,
//     exactSolve: 57,
  
//     // prompt stat remarks
//     uniqueSolve: 39,
//     promptiversary: 38,
//     sameSolvePromptiversary: 37,
  
//     // round remarks
//     solveStreak: 18,
//     usedSolver: 17,
//     promptOrigin: 16
//   };

type FakeSolveData = {
    lateSolvers: string[];
}

export const REMARKS: Remark[] = [];

// i think this needs a better Name
interface Remark {
    name: string;
    index?: number; // where the index should be ordered, if its not present we will just toss it on at the very end, along with any other remarks that dont have an index
    message?: string; // this should be edited by the validator to include the Correct information

    // i dont like this approach if its intended to be used for different gamemodes, because then we have to have a validator for each gamemode?
    // this any should be a type that is specific to the gamemode, in this case wbm
    validator: (info: any) => boolean;
}

REMARKS.push({
    name: "jinx",
    index: 97,
    validator: (info: any) => {
        return info.jinx;
    }
});
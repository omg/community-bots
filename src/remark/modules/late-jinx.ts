import { getRemarkEmoji } from "../../emoji-renderer";
import { engLen } from "../../games/game-utils";
import { RemarkRelatedData } from "../../games/wbm"; 
import { createEnglishList } from "../../utils";

const JINX_APPENDS = [
  "just jinxed each other!",
  "also jinxed each other!",
  "jinxed each other too!",
  "jinxed each other as well!",
  "jinxed each other!",
];

function mergeRemarks(s: string[]): string {
  return s.join("\n");
}

export function execute(data: RemarkRelatedData): string {
  if (data.round.solvers.length === 1) return;

  let jinxRemarks = [];
  let lateRemarks = [];
  let jinxList = [];

  let lateSolvers = data.round.solvers.slice(1);
  let wordsUsed = [...new Set(lateSolvers.map((solver) => solver.solution))];
  let lateSolversWhoHaveNotJinxed = [...lateSolvers];

  for (let word of wordsUsed) {
    let playersWhoUsedWord = data.round.solvers
      .filter((solver) => solver.solution === word)
      .map((solver) => solver.user);
    
    if (playersWhoUsedWord.length > 1) {
      // some people jinxed
      lateSolversWhoHaveNotJinxed = lateSolversWhoHaveNotJinxed
        .filter((solver) => !playersWhoUsedWord.includes(solver.user));
      
      jinxList.push(playersWhoUsedWord);
    }
  };

  // add jinx remarks
  for (let i = 0; i < jinxList.length; i++) {
    let jinxers = jinxList[i];
    let names = jinxers.map((id) => data.round.solvers.find((solver) => solver.user === id).userDisplayName);
    let jinxText = JINX_APPENDS[i] || JINX_APPENDS[JINX_APPENDS.length - 1];

    jinxRemarks.push(
      `${getRemarkEmoji("jinx")}` +
      " **" +
      createEnglishList(names) +
      "** " +
      jinxText,
    );
  };

  let jinxRemark = mergeRemarks(jinxRemarks);

  // add late remarks
  let lateNames = lateSolversWhoHaveNotJinxed.map((solver) => solver.userDisplayName);
  if (lateNames.length > 0) {
    lateRemarks.push(
      `**${createEnglishList(lateNames)}** ${engLen(
        lateNames,
        "was",
        "were"
      )} too late..`,
    );
  };

  let lateRemark = mergeRemarks(lateRemarks);

  return jinxRemark + "\n" + lateRemark;
}

export const index = 94;

export const disabled = false;
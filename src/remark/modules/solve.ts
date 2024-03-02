import { is10000Related, is1000Related, is100Related, is1Related, isDoomRelated } from "../../dictionary/dictionary";
import { getRemarkEmoji } from "../../emoji-renderer";
import { formatPlacementWithEnglishWords } from "../../games/game-utils";
import { RemarkRelatedData } from "../../games/wbm";
import { formatNumber } from "../../utils";

function createSolveRemark(
  data: RemarkRelatedData, 
  solveNumber: number, 
  ): string {
    let remark = "";
    let winnerSolution = data.round.winner.solution;
    let isExactSolve = data.round.winner.solution === data.round.promptWord;

    let solveNumberOnlyHas6 = solveNumber
    .toString()
    .split("")
    .every((digit) => digit === "6");
    let solveNumberEndsIn69 = solveNumber % 100 === 69;
    let solveNumberStartsWith6 = solveNumber.toString().startsWith("6");
    let solveNumberEndsWith9 = solveNumber.toString().endsWith("9");
    let solveNumberOnlyHas6and9 = solveNumber
      .toString()
      .split("")
      .every((digit) => digit === "6" || digit === "9");


    let hasRemarkedExactness = false;

    if (solveNumber === 1) {
      remark += getRemarkEmoji("solve1") + " Congratulations on your **first solve**!";
      if (is1Related(winnerSolution)) {
        remark += "\n" + 
          getRemarkEmoji("solve1related") + 
          ` **Amazing!** Your first solve was "${winnerSolution}"!`;
      }

      if (isExactSolve) {
        remark += "\n" + 
          getRemarkEmoji("solve1Exact") +
          " **What?!** It's your first exact solve too?!";

        hasRemarkedExactness = true;
      }
    } else if (solveNumber % 10000 === 0) {
      remark += 
        getRemarkEmoji("solve10000") +
        ` this is your **${formatNumber(solveNumber)}th solve**!!! Unbelievable!`;

      if (solveNumber === 10000 && is10000Related(winnerSolution)) {
        remark += "\n" +
          getRemarkEmoji("solve10000related") +
          ` **AMAZING!** Your 10,000th solve was "${winnerSolution.toLowerCase()}"!`;
      }
    } else if (solveNumber % 1000 === 0) {
      remark += 
        getRemarkEmoji("solve1000") +
        ` This is your **${formatNumber(solveNumber)}th solve**!!! Awesome!`;

      if (solveNumber === 1000 && is1000Related(winnerSolution)) {
        remark += "\n" +
          getRemarkEmoji("solve1000related") +
          ` **Awesome!** Your 1,000th solve was "${winnerSolution.toLowerCase()}"!`;
      }
    } else if (solveNumber % 100 === 0) {
      remark += 
        getRemarkEmoji("solve100") +
        ` This is your **${formatNumber(solveNumber)}th solve**!`;

      if (solveNumber === 100 && is100Related(winnerSolution)) {
        remark += "\n" +
          getRemarkEmoji("solve100related") +
          ` **Awesome!** Your 100th solve was "${winnerSolution.toLowerCase()}"!`;
      }
    } else if ( solveNumberEndsIn69 || 
      ( solveNumberStartsWith6 && solveNumberEndsWith9 && solveNumberOnlyHas6and9 )
    ) {
      remark += 
        getRemarkEmoji("solve69") +
        ` This is your **${formatNumber(solveNumber)}th solve**. Nice.`;
    } else if (solveNumberOnlyHas6 && solveNumber > 600) {
      remark +=
        getRemarkEmoji("solve666") +
        ` **${formatNumber(solveNumber)}th solve..**`;

      if (isDoomRelated(winnerSolution)) {
        remark += "\n" +
          getRemarkEmoji("solve666related") +
          ` **Of course,** you solved it with "${winnerSolution.toLowerCase()}"..`;
      }
    }

    if (isExactSolve && !hasRemarkedExactness) {
      remark += "\n" +
        getRemarkEmoji("solveExact") +
        ` **Lucky!** That's your **${formatPlacementWithEnglishWords(data.postRoundWinnerData.exactSolves)} exact solve**!`;
    }

    return remark;
}

export function execute(data: RemarkRelatedData): string {
  let remark = createSolveRemark(data, data.postRoundWinnerData.solveCount);

  return remark;
}

export const index = 59;

export const disabled = false;
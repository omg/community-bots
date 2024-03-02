import { getFirstSolutionToPrompt, getSolutionCount, getUserSolveCountForPrompt } from "../../database/db";
import { getRemarkEmoji } from "../../emoji-renderer";
import { formatPlacementWithEnglishWords } from "../../games/game-utils";
import { RemarkRelatedData } from "../../games/wbm";
import { getPromptRegexDisplayText } from "../../regex";

function getCurrentPromptName(data: RemarkRelatedData): string {
  return (
    getPromptRegexDisplayText(data.round.prompt, false) +
    (data.round.lengthRequired ? " - " + data.round.promptWord.length : "")
  );
}

export async function execute(data: RemarkRelatedData): Promise<string> {
  let solveCountForPrompt = await getUserSolveCountForPrompt(
    data.round.winner.user,
    data.round.prompt,
    data.round.lengthRequired ? data.round.promptWord.length : 0,
  );

  let finalRemark = "";

  if (
    solveCountForPrompt === 5 ||
    solveCountForPrompt === 10 ||
    solveCountForPrompt % 25 === 0
  ) {
    finalRemark += getRemarkEmoji("promptiversary") + 
      ` It's your **${formatPlacementWithEnglishWords(solveCountForPrompt)} promptiversary** with "${getCurrentPromptName(data)}"!`;
  }

  if (solveCountForPrompt === 5) {
    let firstSolutionToPrompt = await getFirstSolutionToPrompt(
      data.round.winner.user,
      data.round.prompt,
      data.round.lengthRequired ? data.round.promptWord.length : 0,
    )

    if (firstSolutionToPrompt === data.round.winner.solution) {
      finalRemark += "\n" +
        getRemarkEmoji("promptiversaryStale") +
        " You solved this prompt with the **same word** as your first time!"
    };
  }

  return finalRemark;
}

export const index = 38;

export const disabled = false;

import { getFirstSolutionToPrompt, getUserSolveCountForPrompt } from "../../database/db";
import { getRemarkEmoji } from "../../emoji-renderer";
import { formatPlacementWithEnglishWords } from "../../games/game-utils";
import { WBMRemarkData } from "../../games/wbmgame";
import { getPromptRegexDisplayText } from "../../regex";

function getCurrentPromptName(data: WBMRemarkData): string {
  return (
    getPromptRegexDisplayText(data.currRound.prompt, false) +
    (data.currRound.lengthRequired
      ? " - " + data.currRound.promptWord.length
      : "")
  );
}

export async function execute(data: WBMRemarkData): Promise<string> {
  let solveCountForPrompt = await getUserSolveCountForPrompt(
    data.currRound.winner.user,
    data.currRound.prompt,
    data.currRound.lengthRequired ? data.currRound.promptWord.length : 0
  );

  let finalRemark = "";

  if (
    solveCountForPrompt === 5 ||
    solveCountForPrompt === 10 ||
    (solveCountForPrompt % 25 === 0 && solveCountForPrompt !== 0)
  ) {
    finalRemark +=
      getRemarkEmoji("promptiversary") +
      ` It's your **${formatPlacementWithEnglishWords(
        solveCountForPrompt
      )} promptiversary** with "${getCurrentPromptName(data)}"!`;
  }

  if (solveCountForPrompt === 5) {
    let firstSolutionToPrompt = await getFirstSolutionToPrompt(
      data.currRound.winner.user,
      data.currRound.prompt,
      data.currRound.lengthRequired ? data.currRound.promptWord.length : 0
    );

    if (firstSolutionToPrompt === data.currRound.winner.solution) {
      finalRemark +=
        "\n" +
        getRemarkEmoji("promptiversaryStale") +
        " You solved this prompt with the **same word** as your first time!";
    }
  }

  return finalRemark;
}

export const index = 38;

export const disabled = false;

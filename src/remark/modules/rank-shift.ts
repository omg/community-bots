import { getRemarkEmoji } from "../../emoji-renderer";
import { isPlural } from "../../games/game-utils";
import { WBMRemarkData } from "../../games/wbmgame";
import { formatNumber } from "../../utils";

export function execute(data: WBMRemarkData): string {
  let rankingBefore = data.postRoundWinnerData.rankingBefore;
  let rankingAfter = data.postRoundWinnerData.rankingAfter;
  let solveNumber =
    data.postRoundWinnerData.rankingDocuments["All-Time"].solves;

  if (!rankingBefore || solveNumber <= 1 || rankingAfter >= rankingBefore)
    return "";

  if (rankingAfter === 1) {
    return (
      getRemarkEmoji("firstPlace") +
      " **You have taken first place!** (All-Time)"
    );
  }

  return (
    getRemarkEmoji("rankingMovement") +
    ` You went up **${formatNumber(rankingBefore - rankingAfter)}** ${isPlural(
      rankingBefore - rankingAfter,
      "place",
      "places"
    )}, you're now **${formatNumber(rankingAfter)}**! (All-Time)`
  );
}

export const index = 79;

export const disabled = false;

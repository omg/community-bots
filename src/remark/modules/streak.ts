import { getRemarkEmoji, getStreakNumbers } from "../../emoji-renderer";
import { isNumberVowelSound } from "../../games/game-utils";
import { RemarkRelatedData } from "../../games/wbm";

let specialStreakEmojis = {
  "320593811531235328": "solveStreakChristine",
  "711739947606081676": "solveStreakDubious",
}

function getStreakEmoji(userId: string) {
  return specialStreakEmojis[userId] || "solveStreak";
}

export async function execute(data: RemarkRelatedData): Promise<string> {
  if (data.streak.consecutiveWins < 3) return "";
  
  if (data.streak.user === data.streak.previous.user) {
    // winner is on a solve STREAK!
    let solveStreakEmoji = getStreakEmoji(data.round.winner.user);
    return `**${getRemarkEmoji(solveStreakEmoji)} You're on ${isNumberVowelSound(data.streak.consecutiveWins) ? "an": "a"} ${getStreakNumbers(data.streak.consecutiveWins)} solve streak! ${getRemarkEmoji(solveStreakEmoji)}**`;
  } else {
    // different winner
    return `${getRemarkEmoji("streakEnded")} **${data.prevRound.winner?.userDisplayName + (data.prevRound.winner?.userDisplayName.endsWith("s") ? "'" : "'s")}** solve streak of **${data.streak.previous.consecutiveWins}** has been ended!`;
  }
}

export const index = 18;

export const disabled = false;

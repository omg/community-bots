import { getRemarkEmoji, getStreakNumbers } from "../../emoji-renderer";
import { isNumberVowelSound } from "../../games/game-utils";
import { WBMRemarkData } from "../../games/wbmgame";

let specialStreakEmojis = {
  "320593811531235328": "solveStreakChristine",
  "711739947606081676": "solveStreakDubious",
}

function getStreakEmoji(userId: string) {
  return specialStreakEmojis[userId] || "solveStreak";
}

export async function execute(data: WBMRemarkData): Promise<string> {
  if (data.streak.consecutiveWins >= 3) {
    let solveStreakEmoji = getStreakEmoji(data.streak.user);
    return `**${getRemarkEmoji(solveStreakEmoji)} You're on ${isNumberVowelSound(data.streak.consecutiveWins) ? "an": "a"} ${getStreakNumbers(data.streak.consecutiveWins)} solve streak! ${getRemarkEmoji(solveStreakEmoji)}**`;
  } else if (data.streak.consecutiveWins === 1 && data.streak.previous?.consecutiveWins >= 3) {
    return `${getRemarkEmoji("streakEnded")} **${data.streak.previous.userDisplayName + (data.streak.previous.userDisplayName.endsWith("s") ? "'" : "'s")}** solve streak of **${data.streak.previous.consecutiveWins}** has been ended!`;
  } 
}

export const index = 18;

export const disabled = false;

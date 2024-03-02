import { getRemarkEmoji } from "../../emoji-renderer";
import { RemarkRelatedData } from "../../games/wbm";

// the usedVivi property is ambiguous, its likely that the person used it to get a word that solves the prompt
// but it is also triggered by just using the solver in any way During the round
export async function execute(data: RemarkRelatedData): Promise<string> {
  if (data.round.winner.usedVivi) return getRemarkEmoji("usedVivi") + " This player **used the solver** during this round.";

  return "";
}

export const index = 17;

export const disabled = false;

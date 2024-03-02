import { getSolutionCount } from "../../database/db";
import { getRemarkEmoji } from "../../emoji-renderer";
import { RemarkRelatedData } from "../../games/wbm";

export async function execute(data: RemarkRelatedData): Promise<string> {
  let useCount = await getSolutionCount(data.round.winner.solution);

  if (useCount === 1) {
    return getRemarkEmoji("uniqueSolve") + " That's the **first time** this solve has ever been used!"; 
  }

  return "";
}

export const index = 39;

export const disabled = false;

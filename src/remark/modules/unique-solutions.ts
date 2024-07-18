import { getSolutionCount } from "../../database/db";
import { getRemarkEmoji } from "../../emoji-renderer";
import { WBMRemarkData } from "../../games/wbmgame";

export async function execute(data: WBMRemarkData): Promise<string> {
  let useCount = await getSolutionCount(data.currRound.winner.solution);

  if (useCount === 1) {
    return getRemarkEmoji("uniqueSolve") + " That's the **first time** this solve has ever been used!"; 
  }
}

export const index = 39;

export const disabled = false;

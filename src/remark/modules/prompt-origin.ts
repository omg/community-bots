import { WBMRemarkData } from "../../games/wbmgame";

export async function execute(data: WBMRemarkData): Promise<string> {
  return `This prompt was created from "${data.currRound.promptWord.toLowerCase()}"`;
}

export const index = 16;

export const disabled = false;

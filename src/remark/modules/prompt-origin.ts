import { getRemarkEmoji } from "../../emoji-renderer";
import { RemarkRelatedData } from "../../games/wbm";

export async function execute(data: RemarkRelatedData): Promise<string> {
  return `This prompt was created from "${data.round.promptWord.toLowerCase()}"`;
}

export const index = 16;

export const disabled = false;

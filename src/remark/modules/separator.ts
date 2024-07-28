import { WBMRemarkData } from "../../games/wbmgame";

// this is to separate certain remarks from others, for formatting reasons
//
// NOTE: Any remarks made with the intention of separating other remarks should be a SINGLE SPACE !!!
//       I made the mistake of being a Idiot and having to find out why newlines wouldnt work the hard way :deep:
//
// see example here: https://b.cgas.io/zeyy__GzR5x9.png
export async function execute(data: WBMRemarkData): Promise<string> {
  return " ";
}

export const index = 89;

export const disabled = false;

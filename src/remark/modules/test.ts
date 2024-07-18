import { WBMRemarkData } from "../../games/wbmgame";

export function execute(data: WBMRemarkData): string {
  if (data.currRound.winner?.solution == "plank") {
    return "Holy Moly Plonk";
  }
}

export const index = 999;

export const disabled = true;
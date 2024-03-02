import { RemarkRelatedData } from "../../games/wbm";

export function execute(data: RemarkRelatedData): string {
  if (data.round.winner?.solution == "plank") {
    return "Holy Moly Plonk";
  }
}

export const index = 999;

export const disabled = true;
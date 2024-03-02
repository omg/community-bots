import { RemarkRelatedData } from "../games/wbm";

// i wish there was a way to display the full type, with all of its properties and subtypes
// but i cant find a way to do that, and its not worth doing manually since shit will change at some point
/**
 * This function is called to get the remark, it should return a string
 * all relevant data needed is passed in as the data object
 * 
 * @param data 
 */
export function execute(data: RemarkRelatedData): string {
  if (data.round.winner?.solution == "plonk") {
    return "Holy Moly Plonk";
  }

  // you can return nothing or an empty string, they will be filtered out and not included in the final message
  // return "";
}

// higher means it will appear first in the list of indexes 
// (related remarks should have a similar index to each other to keep them together)
// if not defined the index will be treated as -1, and placed at the end of the remarks in the order they were added
// which is probably the same order as the file structure
export const index = 999;

// if true the remark will not be used
// if undefined the remark will be used
export const disabled = true;
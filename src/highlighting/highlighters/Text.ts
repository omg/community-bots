import { CharacterTheme, CharacterMap, PresentCharacterMap } from "../CharacterSet";

const Characters: CharacterMap = {
  " ": " ",
  "A": "A",
  "B": "B",
  "C": "C",
  "D": "D",
  "E": "E",
  "F": "F",
  "G": "G",
  "H": "H",
  "I": "I",
  "J": "J",
  "K": "K",
  "L": "L",
  "M": "M",
  "N": "N",
  "O": "O",
  "P": "P",
  "Q": "Q",
  "R": "R",
  "S": "S",
  "T": "T",
  "U": "U",
  "V": "V",
  "W": "W",
  "X": "X",
  "Y": "Y",
  "Z": "Z",
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "'": "'",
  "@": "@",
  "-": "-",

  "unknown": " "
};

export const PresentCharacters: PresentCharacterMap = {
  ...Characters,
  "any": "."
};

export const HighlightedCharacters: CharacterMap = { ...Characters };
// for (const key in Characters) {
//   HighlightedCharacters[key] = `**${Characters[key]}**`;
// }

export const WildcardCharacters: CharacterMap = HighlightedCharacters;

export const TextCharacterTheme: CharacterTheme = {
  Present: PresentCharacters,
  Highlighted: HighlightedCharacters,
  Wildcard: WildcardCharacters
};

export default TextCharacterTheme;
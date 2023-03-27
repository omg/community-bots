import { WordBombMini } from "../games/WordBombMini";
import LameGame from "../types/LameGame";

const GameCode = {
  WordBombMini: "WordBombMini",
} as const;

const DIRECTORY = {
  [GameCode.WordBombMini]: {
    name: "Word Bomb Mini",
    game: WordBombMini
  },
} as const;

export type DirectoryInformation = {
  name: string;
  game: typeof LameGame;
}

export const GameDirectory: {[name: string]: DirectoryInformation} = DIRECTORY;

let wbm: WordBombMini = new GameDirectory[GameCode.WordBombMini].game();
import LameGame from "../../types/LameGame";
import WordBombMini from "../WordBombMini";

const DIRECTORY = {
  ["WordBombMini"]: {
    name: "Word Bomb Mini",
    game: WordBombMini
  },
} as const;

export type DirectoryGame = {
  name: string;
  game: typeof LameGame;
};

export type DirectoryInformation = { [key in keyof typeof DIRECTORY]: DirectoryGame };
export const GameDirectory: DirectoryInformation = DIRECTORY;

// let wbm: WordBombMini = new GameDirectory.WordBombMini.game();
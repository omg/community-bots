import LameGame from "../classes/LameGame";
import WordBombMini from "../WordBombMini";

const DIRECTORY = {
  ["WordBombMini"]: {
    Game: WordBombMini,
    name: "Word Bomb Mini",
  },
} as const;

export type DirectoryGame = {
  Game: typeof LameGame;
  name: string;
};

export type DirectoryInformation = { [key in keyof typeof DIRECTORY]: DirectoryGame };
export const GameDirectory: DirectoryInformation = DIRECTORY;

// let wbm: WordBombMini = new GameDirectory.WordBombMini.game();
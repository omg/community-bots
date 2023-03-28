import LameGame from "../types/LameGame";
import { _DIRECTORY } from "../games/directory/Directory";

export type DirectoryGame = {
  name: string;
  game: typeof LameGame;
};

export type DirectoryInformation = { [key in keyof typeof _DIRECTORY]: DirectoryGame };
export const GameDirectory: DirectoryInformation = _DIRECTORY;

// let wbm: WordBombMini = new GameDirectory.WordBombMini.game();
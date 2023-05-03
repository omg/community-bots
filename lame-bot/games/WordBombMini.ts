import Game from "./classes/LameGame";

type WordBombMiniState = {
  guild: string; // maybe
  channel: string; // maybe
  streak: number;
  lastWinner: number;
  startedAt: Date; // timestamp really
  prompt: RegExp; // i think it's regexp but idk
  promptWord: string;
  solutions: number;
  lengthRequired: boolean;
  topRemarks;
}

export default class WordBombMini extends Game {
  constructor() {
    super();

    
  }
}
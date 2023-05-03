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
  remarks: any; // really its an array with a bunch of remarks
  replyMessage: string; // maybe
  inProgress: boolean; // maybe
  solves: any; // really it's an array with objects of all the solves
}

export default class WordBombMini extends Game {
  constructor() {
    super();

    
  }
}
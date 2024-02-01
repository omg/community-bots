import { Message, User } from "discord.js";
import { getReplyMessage } from "../../src/database/db";
import { generatePrompt, standardizeWord } from "../../src/dictionary/dictionary";
import { isInDictionary, isRepeatedPrompt } from "./wbm-misc";
import { getRemarkEmoji } from "../../src/emoji-renderer";

type GameSettings = {
  guild: string;
  channel: string;

  timeout?: number;
  replyMessage?: string;
};

const DEFAULT_GAME_SETTINGS: GameSettings = {
  guild: "",
  channel: "",

  replyMessage: "",
};

type Game = {
  settings: GameSettings;

  inProgress: boolean;
  streak: number;
  curRound: WBMRound;
  prevRound: WBMRound;
};

type Solver = {
  user: string;
  solution: string;
  usedVivi: boolean;
};

type Prompt = {
  prompt: string;
  originWord: string;
  length: number;
  solutions: string[];
  solveLengthRequired: number;

  solutionsInDB: number;
};

type WBMRound = {
  gameID: number;
  winner?: Solver;
  solvers: Solver[];

  // prompt info
  rawPrompt: string,
  prompt: RegExp;
  promptWord: string;
  promptLength: number;
  solutionCount: number;
  solutions: string[];
  lengthRequired: number;

  // round info
  // you can figure out the duration urself
  startedAt: Date;
  completedAt: Date;

  remarks: string[];
};

const WBMGame: Game = setupGame();

// i like this concept, but i think its clunky to work with
// because of RESPONSES["repeatedPrompt"](guess, WBMGame.curRound, message.author) and stuff
// RESPONSES.repeatedPrompt(guess, WBMGame.curRound, message.author) is better but still a bit clunky
const RESPONSES: {
  [key: string]: (guess: string, roundData: WBMRound, user: User) => string;
} = {
  repeatedPrompt: (guess: string, roundData: WBMRound, user: User) => {
    return "<@" + user.id + ">, you cannot repeat the prompt!";
  },
  wrongLength: (guess: string, roundData: WBMRound, user: User) => {
    return (
      "<@" +
      user.id +
      ">, the word must be **" +
      roundData.lengthRequired +
      "** characters!\nYours was **" +
      guess.length +
      "**, " + (guess.length > roundData.lengthRequired ? "go higher " + getRemarkEmoji("up") : "go lower " + getRemarkEmoji("lower"))
    )
  }
};

function setupGame(gameSettings: GameSettings = DEFAULT_GAME_SETTINGS): Game {
  const game: Game = {
    settings: gameSettings,

    inProgress: false,
    streak: 0,
    curRound: undefined,
    prevRound: undefined,
  };

  return game;
}

// the main function that is called when a messageCreate event is received
// kind of like a "update" function for the game?
async function callback(message: Message) {
  if (message.author.bot) return;
  if (!WBMGame.inProgress) return;
  if (message.channel.id !== WBMGame.settings.channel) return;
  if (WBMGame.curRound.solvers.some((s) => s.user === message.author.id)) return;

  let guess = standardizeWord(message.content);
  let curPrompt = WBMGame.curRound.rawPrompt;
  let lengthRequired = WBMGame.curRound.lengthRequired;
  
  if (
    WBMGame.curRound.prompt.test(guess) &&
    isInDictionary(guess)
  ) {
    // check if the guess is just the prompt repeated or adds a "s" on the end
    // while these are valid solves, they arent allowed
    if (isRepeatedPrompt(curPrompt, guess)) {
      if (WBMGame.curRound.solvers.length > 0) return;

      let response = RESPONSES.repeatedPrompt(
        guess,
        WBMGame.curRound,
        message.author
      );
      message.reply(response);
      return;
    }

    // if the guess is the same length as length required, we dont need to
    // respond with higher/lower
    if (lengthRequired > 0 && guess.length !== lengthRequired) {
      if (WBMGame.curRound.solvers.length > 0) return;

      let response = RESPONSES.wrongLength(
        guess,
        WBMGame.curRound,
        message.author
      );
      message.reply(response);
    }

    WBMGame.curRound.solvers.push({
      user: message.author.id,
      solution: guess,
      usedVivi: false,
    });
    
    // the first player to solve the prompt starts a short countdown
    // so that other players who were slightly too late can still solve
    // this helps mitigate the issue of discords latency causing some players
    // who mightve sent first on their screen to just not win anything
    // because of latency/ping
    if (WBMGame.curRound.solvers.length === 1) {
      // setTimeout(endRound, 350);
    }
  }
}

async function startRound(game: Game) {
  if (game.inProgress) return;
  game.inProgress = true;

  let { prompt, promptWord, solutions, lengthRequired } = generatePrompt();

}

import { Message, User, Guild, TextChannel, Client } from "discord.js";
import { finishRound, getReplyMessage, getUserExactSolves, getUserRanking, getUserSolveCount } from "../database/db";
import { generatePrompt, solverCache, standardizeWord } from "../dictionary/dictionary";
import { getRemarkEmoji } from "../emoji-renderer";
import { getChannel, lameBotClient, sendMessage, sendMessageAsReply, waitForReady } from "../../lame-bot/src/client";
import { convertTextToHighlights, getPromptRegexDisplayText } from "../regex";
import { formatNumber } from "../utils";
import { TextChannelBasedGame } from "./game";
import { getCleanName, isRepeatedPrompt } from "./game-utils";
import { getRemarks } from "../remark/remarks";

function createDefaultRound(): WBMRound {
  return {
    winner: undefined,
    solvers: [],

    rawPrompt: undefined,
    prompt: undefined,
    promptWord: undefined,
    promptWordLength: undefined,
    solutionCount: undefined,
    solutions: new Set(),
    lengthRequired: undefined,
    
    startedAt: Date.now(),
    completedAt: undefined,

    // remarks: [],
  }
}

async function createNewRound(): Promise<WBMRound> {
  let { prompt, promptWord, solutions, lengthRequired } = await generatePrompt();

  let round: WBMRound = createDefaultRound();
  round.rawPrompt = prompt.source;
  round.prompt = prompt;
  round.promptWord = promptWord;
  round.promptWordLength = promptWord.length;
  round.solutionCount = solutions.size;
  round.solutions = solutions;
  round.lengthRequired = lengthRequired;

  return round;
}

type GameSettings = {
  guild?: string;
  channel: string;

  timeout?: number;
  replyMessage?: string;
};

type Solver = {
  userDisplayName: string;
  user: string;
  solution: string;
  usedVivi: boolean;
};

type WBMRound = {
  winner?: Solver;
  solvers: Solver[];

  // prompt info
  rawPrompt: string,
  prompt: RegExp;
  promptWord: string;
  promptWordLength: number;
  solutionCount: number;
  solutions: Set<string>;
  lengthRequired: boolean;

  // round info
  // you can figure out the duration urself
  startedAt: number;
  completedAt: number;

  // remarks: string[];
};

type PostRoundUserData = {
  rankingBefore: number;
  rankingAfter: number;
  solveCount: number;
  exactSolves: number;
};

export type RemarkRelatedData = {
  prevRound: WBMRound;
  round: WBMRound;

  streak: StreakInfo;
  postRoundWinnerData: PostRoundUserData;
}

type StreakInfo = {
  user: string; // user id
  userDisplayName: string;
  consecutiveWins: number;

  // this is stupid right? but its useful for remarks
  // could just store streak data on the round instead /shrug
  // Omit Lolz
  previous: Omit<StreakInfo, "previous">;
}

export class WordBombMini extends TextChannelBasedGame {
  _replyMessage: string;
  replyMessage: Message;
  channel: TextChannel;
  guild: Guild;

  streak: StreakInfo;

  currentRound: WBMRound;
  previousRound: WBMRound;

  constructor(channel: string, replyMessage?: string, client: Client = lameBotClient) {
    super(channel, 0, client);
    this._replyMessage = replyMessage;
  }

  // TODO: Change name to onMessage or something
  update = (message: Message): Promise<void> => {
    console.log(this.currentRound, this.inProgress, message.author.id);
    if (message.author.bot) return;
    if (!this.inProgress) return;
    // effectively acts as if (!prompt) return;
    if (!this.currentRound) return;
    if (message.channel.id !== this.channel.id) return;
    if (this.currentRound.solvers.some((s) => s.user === message.author.id)) return;
    // this was a issue when we were using regex, but it shouldnt be anymore (?)
    // if (message.content.includes("\n")) return;

    let guess = standardizeWord(message.content).toUpperCase();
    let curPrompt = this.currentRound.prompt;
    // we dont need to test the guess against the prompt anymore, but why not ig
    if (curPrompt.test(guess) && this.currentRound.solutions.has(guess)) {
      if (isRepeatedPrompt(curPrompt.source, guess)) {
        if (this.currentRound.solvers.length > 0) return;

        // TODO: repeated prompt response
      }

      if (this.currentRound.lengthRequired && guess.length !== this.currentRound.promptWordLength) {
        if (this.currentRound.solvers.length > 0) return;

        // TODO: wrong length response
      }

      this.currentRound.solvers.push({
        userDisplayName: getCleanName(message.author.displayName),
        user: message.author.id,
        solution: guess,
        usedVivi: solverCache.has(message.author.id),
      });

      if (this.currentRound.solvers.length === 1) {
        setTimeout(this.endRound.bind(this), 350);
      }
    }
  };

  endRound = async (): Promise<void> => {
    // let start = Date.now();
    this.currentRound.winner = this.currentRound.solvers[0];
    this.previousRound = this.currentRound ? this.currentRound : undefined;
    this.updateStreak();
    
    // it was extremely confusing to figure out why this was here and
    // what it was supposed to be doing, but this data is for the end of round remarks
    // mainly related to rank remarks and solve remarks
    let remarkData = await this.compileRemarkData();
    let remarks = await getRemarks({
      prevRound: this.previousRound,
      round: this.currentRound,
      streak: this.streak,
      postRoundWinnerData: remarkData,
    })

    let winnerData = this.currentRound.solvers[0];
    await sendMessage(
      this.channel,
      `**${getRemarkEmoji("solvedIt")}
      <@${winnerData.user}> solved it! ${getRemarkEmoji("solvedIt")}**\n\n` +
      getRemarkEmoji("roundEnded") +
      " **Round ended!**\n" +
      convertTextToHighlights(winnerData.solution, this.currentRound.prompt) +
      "\n" + remarks
    )

    setTimeout(this.startRound, 8000);
  }

  startRound = async (): Promise<void> => {
    if (this.inProgress) return;
    this.inProgress = true;

    solverCache.clear();

    this.currentRound = await createNewRound();
    this.streak = {
      user: undefined,
      userDisplayName: undefined,
      consecutiveWins: 0,
      previous: undefined,
    };
    
    await this.sendMessageWithReply();
  };

  async startGame(): Promise<void> {
    await waitForReady();

    this.channel = await getChannel(this._channel) as TextChannel;
    this.guild = this.channel.guild;

    this.replyMessage = await this.channel.messages.fetch(this._replyMessage);

    // TODO: 
    // get around using the arrow functions for the class this way, also clean
    // this.client.addListener("messageCreate", (message) => { /* check if it's relevant */ this.onMessage(message); });
    this.client.addListener("messageCreate", this.update);

    await this.startRound();
  };

  endGame(): void {
    // TODO: implement

    // we dont actually ever end the game (as of right now)
    // so ill just leave this here, if we do end up using it
    // remember to call destroy() on the game instead of endGame()
    // so we free up the event listener (and other resources if applicable in the future)
  };

  sendMessageWithReply = async () => {
    await sendMessageAsReply(
      this.replyMessage as Message, 
      (
        getRemarkEmoji("bomb") + " **Quick!** Type a word containing:" +
        "\n\n" + getPromptRegexDisplayText(this.currentRound.prompt) + " ***｡✲ﾟ** (" + formatNumber(this.currentRound.solutionCount) + (this.currentRound.solutionCount === 1 ? " solution)" : " solutions)") +
        (this.currentRound.lengthRequired ? "\n\n• Must be **" + this.currentRound.promptWord.length + "** characters!" : "")
      )
    );
  }

  updateStreak = () => {
    if (this.currentRound.winner.user !== this.streak.user) {
      let prevStreak = this.streak;

      this.streak = {
        user: this.currentRound.winner.user,
        userDisplayName: this.currentRound.winner.userDisplayName,
        consecutiveWins: 1,

        // i dont know if the Omit type will automatically remove the data,
        // Just to make sure, i dont want to Flood the memory with Gigabytes of a streak object
        previous: {
          user: prevStreak.user,
          userDisplayName: prevStreak.userDisplayName,
          consecutiveWins: prevStreak.consecutiveWins,
        },
      }
      return;
    }

    // previous winner is the same as the current winner
    this.streak.consecutiveWins++;
  }

  // ok so we need a few of these util functions because they need access to the channel/guild
  // or other round information, and its ugly to pass it around all the time
  getDisplayName = async (uid: string): Promise<string> => {
    return await this.guild.members
      .fetch(uid)
      .then((member) => {
        return getCleanName(member.displayName);
      })
      .catch(() => {
        return "Lame Guest";
      });
  }

  getCurrentPromptName = (): string => {
    return (
      getPromptRegexDisplayText(this.currentRound.prompt, false) + 
      (this.currentRound.lengthRequired ? " - " + this.currentRound.promptWordLength : "")
    )
  }

  compileRemarkData = async (): Promise<PostRoundUserData> => {
    let winner = this.currentRound.solvers[0];
    // TODO: for rankingBefore/rankingAfter, they should be turned into 1 request instead
    // maybe searching for the users solves +1/-1 to get the ranks around it and calculating the rank change from there
    // instead of 2 requests for this (and get solvecount/exactsolves in the same request)
    let rankingBefore = await getUserRanking(winner.user);

    let thisRound = this.currentRound;

    // pass data to database
    await finishRound( 
      thisRound.solvers, 
      thisRound.startedAt,
      thisRound.prompt,
      thisRound.promptWord,
      thisRound.lengthRequired ? thisRound.promptWord.length : 0,
      thisRound.solutionCount
    );

    // finalizing info
    let solveCount = await getUserSolveCount(winner.user);
    let exactSolves = await getUserExactSolves(winner.user);
    let rankingAfter;
    if (rankingBefore) { rankingAfter = await getUserRanking(winner.user) };

    return {
      rankingBefore: rankingBefore,
      rankingAfter: rankingAfter,
      solveCount: solveCount,
      exactSolves: exactSolves,
    };
  }
}
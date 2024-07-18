import { generatePrompt, solvePromptWithTimeout, solverCache, standardizeWord } from "../dictionary/dictionary";
import { isRepeatedPrompt } from "./game-utils";
import { formatNumber, getCleanName } from "../utils";
import { sendMessage, sendMessageWithReplyID } from "../../lame-bot/src/client";
import { getRemarkEmoji } from "../emoji-renderer";
import { convertTextToHighlights, getPromptRegexDisplayText } from "../regex";
import { finishRound, getActiveLeaderboards, getSaveState, getUserExactSolves, getUserRanking, getUserRankingInfo, getUserSolveCount, LeaderboardDocument, RankingDocument, storeSaveState } from "../database/db";
import { getRemarks } from "../remark/remarks";
import { TextChannelBasedGame } from "./manager";

type Solver = {
    user: string,
    userDisplayName: string,
    solution: string,
    usedVivi: boolean,
}

type WBMRound = {
    // winner is technically just solvers[0] but whatever ig
    winner?: Solver,
    solvers: Solver[],

    rawPrompt: string,
    prompt: RegExp,
    promptWord: string,
    promptWordLength: number,
    solutionCount: number,
    solutions: Set<string>,
    lengthRequired: boolean,

    // timestamps? should probably be datetime?
    startedAt: number,
    endedAt: number,

    remarks: string[],
}

export type SaveState = {
    rawPrompt: string,
    prompt: RegExp,
    promptWord: string,
    promptWordLength: number,
    solutionCount: number,
    lengthRequired: boolean,

    streak: Omit<StreakInfo, "previous">,
    
    startedAt: number,
}

type PostRoundUserData = {
    rankingBefore: number,
    rankingAfter: number,

    rankingDocuments: { [key: string]: WBMRankingDocument },
}

export type WBMRemarkData = {
    prevRound: WBMRound,
    currRound: WBMRound,

    streak: StreakInfo,

    postRoundWinnerData: PostRoundUserData,
}

type StreakInfo = {
    user: string,
    userDisplayName: string,

    consecutiveWins: number,

    previous: Omit<StreakInfo, "previous">,
}

type WBMRankingDocument = RankingDocument & {
    exactSolves: number;
    jinxes: number;
    lateSolves: number;
    score: number;
    solves: number;
    viviUses: number;
    wins: number;
}

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
        endedAt: undefined,
  
        remarks: [],
    }
}

function createRoundWithSaveState(state: SaveState): WBMRound {
    let round = createDefaultRound();

    round.rawPrompt = state.rawPrompt;
    round.prompt = state.prompt;
    round.promptWord = state.promptWord;
    round.promptWordLength = state.promptWordLength;
    round.solutionCount = state.solutionCount;
    round.lengthRequired = state.lengthRequired;

    round.startedAt = state.startedAt;

    return round;
}

async function createNewRound(): Promise<WBMRound> {
    let { prompt, promptWord, solutions, lengthRequired } = await generatePrompt();

    let round = createDefaultRound();

    round.rawPrompt = prompt.source;
    round.prompt = prompt;
    round.promptWord = promptWord;
    round.promptWordLength = promptWord.length;
    round.solutionCount = solutions.size;
    round.solutions = solutions;
    round.lengthRequired = lengthRequired;

    return round;
}

export class WordBombMini extends TextChannelBasedGame {
    currentRound: WBMRound;
    previousRound: WBMRound;
    streak: StreakInfo;
    // ObjectId has some fucked comparison stuff, essentially Map<ObjectId, string>.get(ObjectId) will always fail
    // so we have to convert it all into the hexstring first, its so stupid
    active_leaderboards: Map<string, string>;

    // i think its nicer if we arent exporting the setting types
    // and these dont need to be typed because TextChannelBasedGame has the type and sets it as this.settings
    constructor(settings, client) {
        super(settings, client);
    }

    async loadLeaderboards() {
        let lbs = await getActiveLeaderboards();

        this.active_leaderboards = new Map();
        lbs.forEach(l => {
            this.active_leaderboards.set(l.id.toHexString(), l.name);
        });
    }

    async loadSaveState(state: SaveState): Promise<boolean> {
        if (!state) {
            // if theres no state dont load a round and let one be created on start
            return false;
        }
        
        let round = createRoundWithSaveState(state);
        round.solutions = new Set(await solvePromptWithTimeout(round.prompt, 5000, null));
        
        this.currentRound = round;
        
        if (state.streak) {
            this.streak = {
                user: state.streak.user,
                userDisplayName: state.streak.userDisplayName,
                consecutiveWins: state.streak.consecutiveWins,
                previous: undefined,
            };
        }

        this.inProgress = true;

        return true;
    }

    async compileRemarkData(): Promise<PostRoundUserData> {
        let winner = this.currentRound.winner;
        let rankingBefore = await getUserRanking(winner.user);

        let thisRound = this.currentRound;

        await finishRound(
            thisRound.solvers,
            thisRound.startedAt,
            thisRound.prompt,
            thisRound.promptWord,
            thisRound.lengthRequired ? thisRound.promptWord.length : null,
            thisRound.solutionCount,
        );

        let rankingDocument = await getUserRankingInfo<WBMRankingDocument>(winner.user);

        let documents: { [key: string]: WBMRankingDocument } = {};

        // this isnt the fastest way of doing this but it the lists should be so small that it wont matter
        rankingDocument.forEach(doc => {
            let lb_name = this.active_leaderboards.get(doc.leaderboardID.toHexString());
            documents[lb_name] = doc;
        });

        let rankingAfter;
        if (rankingBefore) { rankingAfter = await getUserRanking(winner.user); }

        return {
            rankingBefore: rankingBefore,
            rankingAfter: rankingAfter,
            rankingDocuments: documents,
        }
    }

    updateStreak() {
        if (!this.streak) {
            this.streak = {
                user: this.currentRound.winner.user,
                userDisplayName: this.currentRound.winner.userDisplayName,
                consecutiveWins: 1,
                previous: null,
            }
            return;
        }

        if (this.currentRound.winner.user !== this.streak.user) {
            let prevStreak = this.streak;

            this.streak = {
                user: this.currentRound.winner.user,
                userDisplayName: this.currentRound.winner.userDisplayName,
                consecutiveWins: 1,

                previous: {
                    user: prevStreak.user,
                    userDisplayName: prevStreak.userDisplayName,
                    consecutiveWins: prevStreak.consecutiveWins,
                }
            }
            return;
        }

        this.streak.consecutiveWins++;
    }

    async sendRoundMessage() {
        let m = (
            getRemarkEmoji("bomb") + " **Quick!** Type a word containing:" +
            "\n\n" + getPromptRegexDisplayText(this.currentRound.prompt) + " ***｡✲ﾟ** (" + formatNumber(this.currentRound.solutionCount) + (this.currentRound.solutionCount === 1 ? " solution)" : " solutions)") +
            (this.currentRound.lengthRequired ? "\n\n• Must be **" + this.currentRound.promptWord.length + "** characters!" : "")
        );

        await sendMessageWithReplyID(this.settings.channel, m, this.settings.replyMessage);
    }

    async startRound() {
        if (this.inProgress) return;
        this.inProgress = true;

        solverCache.clear();
        this.previousRound = this.currentRound;
        this.currentRound = await createNewRound();
        
        await storeSaveState(this.settings.channel.id, {
            rawPrompt: this.currentRound.rawPrompt,
            prompt: this.currentRound.prompt,
            promptWord: this.currentRound.promptWord,
            promptWordLength: this.currentRound.promptWordLength,
            solutionCount: this.currentRound.solutionCount,
            lengthRequired: this.currentRound.lengthRequired,
            streak: this.streak,
            startedAt: this.currentRound.startedAt,
        });

        await this.sendRoundMessage();
    }

    async endRound() {
        // this is the way of getting around context not being included with setTimeout
        const self = this;

        if (!this.inProgress) return;
        this.inProgress = false;

        this.currentRound.winner = this.currentRound.solvers[0];
        this.updateStreak();

        let remarkInfo = await this.compileRemarkData();
        let remarks = "";

        remarks = await getRemarks({
            prevRound: this.previousRound,
            currRound: this.currentRound,

            streak: this.streak,

            postRoundWinnerData: remarkInfo,
        });

        await sendMessage(
            this.settings.channel,
            `**${getRemarkEmoji("solvedIt")} <@${this.currentRound.winner.user}> solved it! ${getRemarkEmoji("solvedIt")}**\n\n` +
            getRemarkEmoji("roundEnded") +
            " **Round ended!**\n" +
            convertTextToHighlights(this.currentRound.winner.solution, this.currentRound.prompt) + 
            "\n" + remarks
        );

        setTimeout(function () {
            self.startRound();
        }, 8000);
    }


    async prepare() {
        await this.loadLeaderboards();
    }

    async start() {
        let loaded = await this.loadSaveState(await getSaveState(this.settings.channel.id));
        console.log("Loading state", loaded);
        
        if (!loaded) {
            await this.startRound();
            return;
        }
        // if the game was loaded from a save state, we dont need to do anything
    }

    async update(message) {
        const self = this;
        
        if (
            message.author.bot ||
            !this.inProgress ||
            !this.currentRound ||
            message.channel.id !== this.settings.channel.id ||
            this.currentRound.solvers.some(s => s.user === message.author.id)
        ) return;

        let guess = standardizeWord(message.content).toUpperCase();
        let round = this.currentRound;

        if (round.prompt.test(guess) && round.solutions.has(guess)) {
            if (isRepeatedPrompt(round.prompt.source, guess)) {
                if (round.solvers.length > 0) return;

                message.reply("<@" + message.author.id + ">, you cannot repeat the prompt!")
                .catch((error) => {
                    console.log(error);
                });
                return;
            }

            if (round.lengthRequired && guess.length !== round.promptWordLength) {
                if (round.solvers.length > 0) return;

                message.reply(
                    "<@" + message.author.id + ">, your word must be " + 
                    round.promptWordLength + 
                    "** characters!\nYours was **" + 
                    guess.length + 
                    (guess.length < round.promptWordLength ? ("**, go higher " + getRemarkEmoji("higher")) : "** go lower " + getRemarkEmoji("lower"))
                );
            }

            round.solvers.push({
                userDisplayName: getCleanName(message.author.displayName),
                user: message.author.id,
                solution: guess,
                usedVivi: solverCache.has(message.author.id),
            });

            if (round.solvers.length === 1) {
                setTimeout(function () {
                    self.endRound();
                }, 800);
            }
        }
    }

    // im going to leave these unimplemented because CURRENTLY
    // there is no way for these to be triggered, you cant end via a command
    // and when the bot crashes these wont be run
    // if there was a deconstructor for the game manager then these could be implemented
    async end() {}
    async clean() {}
}
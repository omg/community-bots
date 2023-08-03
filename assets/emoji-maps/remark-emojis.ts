const PickStrategy = {
  Ordered: 0,
  Random: 1,
  RandomBag: 2,
  RandomNeverTwice: 3,
};

export const GLOBAL_DEFAULT = {
  emojis: ["💫"],
  pickStrategy: PickStrategy.RandomBag,
};
export const DEFAULT_PICK_STRATEGY = PickStrategy.RandomBag;

// luna emoji (using emojis array)
const testEmoji = {
  emojis: [
    {
      type: "luna",
      emoji: "jinx",
    },
  ],
  pickStrategy: PickStrategy.RandomBag,
};

// luna emoji (using emoji variable)
// const testEmoji2 = {
//   emoji: new LunaEmoji("jinx"), // FIXME: LunaEmoji is not a class yet....
//   pickStrategy: PickStrategy.RandomBag,
// };

export function lunaEmoji(identifier) {
  return {
    type: "luna",
    identifier,
  };
}

export function textEmoji(text) {
  return {
    type: "text",
    text,
  };
}

// ascii emoji + luna emoji using emojis array
const testEmoji3 = {
  emojis: [lunaEmoji("jinx"), textEmoji("💫")],
  pickStrategy: PickStrategy.RandomBag,
};

// emoji

const emojiMap = {
  ["solvedIt"]: { emojis: ["🎊"] },
  ["roundEnded"]: {
    emojis: ["<:e:775931479570120744>", "<:e:853372979978829884>"],
  },
  ["jinx"]: { emojis: ["<:e:1035636160548044871>"] },
  ["firstPlace"]: {
    emojis: ["<:e:775931479225008140> <a:e:775965764553408533>"],
  },
  ["rankingMovement"]: { emojis: ["<:e:1035637384961867867>"] },
  ["solve1"]: { emojis: ["<:e:775965539217834034>"] },
  ["solve1Related"]: { emojis: ["<:e:775931479225008140>"] },
  ["solve1Exact"]: { emojis: ["<:e:816191059326926889>"] },
  ["solve10000"]: { emojis: ["<:e:775931479124344883>"] },
  ["solve10000Related"]: { emojis: ["<:e:816191059326926889>"] },
  ["solve1000"]: { emojis: ["<:e:775965823104712704>"] },
  ["solve1000Related"]: { emojis: ["<:e:816191059326926889>"] },
  ["solve100"]: { emojis: ["<:e:775965823135252540>"] },
  ["solve100Related"]: { emojis: ["<:e:816191059326926889>"] },
  ["solve69"]: { emojis: ["<:e:816190285298008115>"] },
  ["solve666"]: { emojis: ["<:e:775966099082444820>"] },
  ["solve666Related"]: { emojis: ["<:e:815841785066684416>"] },
  ["exactSolve"]: { emojis: ["<:e:816191059326926889>"] },
  ["uniqueSolve"]: { emojis: ["📚"] },
  ["promptiversary"]: { emojis: ["<:e:796773017387925534>"] },
  ["promptiversaryStale"]: { emojis: ["<:e:816192096343556126>"] },
  ["newLeaderboard"]: { emojis: ["<:e:816078069403090954>"] },
  ["streakEnded"]: {
    emojis: [
      "<:e:816078069495627796>",
      "<:e:853371460365189120>",
      "<:e:853371685632737290>",
      "<:e:853371885169147924>",
      "<:e:869738682230382603>",
    ],
  },
  ["solveStreak"]: { emojis: ["🔥"] },
  ["solveStreakDubious"]: { emojis: ["<a:e:815838130304319498>"] },
  ["solveStreakChristine"]: { emojis: ["<a:e:1040529915021361182>"] },
  ["usedVivi"]: { emojis: ["<:e:816078069302427679>"] },
  ["bad"]: { emojis: ["<:e:775275262740791336>"] },
  ["good"]: { emojis: ["<:e:775275262731878410>"] },
  ["bomb"]: { emojis: ["<:e:1036463108337704970>"] },
  ["higher"]: { emojis: ["<:e:775287808105381888>"] },
  ["lower"]: { emojis: ["<:e:775287808063569930>"] },
};

export const remarkEmojiMap = emojiMap;
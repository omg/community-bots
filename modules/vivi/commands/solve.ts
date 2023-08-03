import { replyToInteraction } from "../../../src/command-handler.js";
import { getSolveLetters } from "../../../src/emoji-renderer.js";
import { SlashCommandBuilder } from "discord.js";
import { formatNumber, shuffle } from "../../../src/utils.js";

import {
  cleanWord,
  getPromptRegexFromPromptSearch,
  solvePromptWithTimeout,
} from "../../../src/dictionary/dictionary.js";

const data = new SlashCommandBuilder()
  .setName("solve")
  .setDescription("Solve a prompt!")
  .addStringOption((option) =>
    option
      .setName("prompt")
      .setDescription("The prompt to solve")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("dictionary")
      .setDescription("The dictionary to solve in")
      .setRequired(false)
      .addChoices({
        name: "English",
        value: "English",
      })
  );

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let prompt = cleanWord(interaction.options.get("prompt").value);

  try {
    // cleanWord is called twice here on prompt
    let regex = getPromptRegexFromPromptSearch(prompt);

    let solutions = await solvePromptWithTimeout(
      regex,
      800,
      interaction.user.id
    );
    let solveCount = solutions.length;

    if (solveCount === 0) {
      await replyToInteraction(
        interaction,
        "Solver",
        "\n• That prompt is impossible.",
        preferBroadcast
      );
    } else {
      let solverString =
        "I found " +
        (solutions.length === 1
          ? "**1** solution!"
          : "**" + formatNumber(solutions.length) + "** solutions!") +
        "\n";

      shuffle(solutions);

      let solutionStrings: string[] = [];
      let solutionsLength = 0;

      for (let i = 0; i < Math.min(solutions.length, 4); i++) {
        let solution = solutions[i];

        let solutionString: string = "\n• " + getSolveLetters(solution, regex);
        if (solutionsLength + solutionString.length > 1910) break;
        solutionStrings.push(solutionString);
        solutionsLength += solutionString.length;
      }

      // TODO: Add a "show more" button if there are more solutions than can be displayed

      solutionStrings.sort((a, b) => b.length - a.length || a.localeCompare(b));
      for (let solutionString of solutionStrings)
        solverString += solutionString;

      await replyToInteraction(
        interaction,
        "Solver",
        solverString,
        preferBroadcast
      );
    }
  } catch (error) {
    if (
      error.name === "PromptException" ||
      error.name === "SolveWorkerException"
    ) {
      await replyToInteraction(
        interaction,
        "Solver",
        "\n• " + error.message,
        preferBroadcast
      );
    } else {
      throw error;
    }
  }
}

export const broadcastable = true;

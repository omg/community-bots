import { replyToInteraction, getInteractionContent } from '../../src/command-handler';
import { getSolveLetters } from '../../src/emoji-renderer';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { formatNumber, shuffle } from '../../src/utils';

import { cleanWord, getPromptRegexFromPromptSearch, solvePromptWithTimeout } from '../../src/dictionary/dictionary';
import { PagedResponse } from "../../src/pageview";

export const data = new SlashCommandBuilder()
  .setName('solve')
  .setDescription('Solve a prompt!')
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('The prompt to solve')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('dictionary')
      .setDescription('The dictionary to solve in')
      .setRequired(false)
      .addChoices({
        name: 'English',
        value: 'English'
      }));


export const broadcastable = true;

// create function to handle the command
export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
  let prompt = cleanWord(interaction.options.get("prompt").value);

  try {
    // cleanWord is called twice here on prompt
    let regex = getPromptRegexFromPromptSearch(prompt);

    let solutions: string[] = await solvePromptWithTimeout(regex, 1300, interaction.user.id);
    let solveCount = solutions.length;

    // solutions.sort((a, b) => b.length - a.length || a.localeCompare(b));
    // sort alphabetically
    solutions.sort((a, b) => a.localeCompare(b));

    if (solveCount === 0) {
      await replyToInteraction(interaction, "Solver", "\n• That prompt is impossible.", preferBroadcast);
    } else {
      let solverString = '\nI found '
        + (solutions.length === 1 ? '**1** solution!' : '**' + formatNumber(solutions.length) + '** solutions!')
        + '\n';

      // i think this becomes useless/pointless when the response is paged
      // it seems more annoying to have page 5 different every time
      // shuffle(solutions);

      let solutionsTextLength = 0;
      let pages = [];

      for (let i = 3; i < solutions.length; i += 4) {
        let solutionString = solutions.slice(i - 3, Math.min(i+1, solutions.length - 4, solutions.length)).map((solution) => {
          return `\n• ${getSolveLetters(solution, regex)}`;
        }).join('');

        // i dont think these matter with pages anymore
        // if (solutionsTextLength + solutionString.length > 1910) break;
        // solutionsTextLength += solutionString.length;

        pages.push(solverString + getInteractionContent(interaction, "Solver", solutionString, preferBroadcast));
      }
      
      // TODO: Add a "show more" button if there are more solutions than can be displayed
      await PagedResponse(interaction, pages)
    }
  } catch (error) {
    if (error.name === 'PromptException' || error.name === 'SolveWorkerException') {
      await replyToInteraction(interaction, "Solver", "\n• " + error.message, preferBroadcast);
    } else {
      throw error;
    }
  }
};

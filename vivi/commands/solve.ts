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
      
      let pages = [];
      let solutionText = solverString;
      let wordsAdded = 0;

      for (let i = 0; i < solutions.length; i += 1) {
        let solution = solutions[i];
        let word = `\n• ${getSolveLetters(solution, regex)}`;
        
        if ((solutionText.length + word.length) > 1910 || wordsAdded === 4) {
          pages.push(getInteractionContent(interaction, "Solver", solutionText, preferBroadcast))
          solutionText = solverString;
          wordsAdded = 0;
        }

        solutionText += word;
        wordsAdded += 1;
      }
      
      if (wordsAdded > 0) {
        pages.push(getInteractionContent(interaction, "Solver", solutionText, preferBroadcast))
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

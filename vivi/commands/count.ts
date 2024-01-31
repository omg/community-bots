import { replyToInteraction } from '../../src/command-handler';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { formatNumber } from '../../src/utils';

import { cleanWord, solvePromptWithTimeout } from '../../src/dictionary/dictionary';
import { getPromptRegexDisplayText, getPromptRegexFromPromptSearch } from '../../src/regex';

export const data = new SlashCommandBuilder()
  .setName('count')
  .setDescription('Find the amount of solves for a prompt!')
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('The prompt to search for')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('dictionary')
      .setDescription('The dictionary to search in')
      .setRequired(false)
      .addChoices({
        name: 'English',
        value: 'English'
      }));

export const broadcastable = true;

// create function to handle the command
export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
  let prompt = interaction.options.get("prompt").value as string;
  
  try {
    let regex = getPromptRegexFromPromptSearch(prompt);

    let solutions = await solvePromptWithTimeout(regex, 1300, null);
    let solveCount = solutions.length;

    if (solveCount === 0) {
      await replyToInteraction(interaction, "Solve Count", "\n• That prompt is impossible.", preferBroadcast);
    } else {
      await replyToInteraction(interaction, "Solve Count",
        '\n• There '
        + (solutions.length === 1 ? 'is **1** solution' : 'are **' + formatNumber(solutions.length) + '** solutions')
        + ' for ' + getPromptRegexDisplayText(regex) + '.'
      , preferBroadcast);
    }
  } catch (error) {
    if (error.name === 'PromptException' || error.name === 'SolveWorkerException') {
      await replyToInteraction(interaction, "Solve Count", "\n• " + error.message, preferBroadcast);
    } else {
      throw error;
    }
  }
};

const { replyToInteraction } = require('../../src/command-handler.js');
const { getPromptRegexDisplayText } = require('../../src/emoji-renderer.js');
const { SlashCommandBuilder } = require('discord.js');
const { formatNumber } = require('../../src/utils.js');

const Dictionary = require('../../src/dictionary/dictionary.js');

const data = new SlashCommandBuilder()
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

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let prompt = Dictionary.cleanWord(interaction.options.get("prompt").value);
  
  try {
    let regex = Dictionary.getPromptRegexFromPromptSearch(prompt);

    let solutions = await Dictionary.solvePromptWithTimeout(regex, 800);
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

// export the command
module.exports = {
  data,
  execute,
  broadcastable: true
};
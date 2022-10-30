const Dictionary = require('./dictionary.js');
import { replyToInteraction } from '../../command-handler.js';
import { getPromptRegexDisplayText } from '../../emoji-renderer.js';

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
      .addChoice('English', 'English'));

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let prompt = Dictionary.cleanWord(interaction.options.get("prompt").value);
  
  try {
    let regex = Dictionary.getPromptRegexFromPromptSearch(prompt);

    let solutions = Dictionary.solveRegex(regex);
    let solveCount = solutions.length;

    if (solveCount === 0) {
      replyToInteraction(interaction, "Solve Count", "\n• That prompt is impossible.", preferBroadcast);
    } else {
      replyToInteraction(interaction, "Solve Count",
        '\n• There '
        + (solutions.length === 1 ? 'is **1** solution' : 'are **' + formatNumber(solutions.length) + '** solutions')
        + ' for ' + getPromptRegexDisplayText(regex) + '.'
      , preferBroadcast);
    }
  } catch (error) {
    if (error.name === 'PromptException') {
      replyToInteraction(interaction, "Solve Count", "\n• " + error, preferBroadcast);
    } else {
      throw error;
    }
  }
};

// export the command
export default {
  data,
  execute
};
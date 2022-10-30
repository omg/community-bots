const Dictionary = require('./dictionary.js');
import { replyToInteraction } from '../../command-handler.js';
import { getSolveLetters } from '../../emoji-renderer.js';

const data = new SlashCommandBuilder()
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
      .addChoice('English', 'English'));

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let prompt = Dictionary.cleanWord(interaction.options.get("prompt").value);
  // if (Dictionary.isSearchGarbage(prompt)) {
  //   replyToInteraction(interaction, "Solver", "\n• Sorry, that's not a valid prompt!", preferBroadcast);
  //   return;
  // }

  try {
    let regex = Dictionary.getPromptRegexFromPromptSearch(prompt);

    let solutions = Dictionary.solveRegex(regex);
    let solveCount = solutions.length;

    if (solveCount === 0) {
      replyToInteraction(interaction, "Solver", "\n• That prompt is impossible.", preferBroadcast);
    } else {
      let solverString = 'I found '
        + (solutions.length === 1 ? '**1** solution!' : '**' + formatNumber(solutions.length) + '** solutions!')
        + '\n';

      shuffle(solutions);

      let solutionStrings = [];
      let solutionsLength = 0;

      for (let i = 0; i < Math.min(solutions.length, 4); i++) {
        let solution = solutions[i];
        let solutionString = '\n• ' + getSolveLetters(solution, regex);
        if (solutionsLength + solutionString.length > 1910) break;
        solutionStrings.push(solutionString);
        solutionsLength += solutionString.length;
      }

      // TODO: Add a "show more" button if there are more solutions than can be displayed

      solutionStrings.sort((a, b) => b.length - a.length || a.localeCompare(b));
      for (let solutionString of solutionStrings) solverString += solutionString;

      replyToInteraction(interaction, "Solver", solverString, preferBroadcast);
    }
  } catch (error) {
    if (error.name === 'PromptException') {
      replyToInteraction(interaction, "Solver", "\n• " + error, preferBroadcast);
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
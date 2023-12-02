import { replyToInteraction, getInteractionContent } from '../../src/command-handler';
import { getSolveLetters } from '../../src/emoji-renderer';
import { CommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { formatNumber, shuffle, SortingFunctions } from '../../src/utils';

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
      }))
  .addStringOption(option => 
    option.setName('sorting')
      .setDescription("How to sort solutions")
      .setRequired(false)
      .addChoices({
        name: 'Length (Descending)',
        value: 'lengthDescending'
      }, {
        name: 'Length (Ascending)',
        value: 'lengthAscending'
      }, {
        name: 'Alphabetical',
        value: 'alphabetical'
      }, {
        name: 'Length (Descending), Alphabetical',
        value: 'lengthThenAlphabetical'
      }))
  .addStringOption(option => 
    option.setName('file')
      .setDescription("dumps the solutions to a file")
      .setRequired(false)
      .addChoices({
        name: "Text",
        value: "text"
      }, /* { // Maybe later?
        name: "JSON",
        value: "json"
      } */));

export const broadcastable = true;

// create function to handle the command
export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
  let prompt = cleanWord(interaction.options.get("prompt").value);
  // @ts-ignore
  let sorting: string = interaction.options.get("sorting")?.value ?? "lengthDescending";
  // @ts-ignore // :HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA:
  let data_structure: string = interaction.options.get("file")?.value ?? "text";

  try {
    // cleanWord is called twice here on prompt
    let regex = getPromptRegexFromPromptSearch(prompt);

    let solutions: string[] = await solvePromptWithTimeout(regex, 1300, interaction.user.id);
    let solveCount = solutions.length;

    solutions.sort(SortingFunctions[sorting]);

    let solverString = '\nI found '
    + (solutions.length === 1 ? '**1** solution!' : '**' + formatNumber(solutions.length) + '** solutions!')
    + '\n';

    if (data_structure === "text") {
      // let fHeader = solveCount === 1 ? "1 solution" : `${formatNumber(solveCount)} solutions` + ` for \`${prompt}\` ` + `sorted by ${sorting_formatted}!`;
      let fileData = Buffer.from(solutions.join("\n"), "utf-8");
      let attachment = new AttachmentBuilder(fileData, { name: `vivi-result.txt` });

      return await interaction.reply({
        content: getInteractionContent(interaction, "Solver", solverString, preferBroadcast),
        files: [attachment],
        ephemeral: preferBroadcast
      })
    }

    if (solveCount === 0) {
      await replyToInteraction(interaction, "Solver", "\n• That prompt is impossible.", preferBroadcast);
    } else {
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
      
      let random_page = pages[Math.floor(Math.random() * pages.length | 0)]; // just a quick solution since no pagination
      await replyToInteraction(interaction, "Solver", random_page, preferBroadcast)
      // await PagedResponse(interaction, pages, undefined, undefined, preferBroadcast)
    }
  } catch (error) {
    if (error.name === 'PromptException' || error.name === 'SolveWorkerException') {
      await replyToInteraction(interaction, "Solver", "\n• " + error.message, preferBroadcast);
    } else {
      throw error;
    }
  }
};

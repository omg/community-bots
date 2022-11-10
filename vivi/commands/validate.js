const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName('validate')
  .setDescription('See if a prompt can be generated!')
  .addStringOption(option =>
    option.setName('word')
      .setDescription('The word to get prompts from')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('generator')
      .setDescription('The prompt generator to use for validation')
      .setRequired(false)
      .addChoices({
        name: 'All Generators',
        value: 'all'
      }, {
        name: 'Word Bomb Mini',
        value: 'wbm'
      }, {
        name: 'Word Bomb v3 - Rates',
        value: 'wb-rates'
      }, {
        name: 'Word Bomb v2 - Prefer Alternation',
        value: 'wb-prefalt'
      }, {
        name: 'Word Bomb v1 - Legacy',
        value: 'wb-legacy'
      }));

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let word = Dictionary.cleanWord(interaction.options.get("word").value);
  
  // check if the word only has valid characters
  if (invalidWordRegex.test(word)) {
    await replyToInteraction(interaction, "Word Status", "\n• Sorry, that's not a valid word!", preferBroadcast);
    return;
  }

  if (word.length > 34) {
    await replyToInteraction(interaction, "Word Status",
      '\n• **' + word.substring(0, 20) + '..'
      + '\n' + getRemarkEmoji("bad") + ' Too long** to be a valid English word.'
    , preferBroadcast);
  } else if (Dictionary.isWord(word)) {
    await replyToInteraction(interaction, "Word Status",
      '\n• **' + word
      + '\n' + getRemarkEmoji("good") + ' Available** on live servers.'
    , preferBroadcast);
  } else {
    await replyToInteraction(interaction, "Word Status",
      '\n• **' + word
      + '\n' + getRemarkEmoji("bad") + ' Not found** in the English dictionary.'
    , preferBroadcast);
  }
};

// export the command
// module.exports = {
//   data,
//   execute,
//   broadcastable: true
// };

// TODO
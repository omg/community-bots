const charactersCommandJSON = {
  name: "characters",
  description: "Get the amount of characters for a word!",
  options: [
    {
      name: "query",
      description: "The text to count words from",
      type: 3,
      required: true
    },
    {
      name: "frequency",
      description: "Whether or not to calculate character frequency",
      type: 5,
      required: false
    }
  ]
}

const { SlashCommandBuilder } = require('discord.js');
const { getRemarkEmoji } = require('../../src/emoji-renderer.js');
const { replyToInteraction } = require('../../src/command-handler.js');

const Dictionary = require('../../src/dictionary/dictionary.js');

const data = new SlashCommandBuilder()
  .setName('characters')
  .setDescription('Get the amount of characters for a word!')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The text to count words from')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('frequency')
      .setDescription('Whether or not to calculate character frequency')
      .setRequired(false)
      .setDefault(false));

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
module.exports = {
  data,
  execute,
  broadcastable: true
};
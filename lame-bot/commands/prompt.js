const { SlashCommandBuilder } = require('discord.js');
const { getRemarkEmoji } = require('../../src/emoji-renderer.js');
const { replyToInteraction } = require('../../src/command-handler.js');

const data = new SlashCommandBuilder()
  .setName('prompt')
  .setDescription('Repeat the Word Bomb Mini prompt!');

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  let word = Dictionary.cleanWord(interaction.options.get("word").value);
  
  // check if the word only has valid characters
  if (invalidWordRegex.test(word)) {
    await replyToInteraction(interaction, "Prompt", "\n• Sorry, that's not a valid word!", preferBroadcast);
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
  execute
};
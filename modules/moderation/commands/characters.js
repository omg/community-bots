const { randomInt } = require("crypto");
const { SlashCommandBuilder } = require("discord.js");
const { replyToInteraction } = require("../../src/command-handler");
const { escapeDiscordMarkdown, formatNumber } = require("../../src/utils");

const data = new SlashCommandBuilder()
  .setName('characters')
  .setDescription('Get the amount of characters in the specified text!')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The text to count characters from')
      .setRequired(true));
  // .addBooleanOption(option =>
  //   option.setName('frequency')
  //     .setDescription('Whether or not to calculate character frequency')
  //     .setRequired(false));

async function execute(interaction, preferBroadcast) {
  let query = interaction.options.get("query").value;

  let characterCount = query.length;
  let whitespaceCount = query.match(/\s/g)?.length ?? 0;

  if (characterCount === 1 || characterCount === 0) {
    characterCount = randomInt(1001, 99999);
    whitespaceCount = randomInt(0, characterCount);
  }

  await replyToInteraction(interaction, "Character Count",
    '\n> ' + (query.length > 300 ? escapeDiscordMarkdown(query.slice(0, 298) + '..') : escapeDiscordMarkdown(query))
    + '\n• **' + formatNumber(characterCount) + ' characters**' + (whitespaceCount === 0 ? '.' : ' - ' + formatNumber(characterCount - whitespaceCount) + ' ignoring whitespace.')
  , preferBroadcast);
};

// export the command
module.exports = {
  data,
  execute,
  broadcastable: true
};
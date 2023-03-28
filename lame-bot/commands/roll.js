const { SlashCommandBuilder } = require("discord.js");
const { replyToInteraction } = require("../../src/command-handler");
const { escapeDiscordMarkdown, formatNumber } = require("../../src/utils");

const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Roll a number!')
  .addIntegerOption(option =>
    option.setName('max')
      .setDescription('The maximum number to roll')
      .setMaxValue(1000000)
      .setMinValue(2)
      .setRequired(false));

async function execute(interaction, preferBroadcast) {
  let max = interaction.options.get("max").value;

  await interaction.reply({
    content: "https://i.imgur.com/R1Sp5gS.gif"
  });

  setTimeout(async () => {
    // edit the reply with @user rolls X/max
    await interaction.editReply({
      content: "<@" + interaction.user.id + "> rolls **" + formatNumber(Math.floor(Math.random() * max) + 1) + "/" + formatNumber(max) + "**."
    });
  }, 1000);
};

// export the command
module.exports = {
  data,
  execute
};
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
  let max = interaction.options.get("max")?.value ?? 10;

  await interaction.reply({
    content: "https://omg.games/assets/rolling.gif"
  });

  setTimeout(async () => {
    // edit the reply with @user rolls X/max
    await interaction.editReply({
      content: "<@" + interaction.user.id + "> rolls **" + formatNumber(Math.floor(Math.random() * max) + 1) + "/" + formatNumber(max) + "**."
    });
  }, 1200);
};

let limits = [];
limits[0] = {
  max: 2,
  interval: 10 * 60 * 1000,
  includeBotsChannel: false
}
limits[1] = {
  max: 4,
  interval: 5 * 60 * 1000,
  includeBotsChannel: false
}
limits[2] = {
  max: 20,
  interval: 20 * 60 * 1000,
  includeBotsChannel: false
}

// export the command
module.exports = {
  data,
  execute,
  cooldown: 8 * 1000,
  type: ["fun", "annoying"],
  limits
};
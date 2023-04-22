const { SlashCommandBuilder } = require("discord.js");
const { replyToInteraction } = require("../../src/command-handler");
const { escapeDiscordMarkdown, formatNumber } = require("../../src/utils");
const crypto = require("crypto");

const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Generate a private server!')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('The type of server to generate')
      .addChoices(
        {
          name: 'Word Bomb',
          value: 'WordBomb'
        }
      )
      .setRequired(true))
  .addStringOption(option => 
    option.setName('admin')
      .setDescription('The @username of the user to designate as admin')
      .setRequired(false));

async function execute(interaction, preferBroadcast) {
  let ID = crypto.randomUUID();

  let type = interaction.options.get("type").value;
  let admin = interaction.options.get("admin")?.value ?? null;

  if (type === "WordBomb") {
    let params = `{"ID":"${ID}"`
    if (admin) params += `,"admin":"${admin}"`
    params += "}";
    let encodedParams = encodeURIComponent(params);
    await replyToInteraction(interaction, "Server", "\n• Click to join your [generated private server](<https://www.roblox.com/games/2653064683?privateServerLinkCode=90443643539648180405358455659570&launchData=" + encodedParams + ">).", preferBroadcast);
  } else {
    await replyToInteraction(interaction, "Server", "\n• That server type is not supported.", preferBroadcast);
  }
};

// export the command
module.exports = {
  data,
  execute,
  noAutomaticBroadcast: true,
  type: ["utility"],
  broadcastable: true
};
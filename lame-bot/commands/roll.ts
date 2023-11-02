import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { formatNumber } from "../../src/utils";
import { SlashCommandFileData } from "../../src/commands/commands";
import { allChannelsExcept, category, everyone, role } from "../../src/commands/Permissions";

const command: SlashCommandFileData = {
  builder: new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll a number!")
  .addIntegerOption((option) =>
    option
      .setName("max")
      .setDescription("The maximum number to roll")
      .setMaxValue(1000000)
      .setMinValue(2)
      .setRequired(false)
  ),
  
  permissions: {
    channels: allChannelsExcept([
      category("Dictionary Contributions"),
      category("Lame Land")
    ])
  },

  rateLimits: {
    limits: [
      {
        roles: everyone(),
        window: 60 * 10,
        max: 2
      },
      {
        roles: role("regular"),
        window: 60 * 5,
        max: 4
      },
      {
        roles: role("reliable"),
        window: 60 * 20,
        max: 20
      }
    ],
    includeBotsChannel: false
  },

  details: {
    cooldown: 8 * 1000,
    tags: ["fun", "annoying"],
  },

  async execute(interaction: CommandInteraction, broadcast: boolean) {
    let max = interaction.options.get("max")?.value as number ?? 10;

    await interaction.reply({
      content: "https://omg.games/assets/rolling.gif"
    });

    setTimeout(async () => {
      // edit the reply with @user rolls X/max
      await interaction.editReply({
        content: "<@" + interaction.user.id + "> rolls **" + formatNumber(Math.floor(Math.random() * max) + 1) + "/" + formatNumber(max) + "**."
      });
    }, 1200);
  }
}
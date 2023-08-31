import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandDetails } from "../../src/commands/Command";
import { Permissions, allChannelsExcept, category, everyone, onlyTheseRoles, role } from "../../src/commands/Permissions";
import { getCash, spendCash } from "../../src/database/db";
import { replyToInteraction } from "../../src/command-handler";
import { formatNumber } from "../../src/utils";
import { RateLimits } from "../../src/commands/RateLimits";

export default class GambleCommand extends Command {
  static getCommand() {
    return new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble cash!")
    .addIntegerOption((option) =>
      option
        .setName("cash")
        .setDescription("The amount of cash to gamble!")
        .setMaxValue(50000)
        .setMinValue(1)
        .setRequired(true)
    );
  }

  static getPermissions(): Permissions {
    return {
      roles: onlyTheseRoles([
        role("regular")
      ]),
      channels: allChannelsExcept([
        category("Dictionary Contributions"),
        category("Lame Land")
      ])
    }
  }

  static async execute(interaction: CommandInteraction, preferBroadcast: boolean): Promise<void> {
    let cash = interaction.options.get("cash").value;

    let userCash = await getCash(interaction.user.id);
    if (userCash < cash) {
      await replyToInteraction(
        interaction,
        "Gamble",
        "\n• You don't have enough cash for that. You have " + formatNumber(userCash) + " cash.",
        false
      );
      return;
    }
    await spendCash(interaction.user.id, cash);

    let max = 87;
    let rolled = Math.floor(Math.random() * max) + 1;

    await interaction.reply({
      content: "<@" + interaction.user.id + "> is gambling **" + formatNumber(cash) + " cash**!"
    });

    setTimeout(async () => {
      await interaction.editReply({
        content: "https://omg.games/assets/rolling.gif"
      });

      setTimeout(async () => {
        await interaction.editReply({
          content:
            "<@" + interaction.user.id + "> rolls **" + formatNumber(rolled) + "/100**." +
            "\nYou need to roll 88 or higher! You lose **" + formatNumber(cash) + " cash**!"
        });
      }, 1200);
    }, 3000);
  }

  static getRateLimits(): RateLimits {
    return {
      limits: [
        {
          roles: everyone(),
          window: 60 * 10,
          max: 3
        }
      ],
      includeBotsChannel: false
    }
  }

  static getDetails(): CommandDetails {
    return {
      cooldown: 4,
      tags: ["fun", "annoying"]
    }
  }
}
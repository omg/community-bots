import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Permissions, RateLimits, allChannels, category, everyone, role } from "../../src/permissions";
import { formatNumber } from "../../src/utils";

export const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll a number!")
  .addIntegerOption((option) =>
    option
      .setName("max")
      .setDescription("The maximum number to roll")
      .setMaxValue(1000000)
      .setMinValue(2)
      .setRequired(false)
  );

export function getPermissions(): Permissions {
  return {
    channels: {
      allowed: allChannels(),
      denied: [
        category("Dictionary Contributions"),
        category("Lame Land")
      ]
    }
  }
}

export function getRateLimits(): RateLimits {
  return {
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
        roles: role("reputable"),
        window: 60 * 20,
        max: 20
      }
    ],
    includeBotsChannel: false
  }
}

export const cooldown = 8 * 1000;
export const type = ["fun", "annoying"];

export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
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
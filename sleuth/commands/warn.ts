import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Permissions, RateLimits, allChannels, category, everyone, role } from "../../src/permissions";
import { replyToInteraction } from "../../src/command-handler";

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a user.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to warn")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("The reason to warn them")
      .setRequired(false)
  );

export function getPermissions(): Permissions {
  return {
    roles: {
      denied: everyone(),
      allowed: role("regular")
    },
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

export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
  
}
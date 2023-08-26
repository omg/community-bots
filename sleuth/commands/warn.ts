import { CommandInteraction, SlashCommandBuilder } from "discord.js";
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

export async function execute(interaction: CommandInteraction, preferBroadcast: boolean) {
  
}
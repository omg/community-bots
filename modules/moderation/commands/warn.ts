import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommandFileData, onlyTheseRoles, role } from "../../../src/commands/Permissions";
import { replyToInteraction } from "../../../src/command-handler";

const command: SlashCommandFileData = {
  builder: new SlashCommandBuilder()
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
  ),
  
  permissions: {
    roles: role("mod")
  },

  async execute(interaction: CommandInteraction, broadcast: boolean) {
    
  }
}

export default command;
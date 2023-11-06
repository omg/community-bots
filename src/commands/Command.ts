import { CommandInteraction } from "discord.js";
import { getCommandDataFromFileData } from "./commands";
import { CommandData, SlashCommandFileData, StrictConstraints, StrictPermissions } from "./Permissions";

export class Command implements CommandData {
  name: string;

  permissions: StrictPermissions;
  constraints: StrictConstraints;

  tags: string[];
  broadcastable: boolean;

  executeFunction: (interaction: CommandInteraction, broadcast: boolean) => Promise<void>;

  constructor(fileData: SlashCommandFileData) {
    const commandData = getCommandDataFromFileData(fileData);

    this.name = fileData.builder.toJSON().name; // wacky and weird
    this.executeFunction = fileData.execute;
    
    this.permissions = commandData.permissions;
    this.constraints = commandData.constraints;

    this.tags = commandData.tags;
    this.broadcastable = commandData.broadcastable;
  }

  async execute(interaction: CommandInteraction, broadcast: boolean): Promise<void> {
    return await this.executeFunction(interaction, broadcast);
  }
}
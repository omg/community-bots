import { CommandInteraction } from "discord.js";
import { CommandData, NormalizedCommandDetails, SlashCommandFileData, getCommandDataFromFileData } from "./commands";
import { NormalizedRateLimits } from "./RateLimits";
import { NormalizedPermissions } from "./Permissions";

export class Command implements CommandData {
  name: string;

  permissions: NormalizedPermissions;
  rateLimits: NormalizedRateLimits;
  details: NormalizedCommandDetails;

  executeFunction: (interaction: CommandInteraction, broadcast: boolean) => Promise<void>;

  constructor(fileData: SlashCommandFileData) {
    const commandData = getCommandDataFromFileData(fileData);

    this.name = fileData.builder.toJSON().name; // wacky and weird
    this.executeFunction = fileData.execute;
    
    this.permissions = commandData.permissions;
    this.rateLimits = commandData.rateLimits;
    this.details = commandData.details;
  }

  async execute(interaction: CommandInteraction, broadcast: boolean): Promise<void> {
    return await this.executeFunction(interaction, broadcast);
  }
}
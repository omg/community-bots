import { CommandInteraction } from "discord.js";
import { Permissions, RateLimits } from "../permissions";

export type CommandDetails = {
  cooldown?: number;
  tags?: string[];
  broadcastable?: boolean;
}

export abstract class Command {
  public abstract command: any;

  static getPermissions(): Permissions {
    return {}
  }

  static getRateLimits(): RateLimits {
    return {}
  }

  static execute(interaction: CommandInteraction, preferBroadcast: boolean): void {
    throw new Error(`/${this.name} does not have an execute method implemented`);
  }

  static getDetails(): CommandDetails {
    return {}
  }
}
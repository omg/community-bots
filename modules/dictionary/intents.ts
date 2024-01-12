import { GatewayIntentBits, MessageMentionOptions, PermissionsBitField } from "discord.js";

type ModuleIntents = {
  permissions: bigint[],
  intents: number[],
  allowedMentions?: MessageMentionOptions
}

const test: ModuleIntents = {
  permissions: [
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.ChangeNickname
  ],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations
  ],
  allowedMentions: { parse: ['users'] }
};
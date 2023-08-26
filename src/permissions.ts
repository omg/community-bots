import { ApplicationCommandPermissionType, ApplicationCommandPermissions, Client, GuildBasedChannel } from "discord.js";

// have constants such as
// noGameChannels, enforceLameLock, enforceCommandLock, noChatChannels, noVoiceChannels, etc.
// in the future

const guildID = process.env.GUILD_ID;

export function getChannelIDsInCategoryID(client: Client, category: string): string[] {
  let guild = client.guilds.cache.get(process.env.GUILD_ID);
  let channels = guild.channels.cache.filter((channel: GuildBasedChannel) => channel.isTextBased() && channel.parentId === category);
  return channels.map(c => c.id);
}

export function getChannelIDsInCategoryName(client: Client, category: string): string[] {
  let guild = client.guilds.cache.get(process.env.GUILD_ID);
  let channels = guild.channels.cache.filter((channel: GuildBasedChannel) => channel.isTextBased() && channel.parent?.name === category);
  return channels.map(c => c.id);
}

export function getChannelIDsByChannelName(client: Client, name: string): string[] {
  let guild = client.guilds.cache.get(process.env.GUILD_ID);
  let channels = guild.channels.cache.filter((channel: GuildBasedChannel) => channel.isTextBased() && channel.name === name);
  return channels.map(c => c.id);
}

export function allChannels(permission: boolean): ApplicationCommandPermissions {
  return {
    id: (BigInt(guildID) - BigInt(1)).toString(),
    type: ApplicationCommandPermissionType.Channel,
    permission: permission
  }
}

export function everyone(permission: boolean): ApplicationCommandPermissions {
  return {
    id: guildID,
    type: ApplicationCommandPermissionType.Role,
    permission: permission
  }
}

export function channel(channelID: string, permission: boolean): ApplicationCommandPermissions {
  return {
    id: channelID,
    type: ApplicationCommandPermissionType.Channel,
    permission: permission
  }
}

export function role(roleID: string, permission: boolean): ApplicationCommandPermissions {
  return {
    id: roleID,
    type: ApplicationCommandPermissionType.Role,
    permission: permission
  }
}

export function roleFromName(client: Client, roleName: string, permission: boolean): ApplicationCommandPermissions {
  let guild = client.guilds.cache.get(process.env.GUILD_ID);
  let role = guild.roles.cache.find(r => r.name === roleName);
  if (!role) return null;

  return {
    id: role.id,
    type: ApplicationCommandPermissionType.Role,
    permission: permission
  }
}

export function allChannelsExcept(channelID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof channelID === "string") channelID = [channelID];

  return [
    allChannels(true),
    ...channelID.map(id => channel(id, false))
  ];
}

export function everyoneExcept(roleID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof roleID === "string") roleID = [roleID];

  return [
    everyone(true),
    ...roleID.map(id => role(id, false))
  ];
}

export function onlyTheseChannels(channelID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof channelID === "string") channelID = [channelID];

  return [
    everyone(false),
    ...channelID.map(id => channel(id, true))
  ];
}

export function onlyTheseRoles(roleID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof roleID === "string") roleID = [roleID];

  return [
    everyone(false),
    ...roleID.map(id => role(id, true))
  ];
}
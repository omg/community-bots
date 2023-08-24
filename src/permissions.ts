import { ApplicationCommandPermissionType, ApplicationCommandPermissions } from "discord.js";

// noGameChannels, enforceLameLock, enforceCommandLock, noChatChannels, noVoiceChannels, etc.

export function allChannels(guildID: string, permission: boolean): ApplicationCommandPermissions {
  return {
    id: (BigInt(guildID) - BigInt(1)).toString(),
    type: ApplicationCommandPermissionType.Channel,
    permission: permission
  }
}

export function everyone(guildID: string, permission: boolean): ApplicationCommandPermissions {
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

export function allChannelsExcept(guildID: string, channelID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof channelID === "string") channelID = [channelID];

  return [
    allChannels(guildID, true),
    ...channelID.map(id => channel(id, false))
  ];
}

export function everyoneExcept(guildID: string, roleID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof roleID === "string") roleID = [roleID];

  return [
    everyone(guildID, true),
    ...roleID.map(id => role(id, false))
  ];
}

export function onlyTheseChannels(guildID: string, channelID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof channelID === "string") channelID = [channelID];

  return [
    everyone(guildID, false),
    ...channelID.map(id => channel(id, true))
  ];
}

export function onlyTheseRoles(guildID: string, roleID: string[] | string): ApplicationCommandPermissions[] {
  if (typeof roleID === "string") roleID = [roleID];

  return [
    everyone(guildID, false),
    ...roleID.map(id => role(id, true))
  ];
}
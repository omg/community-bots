// Specific channels, categories, and roles

export type PermissionType = "channel" | "category" | "role";

export type PermissionEntity = {
  type: PermissionType,
  name: string,
}

export function channel(channelName: string): PermissionEntity {
  return {
    type: "channel",
    name: channelName
  }
}

export function category(categoryName: string): PermissionEntity {
  return {
    type: "category",
    name: categoryName
  }
}

export function role(roleName: string): PermissionEntity {
  return {
    type: "role",
    name: roleName
  }
}

export function everyone(): PermissionEntity {
  return {
    type: "role",
    name: "*"
  }
}

export function allChannels(): PermissionEntity {
  return {
    type: "channel",
    name: "*"
  }
}


export function allChannelsExcept(channels: PermissionGroup): Overrides {
  return {
    allowed: allChannels(),
    denied: channels
  };
}

export function everyoneExcept(roles: PermissionGroup): Overrides {
  return {
    allowed: everyone(),
    denied: roles
  }
}

export function onlyTheseChannels(channels: PermissionGroup): Overrides {
  return {
    allowed: channels,
    denied: allChannels()
  }
}

export function onlyTheseRoles(roles: PermissionGroup): Overrides {
  return {
    allowed: roles,
    denied: everyone()
  }
}

// Everyone and all channels

// everyone: guildID
// all channels: guildID - 1

export type PermissionGroup = PermissionEntity[] | PermissionEntity;

export type GroupPermissions = Overrides | PermissionGroup;

export type Overrides = {
  allowed: PermissionGroup,
  denied: PermissionGroup
}

export type NormalizedOverrides = {
  allowed: PermissionEntity[],
  denied: PermissionEntity[]
}

export type Permissions = {
  roles?: GroupPermissions,
  channels?: GroupPermissions
}

export type NormalizedPermissions = {
  roles: NormalizedOverrides,
  channels: NormalizedOverrides
}
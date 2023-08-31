// Specific channels, categories, and roles

type PermissionsObject = {
  type: "channel" | "category" | "role",
  name: string,
}

export function channel(channelName: string): PermissionsObject {
  return {
    type: "channel",
    name: channelName
  }
}

export function category(categoryName: string): PermissionsObject {
  return {
    type: "category",
    name: categoryName
  }
}

export function role(roleName: string): PermissionsObject {
  return {
    type: "role",
    name: roleName
  }
}

export function everyone(): PermissionsObject {
  return {
    type: "role",
    name: "*"
  }
}

export function allChannels(): PermissionsObject {
  return {
    type: "channel",
    name: "*"
  }
}


export function allChannelsExcept(channels: PermissionsList): Overrides {
  return {
    allowed: allChannels(),
    denied: channels
  };
}

export function everyoneExcept(roles: PermissionsList): Overrides {
  return {
    allowed: everyone(),
    denied: roles
  }
}

export function onlyTheseChannels(channels: PermissionsList): Overrides {
  return {
    allowed: channels,
    denied: allChannels()
  }
}

export function onlyTheseRoles(roles: PermissionsList): Overrides {
  return {
    allowed: roles,
    denied: everyone()
  }
}

// Everyone and all channels

// everyone: guildID
// all channels: guildID - 1

type PermissionsList = PermissionsObject[] | PermissionsObject;

type Overrides = {
  allowed: PermissionsList,
  denied: PermissionsList
}

export type Permissions = {
  roles?: Overrides,
  channels?: Overrides
}

type RateLimit = {
  roles: PermissionsList,
  window: number,
  max: number
}

export type RateLimits = {
  limits?: RateLimit[],
  includeBotsChannel?: boolean
}
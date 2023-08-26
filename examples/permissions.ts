function category(_: string): string[] { return [] }
function role(_: string): string { return "" }
function everyone(): string { return "" } // guildID
function allChannels(): string { return "" } // guildID - 1

type IDPermissions = string | string[] | string[][];

type Permissions = {
  channels?: {
    allowed: IDPermissions,
    denied: IDPermissions
  },
  roles?: {
    allowed: IDPermissions,
    denied: IDPermissions
  }
}

type RateLimit = {
  roles: IDPermissions,
  window: number,
  max: number
}

export function getPermissions(): Permissions {
  return {
    channels: {
      allowed: allChannels(),
      denied: [
        category("Dictionary Contributions"),
        category("Lame Land")
      ]
    },
    roles: {
      allowed: role("regular"),
      denied: everyone()
    }
  }
}

export function getRateLimits(): RateLimit[] {
  return [
    {
      roles: everyone(),
      window: 60,
      max: 1
    },
    {
      roles: [
        role("reputable"),
        role("mod")
      ],
      window: 60,
      max: 2
    }
  ]
}
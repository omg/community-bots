import { Permissions, RateLimits, allChannels, category, everyone, role } from "./permissions";

export function getPermissions(): Permissions {
  return {
    roles: {
      denied: everyone(),
      allowed: role("regular")
    },
    channels: {
      allowed: allChannels(),
      denied: [
        category("Dictionary Contributions"),
        category("Lame Land")
      ]
    }
  }
}
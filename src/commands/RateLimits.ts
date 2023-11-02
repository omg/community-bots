import { PermissionEntity, PermissionGroup } from "./Permissions"

export type RateLimit = {
  roles: PermissionGroup,
  window: number,
  max: number
}

export type NormalizedRateLimit = Omit<RateLimit, 'roles'> & {
  roles: PermissionEntity[]
}

export type RateLimits = {
  limits?: RateLimit[],
  includeBotsChannel?: boolean
}

export type NormalizedRateLimits = {
  limits: NormalizedRateLimit[],
  includeBotsChannel: boolean
}
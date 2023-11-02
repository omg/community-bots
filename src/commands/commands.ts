import { CommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { Permissions, GroupPermissions, NormalizedOverrides, NormalizedPermissions, PermissionType } from "./Permissions";
import { RateLimits, NormalizedRateLimits, RateLimit, NormalizedRateLimit } from "./RateLimits";

export type CommandDetails = {
  cooldown?: number;
  tags?: string[];
  broadcastable?: boolean;
}

export type NormalizedCommandDetails = {
  cooldown: number;
  tags: string[];
  broadcastable: boolean;
}

export type CommandData = {
  permissions: NormalizedPermissions;
  rateLimits: NormalizedRateLimits;
  details: NormalizedCommandDetails;
}

// instead of making all of the commands their own classes that extend Command, why not just make them functions and data that are then fed into a new Command()?
// for that same reason - what's the point of making Game classes in OMG?

export type SlashCommandFileData = {
  builder: any;

  permissions?: Permissions;
  rateLimits?: RateLimits;
  details?: CommandDetails;

  execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
}

// export type SlashCommand = {
//   // name: string;

//   // permissions: NormalizedPermissions;
//   // rateLimits: NormalizedRateLimits;
//   // details: NormalizedCommandDetails; // from CommandData

//   execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
// } & CommandData;

export function getCommandDataFromFileData(command: SlashCommandFileData): CommandData {
  // Get the defined permissions for this command
  const permissions = command.permissions ?? {};

  // Normalize the permissions to arrays of PermissionEntities
  const normalizedPermissions: NormalizedPermissions = {
    roles: convertToNormalizedOverrides(permissions.roles),
    channels: convertToNormalizedOverrides(permissions.channels)
  }

  // Fix the permissions to ensure validity (removing duplicates, enforcing global permissions, etc.)
  fixNormalizedOverrides(normalizedPermissions.roles, ["role"])
  fixNormalizedOverrides(normalizedPermissions.channels, ["channel", "category"])

  // Get the defined rate limits for this command
  const rateLimits = command.rateLimits ?? {};

  // Normalize the rate limits to arrays of PermissionEntities
  const normalizedRateLimits: NormalizedRateLimits = {
    limits: convertToNormalizedRateLimits(rateLimits.limits),
    includeBotsChannel: rateLimits.includeBotsChannel ?? false
  }

  // Fix the rate limits to ensure validity (removing incorrect types, empty limits, etc.)
  fixNormalizedRateLimits(normalizedRateLimits);

  // Get the defined details for this command
  const details = command.details ?? {};

  // Enforce default values for details
  const normalizedDetails: NormalizedCommandDetails = {
    cooldown: details.cooldown ?? 2,
    tags: details.tags ?? [],
    broadcastable: details.broadcastable ?? false
  }

  return {
    permissions: normalizedPermissions,
    rateLimits: normalizedRateLimits,
    details: normalizedDetails
  }
}

function fixNormalizedOverrides(overrides: NormalizedOverrides, allowedTypes: PermissionType[]) {
  // Remove PermissionsObjects of the incorrect type
  overrides.allowed = overrides.allowed.filter(perm => allowedTypes.includes(perm.type));
  overrides.denied = overrides.denied.filter(perm => allowedTypes.includes(perm.type));

  // Remove duplicates
  overrides.allowed = overrides.allowed.filter((perm, index, self) => {
    return self.findIndex(p => p.name === perm.name) === index;
  });
  overrides.denied = overrides.denied.filter((perm, index, self) => {
    return self.findIndex(p => p.name === perm.name) === index;
  });

  // Remove roles from the allowed list if they are in the denied list
  overrides.allowed = overrides.allowed.filter(perm => {
    return !overrides.denied.some(denied => denied.name === perm.name);
  });

  // Check if there is no global role in either list
  if (!overrides.allowed.some(perm => perm.name === "*") && !overrides.denied.some(perm => perm.name === "*")) {
    if (overrides.allowed.length === 0) {
      // Add global to the allowed list if there are no allowed roles
      overrides.allowed.push({
        type: allowedTypes[0],
        name: "*"
      });
    } else {
      // Otherwise, add global to the denied list
      overrides.denied.push({
        type: allowedTypes[0],
        name: "*"
      });
    }
  }
}

function convertToNormalizedOverrides(permissions: GroupPermissions): NormalizedOverrides {
  // If there are no permissions, return empty Overrides
  if (!permissions) {
    return {
      allowed: [],
      denied: []
    }
  }

  // If it's an array, put it in the allowed list of new Overrides
  if (permissions instanceof Array) {
    return {
      allowed: permissions,
      denied: []
    }
  }

  // If it's a single object, add it to the allowed list of new Overrides
  if ("type" in permissions) {
    return {
      allowed: [permissions],
      denied: []
    }
  }

  // It now must be an Overrides object
  // Convert the allowed and denied lists to arrays if they aren't already
  return {
    allowed: permissions.allowed instanceof Array ? permissions.allowed : [permissions.allowed],
    denied: permissions.denied instanceof Array ? permissions.denied : [permissions.denied]
  }
}

function convertToNormalizedRateLimits(rateLimits: RateLimit[]): NormalizedRateLimit[] {
  // If there are no rate limits, return an empty array
  if (!rateLimits) return [];

  // Otherwise, convert roles in rate limits to arrays
  const normalizedRateLimits: NormalizedRateLimit[] = rateLimits.map(limit => {
    const newLimit: NormalizedRateLimit = {
      roles: limit.roles instanceof Array ? limit.roles : [limit.roles],
      window: limit.window,
      max: limit.max
    }

    return newLimit;
  });

  return normalizedRateLimits;
}

function fixNormalizedRateLimits(rateLimits: NormalizedRateLimits) {
  // Remove incorrect types from the roles list of each rate limit
  rateLimits.limits.forEach(limit => {
    limit.roles = limit.roles.filter(role => role.type === "role");
  });

  // Remove rate limits with no roles
  rateLimits.limits = rateLimits.limits.filter(limit => limit.roles.length > 0);
}
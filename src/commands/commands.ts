import { CommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { LoosePermissions, BroadOverrides, StrictSpecificOverrides, StrictPermissions, PermissionType, SlashCommandFileData, CommandData, convertBroadOverridesToStrictSpecificOverrides } from "./Permissions";

// export type SlashCommand = {
//   // name: string;

//   // permissions: NormalizedPermissions;
//   // rateLimits: NormalizedRateLimits;
//   // details: NormalizedCommandDetails; // from CommandData

//   execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
// } & CommandData;

export function getCommandDataFromFileData(command: SlashCommandFileData): CommandData {
  // Get the defined permissions for this command (or a default empty object if none are defined)
  const permissions = command.permissions ?? {};

  // Convert the loose permissions to strict permissions (making the data uniform)
  const strictPermissions: StrictPermissions = {
    roles: convertBroadOverridesToStrictSpecificOverrides(permissions.roles),
    channels: convertBroadOverridesToStrictSpecificOverrides(permissions.channels)
  }

  // Fix the permissions to ensure validity (removing duplicates, enforcing global permissions, etc.)
  fixStrictSpecificOverrides(strictPermissions.roles, ["role"])
  fixStrictSpecificOverrides(strictPermissions.channels, ["channel", "category"])

  /**
   * SlashCommandFileData
          {
            builder: any; // useless but can get the name from it at least
            permissions?: LoosePermissions; // done (maybe check if the default is okay)
            constraints?: LooseConstraints;
            tags?: string[];
            broadcastable?: boolean;
            execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
          }
   */

  /**
   * CommandData
          {
            permissions: StrictPermissions;
            constraints: StrictConstraints;
            tags: string[];
            broadcastable: boolean;
          }
   */

  // Get the defined rate limits for this command
  const rateLimits = command.constraints ?? {};

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
    permissions: strictPermissions,
    rateLimits: normalizedRateLimits,
    details: normalizedDetails
  }
}

function fixStrictSpecificOverrides(overrides: StrictSpecificOverrides<any>) {
  // no longer necessary due to type checking
  // Remove PermissionsObjects of the incorrect type
  // overrides.allowed = overrides.allowed.filter(perm => allowedTypes.includes(perm.type));
  // overrides.denied = overrides.denied.filter(perm => allowedTypes.includes(perm.type));

  // Remove duplicates
  overrides.allowed = overrides.allowed.filter((perm, index, self) => {
    return self.findIndex(p => p.name === perm.name) === index;
  });
  overrides.denied = overrides.denied.filter((perm, index, self) => {
    return self.findIndex(p => p.name === perm.name) === index;
  });

  // Remove roles from the allowed list if they are in the denied list (Discord prioritizes allow - but to be safe for us, we will prioritize deny)
  overrides.allowed = overrides.allowed.filter(perm => {
    return !overrides.denied.some(denied => denied.name === perm.name);
  });

  // Check if there is no global role in either list
  if (!overrides.allowed.some(perm => perm.name === "*") && !overrides.denied.some(perm => perm.name === "*")) {
    if (overrides.allowed.length === 0) {
      // Add global to the allowed list if there are no allowed roles
      overrides.allowed.push({
        type: allowedTypes[0], // seems like a bit of an issue
        name: "*"
      });
    } else {
      // Otherwise, add global to the denied list
      overrides.denied.push({
        type: allowedTypes[0], // seems like a bit of an issue
        name: "*"
      });
    }
  }
}

function convertToNormalizedConstraints(constraints?: Constraint[]): NormalizedConstraint[] {
  // If there are no constraints, return an empty array
  if (!constraints) {
    return [];
  }

  // Map through the constraints and normalize them
  return constraints.map(constraint => ({
    ...constraint, 
    roles: Array.isArray(constraint.roles) ? constraint.roles : [constraint.roles]
  }));
}

function removeConstraintsOfIncorrectType(constraints: NormalizedConstraint[]) {
  // Remove constraints that have incorrect types in their roles list
  return constraints.map(constraint => {
    constraint.roles = constraint.roles.filter(role => role.type === "role");
    return constraint;
  });
}

// should allow for everyoneExcept() and stuff

function fixNormalizedRateLimits(rateLimits: NormalizedRateLimits) {
  // Remove incorrect types from the roles list of each rate limit
  rateLimits.limits.forEach(limit => {
    limit.roles = limit.roles.filter(role => role.type === "role");
  });

  // Remove rate limits with no roles
  rateLimits.limits = rateLimits.limits.filter(limit => limit.roles.length > 0);
}
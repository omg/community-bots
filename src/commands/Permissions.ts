import { CommandInteraction } from "discord.js";

export type ChannelTypes = "channel" | "category" | "global";
export type RoleTypes = "role" | "global";
export type GlobalType = "global";

export type PermissionType = ChannelTypes | RoleTypes;

export type PermissionEntity<T extends PermissionType> = {
  type: T,
  name: string,
}

export type PermissionGroup<T extends PermissionType> = PermissionEntity<T> | PermissionEntity<T>[];

export function makePermissionGroupAnArray<T extends PermissionType>(group: PermissionGroup<T>): PermissionEntity<T>[] {
  return Array.isArray(group) ? group : [group];
}

//

export type LooseSpecificOverrides<T extends PermissionType> = {
  allowed: PermissionGroup<T>,
  denied: PermissionGroup<T>
}

// a PermissionGroup can be Overrides where everyone in the PermissionGroup is allowed and everyone else is denied
export type BroadOverrides<T extends PermissionType> = LooseSpecificOverrides<T> | PermissionGroup<T>;

export type StrictSpecificOverrides<T extends PermissionType> = {
  allowed: PermissionEntity<T>[],
  denied: PermissionEntity<T>[]
} & Omit<LooseSpecificOverrides<T>, "allowed" | "denied">; // the omit is just in case new properties are added to LooseSpecificOverrides

export function makeBroadOverridesSpecific<T extends PermissionType>(
  overrides?: BroadOverrides<T>
): StrictSpecificOverrides<T> {
  // If there are no overrides, return empty StrictSpecificOverrides
  if (!overrides) {
    return {
      allowed: [],
      denied: []
    }
  }

  // If it's an array, it's a PermissionEntity[]. Put it in the allowed list of new Overrides
  if (Array.isArray(overrides)) {
    return {
      allowed: overrides, // overrides could be a subtype of T, so we have to cast it. i'm pretty confident this is safe
      denied: []
    }
  }

  // If it has a type, it's a PermissionEntity. Add it to the allowed list of new Overrides
  if ("type" in overrides) {
    return {
      allowed: [overrides], // overrides could be a subtype of T, so we have to cast it. i'm pretty confident this is safe
      denied: []
    }
  }

  // At this point, we've determined they are LooseSpecificOverrides. Convert them to StrictSpecificOverrides
  const { allowed, denied } = overrides;
  return {
    allowed: makePermissionGroupAnArray(allowed),
    denied: makePermissionGroupAnArray(denied)
  }
}

//

export type LoosePermissions = {
  roles?: BroadOverrides<RoleTypes>,
  channels?: BroadOverrides<ChannelTypes>
}

export type StrictPermissions = {
  roles: StrictSpecificOverrides<RoleTypes>,
  channels: StrictSpecificOverrides<ChannelTypes>
}

const GLOBAL: PermissionEntity<"global"> = { type: "global", name: "*" };

const DEFAULT_PERMISSIONS: StrictPermissions = {
  roles: {
    allowed: [GLOBAL],
    denied: []
  },
  channels: {
    allowed: [GLOBAL],
    denied: []
  }
}

// Convert the permissions to StrictPermissions (makePermissionsStrict will use the default permissions if none are provided)
// Then normalize the permissions (enforce globals, remove roles from allowed if they are denied, etc.)
export function normalizePermissions(permissions?: StrictPermissions | LoosePermissions): StrictPermissions {
  const newPermissions = makePermissionsStrict(permissions);
  return {
    roles: normalizeStrictSpecificOverrides(newPermissions.roles),
    channels: normalizeStrictSpecificOverrides(newPermissions.channels)
  }
}

export function normalizeStrictSpecificOverrides<T extends PermissionType>(
  overrides: StrictSpecificOverrides<T | "global">
): StrictSpecificOverrides<T | "global"> {
  // Remove roles from the allowed list if they are in the denied list (Discord prioritizes allow - but to be safe for us, we will prioritize deny)
  overrides.allowed = overrides.allowed.filter(perm => {
    const allGood = !overrides.denied.some(denied => denied.name === perm.name);
    if (!allGood) {
      // this isn't totally helpful because it doesn't say which command it is - but it's better than nothing atm
      console.warn(`Role ${perm.name} is in both the allowed and denied list for a command. It will be removed from the allowed list.`);
    }
    return allGood;
  });

  // Check if there is no global role in either list
  if (!overrides.allowed.some(perm => perm.name === "*") && !overrides.denied.some(perm => perm.name === "*")) {
    if (overrides.allowed.length === 0) {
      // Add global to the allowed list if there are no allowed roles
      overrides.allowed.push({
        type: "global",
        name: "*"
      });
    } else {
      // Otherwise, add global to the denied list
      overrides.denied.push({
        type: "global",
        name: "*"
      });
    }
  }

  return overrides;
}

export function makePermissionsStrict(permissions: LoosePermissions = DEFAULT_PERMISSIONS): StrictPermissions {
  return {
    roles: makeBroadOverridesSpecific(permissions.roles),
    channels: makeBroadOverridesSpecific(permissions.channels)
  }
}

//

type Scope = "default" | "local" | "all" | "none";

type ScopeTypes<T extends Scope> = 
  T extends "all" ? "default" | "local" :
  T extends "default" ? "default" :
  T extends "local" ? "local" :
  never;

export type RateLimit = {
  window: number,
  max: number
}

export type Constraint<T extends Scope> = {
  rateLimit?: RateLimit | ScopeTypes<T>,
  cooldown?: number | ScopeTypes<T>,
  enforceInBotsChannel?: boolean | ScopeTypes<T> // should this be optional for strict? YES - since higher roles shouldn't override from a value that wasn't even specified
}

export type LooseConstraintRule<T extends Scope> = {
  roles: PermissionGroup<RoleTypes>,
  // enforceInBotsChannel?: boolean
} & Constraint<T>;

export type LooseConstraints = {
  rules: LooseConstraintRule<"all">[],
  enforceRulesInBotsChannel: boolean
}

export type StrictConstraintRule<T extends Scope> = {
  roles: PermissionEntity<RoleTypes>[],
} & Omit<LooseConstraintRule<T>, 'roles'>; // just in case new properties are added to LooseConstraintRule

export type StrictConstraints = {
  rules: StrictConstraintRule<"all">[],
  enforceRulesInBotsChannel: boolean
}

const DEFAULT_CONSTRAINTS: StrictConstraints = {
  rules: [],
  enforceRulesInBotsChannel: false
}

export function makeConstraintRuleStrict<T extends Scope>(rule: LooseConstraintRule<T>): StrictConstraintRule<T> {
  return {
    ...rule,
    roles: makePermissionGroupAnArray(rule.roles)
  }
}

export function makeConstraintsStrict(constraints: LooseConstraints = DEFAULT_CONSTRAINTS): StrictConstraints {
  // Use the default constraint values if none are provided (currently not possible because all properties are required)
  constraints = {
    ...DEFAULT_CONSTRAINTS,
    ...constraints
  }

  return {
    rules: constraints.rules.map((rule) => makeConstraintRuleStrict(rule)),
    enforceRulesInBotsChannel: constraints.enforceRulesInBotsChannel
  }
}

//

export function channel(channelName: string): PermissionEntity<"channel"> {
  return {
    type: "channel",
    name: channelName
  }
}

export function category(categoryName: string): PermissionEntity<"category"> {
  return {
    type: "category",
    name: categoryName
  }
}

export function role(roleName: string): PermissionEntity<"role"> {
  return {
    type: "role",
    name: roleName
  }
}

export function everyone(): PermissionEntity<"global"> { // this right?
  return GLOBAL;
}

export function allChannels(): PermissionEntity<"global"> {
  return GLOBAL;
}

export function nobody(): PermissionEntity<RoleTypes>[] {
  return [];
}

export function noone(): PermissionEntity<RoleTypes>[] {
  return [];
}

export function nowhere(): PermissionEntity<ChannelTypes>[] {
  return [];
}

export function allChannelsExcept(channels: PermissionGroup<ChannelTypes>): LooseSpecificOverrides<ChannelTypes> {
  return {
    allowed: allChannels(),
    denied: channels
  };
}

export function everyoneExcept(roles: PermissionGroup<RoleTypes>): LooseSpecificOverrides<RoleTypes> {
  return {
    allowed: everyone(),
    denied: roles
  }
}

export function onlyTheseChannels(channels: PermissionGroup<ChannelTypes>): LooseSpecificOverrides<ChannelTypes> {
  return {
    allowed: channels,
    denied: allChannels()
  }
}

export function onlyTheseRoles(roles: PermissionGroup<"role" | "global">): LooseSpecificOverrides<"role" | "global"> {
  return {
    allowed: roles,
    denied: everyone()
  }
}

export function onlyThesePeople(roles: PermissionGroup<RoleTypes>): LooseSpecificOverrides<RoleTypes> {
  return {
    allowed: roles,
    denied: everyone()
  }
}

// Everyone and all channels

// everyone: guildID
// all channels: guildID - 1

// commands

// i feel like just put these in the command

// export type CommandDetails = {
//   tags?: string[];
//   broadcastable?: boolean;
// }

// there doesn't seem to be a point to enforce this for now
// export type StrictCommandDetails = {
//   tags: string[];
//   broadcastable: boolean;
// }

export type CommandData = {
  permissions: StrictPermissions;
  constraints: StrictConstraints;
  limits: Constraint<"default">;

  tags: string[];
  broadcastable: boolean;

  // details: CommandDetails;
}

// instead of making all of the commands their own classes that extend Command, why not just make them functions and data that are then fed into a new Command()?
// for that same reason - what's the point of making Game classes in OMG?

export type SlashCommandFileData = {
  builder: any;

  permissions?: LoosePermissions;
  constraints?: LooseConstraints;
  limits?: Constraint<"default">;

  // details?: CommandDetails; // what's the point of details instead of just putting it in the command itself?

  tags?: string[];
  broadcastable?: boolean;

  execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
}

export function getCommandDataFromFileData(command: SlashCommandFileData): CommandData {
  const permissions = normalizePermissions(command.permissions);

  // i think there is nothing to normalize for constraints
  // just make it strict
  const constraints = makeConstraintsStrict(command.constraints);

  const limits = command.limits;

  const tags = command.tags ?? [];
  const broadcastable = command.broadcastable ?? false;

  return {
    permissions,
    constraints,
    limits,
    tags,
    broadcastable
  }
}
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

//

export function convertBroadOverridesToStrictSpecificOverrides<T extends PermissionType>(
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
    allowed: Array.isArray(allowed) ? allowed : [allowed],
    denied: Array.isArray(denied) ? denied : [denied]
  }
}

//

// export type LooseSpecificChannelOverrides = {
//   allowed: PermissionGroup<ChannelTypes>,
//   denied: PermissionGroup<ChannelTypes>
// }
// export type LooseSpecificRoleOverrides = {
//   allowed: PermissionGroup<RoleTypes>,
//   denied: PermissionGroup<RoleTypes>
// }

//

export type LoosePermissions = {
  roles?: BroadOverrides<RoleTypes>,
  channels?: BroadOverrides<ChannelTypes>
}

export type StrictPermissions = {
  roles: StrictSpecificOverrides<RoleTypes>,
  channels: StrictSpecificOverrides<ChannelTypes>
}

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

const global: PermissionEntity<"global"> = { type: "global", name: "*" };

export function everyone(): PermissionEntity<"global"> { // this right?
  return global;
}

export function allChannels(): PermissionEntity<"global"> {
  return global;
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

//

type Scope = "global" | "local" | "all" | "none";

type ScopeTypes<T extends Scope> = 
  T extends "all" ? "global" | "local" :
  T extends "global" ? "global" :
  T extends "local" ? "local" :
  never;

export type RateLimit = {
  window: number,
  max: number
}

export type Constraint<T extends Scope> = {
  rateLimit?: RateLimit | ScopeTypes<T>,
  cooldown?: number | ScopeTypes<T>,
}

export type LooseConstraintRule<T extends Scope> = {
  roles: PermissionGroup<RoleTypes>,
  enforceInBotsChannel?: boolean
} & Constraint<T>;

export type LooseConstraints = {
  rules: LooseConstraintRule<"all">[],
  enforceRulesInBotsChannel: boolean
}

export type StrictConstraintRule<T extends Scope> = {
  roles: PermissionEntity<RoleTypes>[],
} & Omit<LooseConstraintRule<T>, 'roles'>; // maybe enforceInBotsChannel should be required

export type StrictConstraints = {
  rules: StrictConstraintRule<"all">[],
  enforceRulesInBotsChannel: boolean
}

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
  limits: Constraint<"global">;

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
  limits?: Constraint<"global">;

  // details?: CommandDetails; // what's the point of details instead of just putting it in the command itself?

  tags?: string[];
  broadcastable?: boolean;

  execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
}
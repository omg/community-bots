import { CommandInteraction } from "discord.js";

export type PermissionType = "channel" | "category" | "role";

export type PermissionEntity = {
  type: PermissionType,
  name: string,
}

export type PermissionGroup = PermissionEntity[] | PermissionEntity;

//

export type ChannelPermissionEntity = PermissionEntity & { type: "channel" | "category" }
export type RolePermissionEntity = PermissionEntity & { type: "role" }

export type ChannelPermissionGroup = ChannelPermissionEntity[] | ChannelPermissionEntity;
export type RolePermissionGroup = RolePermissionEntity[] | RolePermissionEntity;

//

export type LooseSpecificOverrides = {
  allowed: PermissionGroup,
  denied: PermissionGroup
}

// a PermissionGroup can be Overrides where everyone in the PermissionGroup is allowed and everyone else is denied
export type BroadOverrides = LooseSpecificOverrides | PermissionGroup;

export type StrictSpecificOverrides = {
  allowed: PermissionEntity[],
  denied: PermissionEntity[]
} & Omit<LooseSpecificOverrides, "allowed" | "denied">; // the omit is just in case new properties are added to LooseSpecificOverrides

//

export type LooseSpecificChannelOverrides = {
  allowed: ChannelPermissionGroup,
  denied: ChannelPermissionGroup
}
export type LooseSpecificRoleOverrides = {
  allowed: RolePermissionGroup,
  denied: RolePermissionGroup
}

//

export type LoosePermissions = {
  roles?: BroadOverrides,
  channels?: BroadOverrides
}

export type StrictPermissions = {
  roles: StrictSpecificOverrides,
  channels: StrictSpecificOverrides
}

export function channel(channelName: string): ChannelPermissionEntity {
  return {
    type: "channel",
    name: channelName
  }
}

export function category(categoryName: string): ChannelPermissionEntity {
  return {
    type: "category",
    name: categoryName
  }
}

export function role(roleName: string): RolePermissionEntity {
  return {
    type: "role",
    name: roleName
  }
}

export function everyone(): RolePermissionEntity {
  return {
    type: "role",
    name: "*"
  }
}

export function allChannels(): ChannelPermissionEntity {
  return {
    type: "channel",
    name: "*"
  }
}

export function nobody(): RolePermissionEntity[] {
  return [];
}

export function nowhere(): ChannelPermissionEntity[] {
  return [];
}

export function allChannelsExcept(channels: ChannelPermissionGroup): LooseSpecificChannelOverrides {
  return {
    allowed: allChannels(),
    denied: channels
  };
}

export function everyoneExcept(roles: RolePermissionGroup): LooseSpecificRoleOverrides {
  return {
    allowed: everyone(),
    denied: roles
  }
}

export function onlyTheseChannels(channels: ChannelPermissionGroup): LooseSpecificChannelOverrides {
  return {
    allowed: channels,
    denied: allChannels()
  }
}

export function onlyTheseRoles(roles: RolePermissionGroup): LooseSpecificRoleOverrides {
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
  roles: PermissionGroup,
  enforceInBotsChannel?: boolean
} & Constraint<T>;

export type LooseConstraints = {
  rules: LooseConstraintRule<"all">[],
  enforceRulesInBotsChannel: boolean
}

export type StrictConstraintRule<T extends Scope> = {
  roles: PermissionEntity[],
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

  // details?: CommandDetails; // what's the point of details instead of just putting it in the command itself?

  tags?: string[];
  broadcastable?: boolean;

  execute(interaction: CommandInteraction, broadcast: boolean): Promise<void>;
}
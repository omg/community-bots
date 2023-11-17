import { GuildMember } from "discord.js";
import { Command } from "./Command";
import { Constraint, RateLimit, StrictConstraint } from "./Permissions";

const commandCooldownStart = new Map();
const commandRequestCount = new Map();
const commandRateLimitStart = new Map();

const DEFAULT_CONSTRAINTS: StrictConstraint = {
  cooldown: 0.75,
  rateLimit: {
    window: 180,
    max: 16
  },
  enforceInBotsChannel: false
}

export function getEnforcedConstraint(command: Command, member: GuildMember) {
  // go in order from top to bottom and check if the member has the role
  // if they do, then set the enforced rate limit to that one
  // only override properties that are set
  // if they don't have that role, then keep going
  // if some properties havevn't been set, then use the global one

  let userConstraint: Constraint<"all"> = {};

  function overwriteConstraint(constraint: Constraint<any>) {
    if (constraint.cooldown) userConstraint.cooldown = constraint.cooldown;
    if (constraint.rateLimit) userConstraint.rateLimit = constraint.rateLimit;
    if (constraint.enforceInBotsChannel) userConstraint.enforceInBotsChannel = constraint.enforceInBotsChannel;
  }

  // overwrite with the command's constraints

  overwriteConstraint(command.limits);

  // a cooldown and a rate limit is an enforced --> Constraint <--

  for (const constraintRule of command.constraints.rules) {
    constraintRule.roles.forEach((role) => {
      const name = role.name;

      // check if the member has the role by name
      if (member.roles.cache.some((role) => role.name === name)) {
        overwriteConstraint(constraintRule);
      }
    });
  }

  // create the StrictConstraint
  
  function getDefinedValue<K extends keyof Constraint<"all">>(key: K): Exclude<Constraint<"all">[K], "default" | "local"> {
    const value: Constraint<"all">[K] = userConstraint[key];
    type excludedType = Exclude<Constraint<"all">[K], "default" | "local">;
    return (value === "default" ? DEFAULT_CONSTRAINTS[key] // default - use the default constraint
      : value === "local" ? command.limits[key] // local - use the command's constraint
      : value === undefined ? DEFAULT_CONSTRAINTS[key] // undefined - use the default constraint
      : value) as excludedType; // defined - use the provided value
  }

  return {
    cooldown: getDefinedValue("cooldown"),
    rateLimit: getDefinedValue("rateLimit"),
    enforceInBotsChannel: getDefinedValue("enforceInBotsChannel")
  }
}

export type OnCooldown = { status: "cooldown", until: number }
export type RateLimited = { status: "ratelimited", until: number }
export type Success = { status: "success" }

export type CommandUsageResult = OnCooldown | RateLimited | Success;

export function tryUseCommand(member: GuildMember, command: Command): CommandUsageResult {
  const userID = member.id; // TODO would be better if this command was called with a user ID instead of a member - for the future
  const now = Date.now();
  
  const commandName = command.name;
  const key = userID + commandName;

  const enforcedConstraint = getEnforcedConstraint(command, member);

  const rateLimitStart = commandRateLimitStart.get(key) || now;
  let requestCount = commandRequestCount.get(userID) || 0;

  // check rate limit

  // if the rate limit window has passed, then reset the rate limit
  if (now - rateLimitStart > enforcedConstraint.rateLimit.window * 1000) {
    commandRateLimitStart.set(key, now);
    commandRequestCount.set(key, 0);
    requestCount = 0;
  }

  // if the request count has reached the maximum, then return rate limited
  if (requestCount >= enforcedConstraint.rateLimit.max) {
    return {
      status: "ratelimited",
      until: rateLimitStart + enforcedConstraint.rateLimit.window * 1000
    }
  }

  // TODO: gloal command rate limit

  const cooldownStart = commandCooldownStart.get(userID) || 0;

  // if it's on cooldown, then return on cooldown
  if (now - cooldownStart < enforcedConstraint.cooldown * 1000) {
    return {
      status: "cooldown",
      until: cooldownStart + enforcedConstraint.cooldown * 1000
    }
  }

  // TODO: global command cooldowns

  // add to the request count
  commandRequestCount.set(key, requestCount + 1);
  // commandRequestCount.set(userID, requestCount + 1);

  // set the cooldown
  commandCooldownStart.set(key, now);
  // commandCooldownStart.set(userID, now);

  return { status: "success" }
}
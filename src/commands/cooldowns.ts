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

export function tryUseCommand(userID: string, command: Command): CommandUsageResult {
  const commandName = command.name;
  const key = userID + commandName;

  const requestCount = commandRequestCount.get(userID) || 0;
  commandRequestCount.set(key, requestCount + 1);

  // TODO

  const enforcedRateLimit = getEnforcedRateLimit(command, member);

  // commandCooldownStart.set(key, Date.now());

  // if (commandRateLimitStart + )
  // const rateLimit = command.rateLimits.global;
  // if (rateLimit) setRateLimit(userID, commandName, rateLimit);
}

export function getCooldownStart(userID: string, key = "") {
  return Math.max(
    (commandCooldownStart.get(userID + key) || 0),
    (commandCooldownStart.get(userID) || 0)
  );
}

export function setCooldown(userID: string, key: string, cooldown: number) {
  commandCooldownStart.set(userID, Date.now() + cooldown);
  if (key && cooldown) commandCooldownStart.set(userID + key, Date.now() + cooldown);
}

// export function isOnCooldown(userID: string, key = "") {
//   return getCooldown(userID, key) > 0;
// }
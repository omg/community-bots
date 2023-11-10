import { GuildMember } from "discord.js";
import { Command } from "./Command";
import { RateLimit, everyone } from "./Permissions";

const commandCooldownStart = new Map();
const commandRequestCount = new Map();
const commandRateLimitStart = new Map();

const DEFAULT_RATE_LIMIT: RateLimit = {
  window: 180,
  max: 16
}

export function getEnforcedRateLimit(command: Command, member: GuildMember) {
  // probably go in order from top to bottom and check if the member has the role
  // if they do, then set the enforced rate limit to that one
  // only override properties that are set
  // if they don't have that role, then keep going
  // if some properties havevn't been set, then use the global one
  let enforcedRateLimit: RateLimit = {
    // TODO
  }
  for (const rateLimit of command.rateLimits.limits) {
    rateLimit.roles.forEach((role) => {
      const name = role.name;

      // check if the member has the role by name
      if (member.roles.cache.some((role) => role.name === name)) {
        enforcedRateLimit = rateLimit;
      }
    });
  }
  return enforcedRateLimit;
}

export type OnCooldown = {
  status: "cooldown",
  until: number
}

// ask ai about wanting to make a tryUseCommand function and how i could return something
export type RateLimited = {
  status: "ratelimited",
  until: number
}

export type Success = {
  status: "success"
}

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
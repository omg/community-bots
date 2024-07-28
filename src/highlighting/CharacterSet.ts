import { Client } from "discord.js";

// letters numbers, at, hyphen, space, apostrophe
export interface CharacterMap {
  " ": string;
  "A": string;
  "B": string;
  "C": string;
  "D": string;
  "E": string;
  "F": string;
  "G": string;
  "H": string;
  "I": string;
  "J": string;
  "K": string;
  "L": string;
  "M": string;
  "N": string;
  "O": string;
  "P": string;
  "Q": string;
  "R": string;
  "S": string;
  "T": string;
  "U": string;
  "V": string;
  "W": string;
  "X": string;
  "Y": string;
  "Z": string;
  "0": string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
  "6": string;
  "7": string;
  "8": string;
  "9": string;
  "@": string;
  "-": string;
  "'": string;

  "unknown": string;
}

export interface PresentCharacterMap extends CharacterMap {
  "any": string;
}

export interface CharacterTheme {
  Present: PresentCharacterMap;
  Highlighted: CharacterMap;
  Wildcard: CharacterMap;
}

const emojiRegex = /(?<!\\)(?:\\\\)*<a?:\w+:(\d+)>/g;

/**
 * Gets the set of unusable emojis in a message.
 * 
 * @param client The client to use to check for emojis
 * @param message The message to check for unusable emojis
 * @returns A set of unusable emoji IDs
 */
function getUnusableEmojis(client: Client, message: string): Set<string> {
  return [...message.matchAll(emojiRegex)].reduce((accumulator, match) => {
    const emojiId = match[1];
    const emoji = client.emojis.cache.get(emojiId);
    if (!emoji) accumulator.add(emojiId);
    return accumulator;
  }, new Set<string>());
}

/**
 * Checks if a message contains only sendable emojis.
 * 
 * @param client The client to use to check for emojis
 * @param message The message to check for unusable emojis
 * @returns `true` if the message contains only sendable emojis
 */
function areEmojisInMessageSendable(client: Client, message: string): boolean {
  let match: RegExpExecArray | null;
  while (match = emojiRegex.exec(message)) {
    const emojiId = match[1];
    const emoji = client.emojis.cache.get(emojiId);
    if (!emoji) return false;
  }
  return true;
}

/**
 * Replaces unusable emojis in a message with a replacement string.
 * 
 * @param client The client to use to check for emojis
 * @param message The message to replace unusable emojis in
 * @param replacement The replacement string
 * @returns The message with unusable emojis replaced
 */
function replaceUnusableEmojis(client: Client, message: string, replacement: string) {
  return message.replace(emojiRegex, (match, emojiId) => {
    const emoji = client.emojis.cache.get(emojiId);
    if (!emoji) return replacement;
    return match;
  });
}
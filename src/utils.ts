/**
 * Formats a number by adding commas as thousands separators.
 *
 * @param number The number to format
 * @returns A comma separated number string
 * 
 * @example
 * ```typescript
 * formatNumber(1000) // "1,000"
 * ```
 */
export function formatNumber(number: number): string {
  return number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats a number as a percentage string with one decimal place.
 *
 * @param value A value between 0 and 1
 * @returns A percentage string with one decimal place
 * 
 * @example
 * ```typescript
 * formatPercentage(0.5) // "50.0%"
 * formatPercentage(0.12345) // "12.3%"
 * ```
 */
export function formatPercentage(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

/**
 * Formats a number as a placement string.
 *
 * @param place The place number to format
 * @returns A string with the number and its placement suffix
 * 
 * @example
 * ```typescript
 * formatPlacement(1) // "1st"
 * formatPlacement(205) // "205th"
 * ```
 */
export function formatPlacement(place: number): string {
  let checker = BigInt(place) % BigInt(100);
  if (checker > 10 && checker < 20) return place + "th";
  checker %= BigInt(10);
  if (checker == BigInt(1)) return formatNumber(place) + "st";
  if (checker == BigInt(2)) return formatNumber(place) + "nd";
  if (checker == BigInt(3)) return formatNumber(place) + "rd";
  return formatNumber(place) + "th";
}

/**
 * Creates an English list from an array of items.
 * Items may be separated by commas and an "and" may be placed before the last item.
 *
 * @param items An array of items to be included in the English list.
 * @returns A concatenated string of the items in the array.
 * 
 * @example
 * ```typescript
 * createEnglishList(["a", "b", "c"]) // "a, b, and c"
 * createEnglishList(["a", "b"]) // "a and b"
 * createEnglishList(["a"]) // "a"
 * ```
 */
export function createEnglishList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " and " + items[1];
  let listString = items[0];
  for (let i = 1; i < items.length; i++) listString += (i == items.length - 1 ? ", and " : ", ") + items[i];
  return listString;
}

/**
 * Shuffles the elements of an array randomly.
 * **This will modify the given array in place.**
 *
 * @param array The array to be shuffled
 * @returns The shuffled array, for chaining
 */
export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**
 * Takes a string as input and escapes any characters that can be used as Discord Markdown.
 * Any form of mention or emoji will also be escaped.
 *
 * @param string The string to escape
 */
export function escapeDiscordMarkdown(string: string): string {
  return string
    .replace(/`/g, "'")
    .replace(/[\\_~\*\|:#@><-]/g, "\\$&");
}

/**
 * A collection of sorting functions for strings.
 */
export const SortingFunctions = {
  lengthDescending: (a: string, b: string) => b.length - a.length,
  lengthAscending: (a: string, b: string) => a.length - b.length,
  alphabetical: (a: string, b: string) => a.localeCompare(b),
  lengthThenAlphabetical: (a: string, b: string) => b.length - a.length || a.localeCompare(b),
}
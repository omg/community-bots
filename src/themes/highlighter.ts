import { CharacterMap, CharacterTheme } from "../highlighting/CharacterSet";
import CaffeinatedCharacterTheme from "../highlighting/highlighters/Caffeinated";
import ComicSansCharacterTheme from "../highlighting/highlighters/ComicSans";
import DarkCharacterTheme from "../highlighting/highlighters/Dark";
import DefaultCharacterTheme from "../highlighting/highlighters/Default";
import GreenCharacterTheme from "../highlighting/highlighters/Green";
import LifeboatCharacterTheme from "../highlighting/highlighters/Lifeboat";
import LilacCharacterTheme from "../highlighting/highlighters/Lilac";
import RoseCharacterTheme from "../highlighting/highlighters/Rose";
import TextCharacterTheme from "../highlighting/highlighters/Text";
import ViviCharacterTheme from "../highlighting/highlighters/Vivi";
import { getHighlightedLetters, setHighlightGroups } from "../regex";

export class Highlighter {
  private theme: CharacterTheme;

  constructor(theme: CharacterTheme) {
    this.theme = theme;
  }

  /**
   * Maps a string to a new string using the provided map.
   * 
   * @param string The string to map
   * @param map The map to use when converting the string
   * @returns The mapped string
   */
  private mapText(string: string, map: CharacterMap) {
    return string
      .toUpperCase()
      .split("")
      .map((letter) => {
        return map[letter] ?? map.unknown;
      })
      .join("");
  }

  /**
   * Applies the present highlight to a string.
   * 
   * @param string The string to get the present highlight for
   * @returns The string with the present highlight applied
   */
  getPresent(string: string): string {
    return this.mapText(string, this.theme.Present);
  }

  /**
   * Applies the highlighted highlight to a string.
   * 
   * @param string The string to get the highlighted highlight for
   * @returns The string with the highlighted highlight applied
   */
  getHighlighted(string: string): string {
    return this.mapText(string, this.theme.Highlighted);
  }

  /**
   * Applies the wildcard highlight to a string.
   * 
   * @param string The string to get the wildcard highlight for
   * @returns The string with the wildcard highlight
   */
  getWildcard(string: string): string {
    return this.mapText(string, this.theme.Wildcard);
  }

  /**
   * Converts a string to one with the letters converted into its highlighted form.
   * 
   * @param text A string to convert
   * @param regex A regex to use to highlight the string
   * @returns A string with the letters converted for highlighting
   */
  highlight(text: string, regex: RegExp): string {
    regex = setHighlightGroups(regex);
    const letters = getHighlightedLetters(text, regex);

    let emojiString = "";
    for (let text of letters) {
      switch (text.letterType) {
        case "highlighted":
          emojiString += this.getHighlighted(text.text);
          break;
        case "present":
          emojiString += this.getPresent(text.text);
          break;
        case "wildcard":
        default:
          emojiString += this.getWildcard(text.text);
          break;
      }
    }

    return emojiString;
  }
}

export const Highlighters = {
  // Themes for OMG
  Default: new Highlighter(DefaultCharacterTheme),
  Caffeinated: new Highlighter(CaffeinatedCharacterTheme),
  ComicSans: new Highlighter(ComicSansCharacterTheme),
  Dark: new Highlighter(DarkCharacterTheme),
  Green: new Highlighter(GreenCharacterTheme),
  Lifeboat: new Highlighter(LifeboatCharacterTheme),
  Lilac: new Highlighter(LilacCharacterTheme),
  Rose: new Highlighter(RoseCharacterTheme),

  // Highlighters for installed applications
  Vivi: new Highlighter(ViviCharacterTheme),

  // Highlighters for testing
  Text: new Highlighter(TextCharacterTheme)
}
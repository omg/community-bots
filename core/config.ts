import appRootPath from "app-root-path";
import fs from "fs";

/**
 * The path to the JSON file containing the Community Bots configuration.
 */
const CONFIG_PATH = appRootPath.resolve("config/config.json");

/**
 * The path to the JSON file containing the names of the bots, their client IDs, secrets, and tokens.
 */
const TOKENS_PATH = appRootPath.resolve("config/tokens.json");

// TODO: give it nice types? or should we just not export it and just use functions for everything?
/**
 * The configuration for Community Bots.
 * 
 * **DON'T MODIFY THIS VARIABLE DIRECTLY UNLESS YOU ARE A COMPLETE FUCKING IDIOT**
 */
export const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

/**
 * The token configuration of the bots.
 */
export const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));

/**
 * Writes the current configuration to the JSON file.
 */
function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Writes the current token configuration to the JSON file.
 */
function saveTokens() {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

/**
 * Sets whether or not Community Bots will use singleton mode when it starts up.
 * 
 * This will also save the configuration to the JSON file.
 * 
 * @param enabled Whether or not to enable singleton mode
 */
export function setSingletonEnabled(enabled: boolean) {
  config.singleton = enabled;
  saveConfig();
}

/**
 * Sets the bot to use as the singleton bot if Community Bots is in singleton mode.
 * If this bot name isn't found in the list of bots when Community Bots starts up, it will prompt the user to add it.
 * 
 * This will also save the configuration to the JSON file.
 * 
 * @param bot The identifier of the bot to set as the singleton bot
 */
export function setSingletonBot(bot: string) {
  config.singletonBot = bot;
  saveConfig();
}

/**
 * Sets whether or not a module is enabled.
 * 
 * **NOTE:** If the module's configuration hasn't been set up yet, this won't do anything.
 * 
 * This will also save the configuration to the JSON file.
 * 
 * @param module The module to enable or disable
 * @param enabled Whether or not to enable the module
 */
export function setModuleEnabled(module: string, enabled: boolean) {
  // TODO: check if the module is set up
  config.modules[module] = enabled;
  saveConfig();
}

/**
 * Sets the bot to use for a module.
 * 
 * **NOTE:** If the module's configuration hasn't been set up yet, this won't do anything.
 * 
 * This will also save the configuration to the JSON file.
 * 
 * @param module The module to set the bot for
 * @param bot The identifier of the bot to set as the module's bot
 */
export function setModuleBot(module: string, bot: string) {
  config.moduleBots[module] = bot;
  saveConfig();
}

type ModuleConfig = {
  bot: string,
  enabled: boolean
}

/**
 * Sets a module's configuration, overwriting it if it already exists.
 * 
 * @param module The module to set the configuration for
 * @param moduleConfig The configuration to set for the module
 */
export function configureModule(module: string, moduleConfig: ModuleConfig) {
  config.modules[module] = moduleConfig;
  saveConfig();
}

/**
 * Adds a bot to the list of bots that Community Bots can use, overwriting it if it already exists.
 * 
 * @param bot The bot's name
 * @param id The client ID of the bot
 * @param token The token of the bot
 * @param secret The secret of the bot
 * @param oauth The access token of the bot
 */
export function addBot(bot: string, id: string, token: string, secret: string, accessToken: any) {
  tokens[bot] = { id, token, secret, accessToken };
  saveTokens();
}

/**
 * Removes a bot from the list of bots that Community Bots can use.
 * 
 * @param bot The bot to remove
 */
export function removeBot(bot: string) {
  delete tokens[bot];
  saveTokens();
}
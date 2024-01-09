import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { escapeDiscordMarkdown, formatNumber } from "../../src/utils";
import { replyToInteraction } from "../../src/command-handler";
import { setCashName } from "../../src/database/db";

export const data = new SlashCommandBuilder()
  .setName("namecurrency")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("before")
      .setDescription("Add text before the number")
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("The text to add - no spaces, must end with a symbol like $")
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(6)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("after")
      .setDescription("Add text after the number")
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("The text to add - two words max")
          .setRequired(true)
      )
  );

export const cooldown = 8 * 1000;
export const type = ["fun"];

const CURRENCY_SYMBOLS = "$£€¥₩₽₴₹₱₿¢#";

const FAILING_REGEX = new RegExp(`[^A-Z ${CURRENCY_SYMBOLS}\-\?]`, "gi");

export async function execute(interaction: ChatInputCommandInteraction, _preferBroadcast: boolean) {
  let subcommand = interaction.options.getSubcommand();
  let text = interaction.options.getString("text") as string;
  let appearsBeforeAmount = subcommand === "before";

  // remove leading and trailing spaces
  text = text.trim();
  // remove double spaces
  text = text.replace(/\s\s+/g, " ");
  // remove double dashes
  text = text.replace(/\-\-/g, "-");

  // enforce proper capitalization
  // in every single word of the text, there must be an uppercase letter anywhere
  let words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    let hasUppercase = false;
    for (let j = 0; j < word.length; j++) {
      if (word[j] === word[j].toUpperCase()) {
        hasUppercase = true;
        break;
      }
    }
    if (!hasUppercase) {
      words[i] = word[0].toUpperCase() + word.slice(1);
    }
  }
  text = words.join(" ");

  // replace invalid characters with nothing
  text = text.replace(FAILING_REGEX, "");

  // if the text is empty, reply with an error
  if (text.length === 0) {
    await replyToInteraction(
      interaction,
      "Name Currency",
      "\n• Invalid name.",
      false
    );
    return;
  }

  if (appearsBeforeAmount) {
    // add a space at the end if it doesn't end with a symbol
    if (!CURRENCY_SYMBOLS.includes(text.slice(-1))) {
      text += " ";
    }
  } else {
    // add a space at the beginning if it doesn't start with a symbol
    if (!CURRENCY_SYMBOLS.includes(text[0])) {
      text = " " + text;
    }
  }

  // set the currency name
  await setCashName(interaction.user.id, text, appearsBeforeAmount);

  // generate an example
  let example = (appearsBeforeAmount ? text : "") + formatNumber(5) + (appearsBeforeAmount ? "" : text);

  replyToInteraction(
    interaction,
    "Name Currency",
    "\n• Set your currency name: " + escapeDiscordMarkdown(example),
    false
  );
}
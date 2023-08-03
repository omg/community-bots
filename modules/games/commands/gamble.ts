import { SlashCommandBuilder } from "discord.js";
import { replyToInteraction } from "../../../src/command-handler";
import { escapeDiscordMarkdown, formatNumber } from "../../../src/utils";
import { getCash, spendCash } from "../../../src/database/db";

export var cooldown: 4000; // originally 4 * 1000, but we cant export it like that
export var type: ["fun", "annoying"];

export const data = new SlashCommandBuilder()
  .setName("gamble")
  .setDescription("Gamble cash!")
  .addIntegerOption((option) =>
    option
      .setName("cash")
      .setDescription("The amount of cash to gamble!")
      .setMaxValue(50000)
      .setMinValue(1)
      .setRequired(true)
  );

// type hinting interaction becomes a issue because of typescript..
// just look at the docs, or ill find something better later
export async function execute(
  interaction,
  preferBroadcast: boolean
): Promise<void> {
  let cash = interaction.options.get("cash").value;

  let userCash = await getCash(interaction.user.id);
  if (userCash < cash) {
    await replyToInteraction(
      interaction,
      "Gamble",
      "\n• You don't have enough cash for that. You have " +
        formatNumber(userCash) +
        " cash.",
      false
    );
    return;
  }
  await spendCash(interaction.user.id, cash);

  let max = 87;
  let rolled = Math.floor(Math.random() * max) + 1;

  await interaction.reply({
    content:
      "<@" +
      interaction.user.id +
      "> is gambling **" +
      formatNumber(cash) +
      " cash**!",
  });

  setTimeout(async () => {
    await interaction.editReply({
      content: "https://omg.games/assets/rolling.gif",
    });

    setTimeout(async () => {
      // edit the reply with @user rolls X/max
      await interaction.editReply({
        content:
          "<@" +
          interaction.user.id +
          "> rolls **" +
          formatNumber(rolled) +
          "/100**.\nYou need to roll 88 or higher! You lose **" +
          formatNumber(cash) +
          " cash**!",
      });
    }, 1200);
  }, 3000);
}

// let limits = [];
// limits[0] = {
//   max: 1,
//   interval: 1 * 20 * 1000,
//   includeBotsChannel: true
// }
// limits[1] = {
//   max: 4,
//   interval: 5 * 60 * 1000,
//   includeBotsChannel: false
// }
// limits[2] = {
//   max: 20,
//   interval: 20 * 60 * 1000,
//   includeBotsChannel: false
// }

// export the command

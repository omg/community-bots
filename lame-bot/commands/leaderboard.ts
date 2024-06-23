import {
  CommandInteraction,
  Guild,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { getLeaderboard, getLeaderboardSection } from "../../src/database/db";
import { getCleanName, formatNumber } from "../../src/utils";
import { getGuild } from "../src/client";
import leaderboardEmojis from "../../assets/emoji-maps/leaderboardEmojis";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View the Word Bomb Mini leaderboard!")
  .addIntegerOption((option) =>
    option
      .setName("page")
      // no page should be treated as the users page but whats a good way to convey that?
      .setDescription(
        "The page of the leaderboard to view (default is Your Page)"
      )
      // leaderboard is ever changing so we cant know a exact value
      // should default to last page if index is out of bounds
      .setMaxValue(9999)
      .setMinValue(1)
      .setRequired(false)
  );

// TODO: Figure out the cooldown stuff... overscores can do that!
export const cooldown = 5 * 1000;
// export const limits = [];

// export const type = [];

// should probably only be used in bot channels, in which case u can just always broadcast it
export const broadcastable = false;

// Omg discord server :D
// const GUILDID = "476593983485902850";
const GUILDID = "733744302756200501";

async function getDisplayName(userID: string) {
  return (await await getGuild(GUILDID)).members
    .fetch(userID)
    .then((member: GuildMember) => {
      return getCleanName(member.displayName ?? member.user.displayName);
    })
    .catch(() => {
      return "Lame Guest";
    });
}

async function buildLeaderboardMessage(lbpage, startnum, cmdUserid) {
  let message = "### <:d:708743544877088808> All-Time Score";
  let names = await Promise.all(
    lbpage.map(async (page) => {
      return await getDisplayName(page.user);
    })
  );

  for (let i = 0; i < lbpage.length; i++) {
    let user = lbpage[i];
    let name = names[i];
    let placement = startnum + i;
    // Lol

    if (cmdUserid === user.user) {
      name = `<@${cmdUserid}>`;
    }

    if (placement <= 10) {
      message += `\n${leaderboardEmojis[placement]}  ${name} • **${formatNumber(
        user.score
      )} points**`;
    } else {
      message += `\n${placement}. ${name} • **${formatNumber(
        user.score
      )} points**`;
    }
  }

  return message;
}

export async function execute(
  interaction: CommandInteraction,
  preferBroadcast: boolean
) {
  let page = interaction.options.get("page");
  let message;
  let leaderboard = await getLeaderboard(null);

  if (!page) {
    let user = interaction.user.id;
    // im hoping this isnt Mega Slow but honestly its probably fine
    let userIndex = leaderboard.findIndex((page) => page.user === user);

    // Rust would make this So Much Cooler
    if (userIndex === -1) {
      message = await buildLeaderboardMessage(
        leaderboard.slice(0, 10),
        1,
        interaction.user.id
      );
      return;
    } else {
      let startnum = userIndex - 5;
      if (userIndex + 1 >= leaderboard.length - 10) {
        startnum = leaderboard.length - 10;
      }

      // Old code for showing the full Page the user is on
      // pagenum = Math.floor(userIndex / 10) + 1;
      // message = await buildLeaderboardMessage(leaderboard.slice((pagenum - 1) * 10, pagenum * 10), (pagenum - 1) * 10)

      // show the placement of the user, but keep them in the middle of the page
      // (its 10 so it cant be exactly in the middle, overscores said this works fine)
      message = await buildLeaderboardMessage(
        leaderboard.slice(startnum, startnum + 10),
        startnum + 1,
        interaction.user.id
      );
    }
  } else {
    let pagenum: number = page.value as number;
    let totalNumOfPages = Math.ceil(leaderboard.length / 10);
    let startnum;

    if (pagenum >= totalNumOfPages) {
      let itemsOnLastPage = leaderboard.length % 10;
      let itemsNeeded = 10 - itemsOnLastPage;
      startnum = Math.max(
        leaderboard.length - itemsOnLastPage - itemsNeeded,
        0
      );
    } else {
      startnum = (pagenum - 1) * 10;
    }

    let endnum = Math.min(startnum + 10, leaderboard.length);
    message = await buildLeaderboardMessage(
      leaderboard.slice(startnum, endnum),
      startnum + 1,
      interaction.user.id
    );
  }

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

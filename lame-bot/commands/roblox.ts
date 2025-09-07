import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { editInteractionReply } from "../../src/command-handler";
import { escapeDiscordMarkdown } from "../../src/utils";

export const data = new SlashCommandBuilder()
  .setName("roblox")
  .setDescription("View a user's Roblox profile!")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to view the profile of")
      .setRequired(false)
  );

export const cooldown = 10 * 1000;
export const broadcastable = true;

export async function execute(
  interaction: ChatInputCommandInteraction,
  preferBroadcast: boolean
) {
  await interaction.deferReply({ ephemeral: !preferBroadcast });
  const userID = interaction.options.getUser("user")?.id ?? interaction.user.id;

  try {
    const bloxlinkResponse = await fetch(
      `https://api.blox.link/v4/public/guilds/476593983485902850/discord-to-roblox/${userID}`,
      { headers: { Authorization: process.env.BLOXLINK_KEY } }
    );
    const bloxlinkData = await bloxlinkResponse.json();

    if (bloxlinkData.error) {
      const errorMessage = bloxlinkData.error.endsWith(".")
        ? bloxlinkData.error
        : bloxlinkData.error + ".";
      await editInteractionReply(
        interaction,
        "Profile",
        "\n• " + escapeDiscordMarkdown(errorMessage),
        false
      );
      return;
    }

    const robloxID: number | undefined = bloxlinkData.robloxID;
    if (!robloxID) {
      await editInteractionReply(
        interaction,
        "Profile",
        "\n• That user does not have a Roblox account connected.",
        false
      );
      return;
    }

    const robloxUserFetch = fetch(
      `https://users.roblox.com/v1/users/${robloxID}`
    );
    const robloxThumbnailFetch = fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&format=Png&size=100x100`
    );

    const [robloxUserResponse, robloxThumbnailResponse] = await Promise.all([
      robloxUserFetch,
      robloxThumbnailFetch,
    ]);
    const [robloxUserData, robloxThumbnailData] = await Promise.all([
      robloxUserResponse.json(),
      robloxThumbnailResponse.json(),
    ]);

    if (robloxUserData.errors || robloxThumbnailData.errors) {
      await editInteractionReply(
        interaction,
        "Profile",
        "\n• That user's Roblox account was connected but could not be retrieved.",
        false
      );
      return;
    }

    const robloxName: string =
      robloxUserData.displayName ?? robloxUserData.name;
    const robloxUsername: string = robloxUserData.name;
    const robloxLink = `https://www.roblox.com/users/${robloxID}/profile`;
    const robloxDescription: string = escapeDiscordMarkdown(
      robloxUserData.description ?? ""
    );

    const robloxImage: string | undefined =
      robloxThumbnailData?.data?.[0]?.imageUrl;

    const text = `<@${userID}> is **${robloxName}** on Roblox.`;
    const embed = new EmbedBuilder()
      .setAuthor({ name: "@" + robloxUsername })
      .setTitle(robloxName)
      .setURL(robloxLink)
      .setDescription(robloxDescription)
      .setThumbnail(robloxImage)
      .setColor("#00a8ff");

    await editInteractionReply(
      interaction,
      "Profile",
      "\n" + text + "\n** **",
      false,
      {
        allowedMentions: { parse: [] },
        embeds: [embed],
      }
    );
  } catch (error) {
    console.error(error);
    await editInteractionReply(
      interaction,
      "Profile",
      "\n• An error occurred while fetching the profile.",
      false
    );
  }
}

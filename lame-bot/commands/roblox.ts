import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { replyToInteraction } from "../../src/command-handler";
import { escapeDiscordMarkdown } from "../../src/utils";

export const data = new SlashCommandBuilder()
  .setName("roblox")
  .setDescription("Various Roblox-related commands!")
  .addSubcommand(subcommand => 
    subcommand.setName("verify")
      .setDescription("Verify your Roblox account with Bloxlink!"))
  .addSubcommand(subcommand =>
    subcommand.setName("profile")
      .setDescription("View a member's Roblox profile!")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("The user to view the profile of")
          .setRequired(false)));

export const cooldown = 2 * 1000;
export const broadcastable = true;

export async function execute(interaction: ChatInputCommandInteraction, preferBroadcast: boolean) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "verify") {
    await replyToInteraction(interaction, "Verify", "\n• Connect your Roblox account to Discord using Bloxlink [using this link](https://blox.link/dashboard/user/verifications/verify).", preferBroadcast);
  } else if (subcommand === "profile") {
    const userID = interaction.options.getUser("user")?.id ?? interaction.user.id;
    try {
      const result = await fetch("https://api.blox.link/v4/public/guilds/789699000047370261/discord-to-roblox/" + userID, { headers: { "Authorization": process.env.BLOXLINK_KEY } });
      const data = await result.json();
      if (data.error) {
        const errorMessage = data.error.endsWith(".") ? data.error : data.error + ".";
        await replyToInteraction(interaction, "Profile", "\n• " + escapeDiscordMarkdown(errorMessage), preferBroadcast);
        return;
      }

      const robloxInformation = data.resolved.roblox;
      console.log(robloxInformation);

      const robloxName = robloxInformation.display_name ?? robloxInformation.username;
      const robloxID = robloxInformation.id;
      const robloxDescription = robloxInformation.description;
      const robloxImage = robloxInformation.avatar_url;

      const text = `<@${userID}> is **${robloxName}** on Roblox.`;
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Roblox" })
        .setTitle(robloxName)
        .setURL(`https://www.roblox.com/users/${robloxID}/profile`)
        .setDescription(robloxDescription)
        .setThumbnail(robloxImage)
        .setColor("#00b0f4");
      
      await replyToInteraction(interaction, "Profile", "\n• " + text, preferBroadcast, {
        allowedMentions: { parse: [] },
        embeds: [embed]
      });
    } catch (error) {
      console.error(error);
      await replyToInteraction(interaction, "Profile", "\n• An error occurred while fetching the profile.", false);
    }
  }
}
import { CommandInteraction, SlashCommandBuilder, AttachmentBuilder, GuildMemberRoleManager, Role } from 'discord.js';
import sharp from 'sharp';
import { replyToInteraction, getInteractionContent } from '../../src/command-handler';
import { getProfile } from '../../src/database/db';

export const data = new SlashCommandBuilder()
  .setName("setboosterbadge")
  .setDescription("Set a booster badge for yourself")
  .addAttachmentOption(option => 
    option.setName("icon")
      .setDescription("The icon to use")
      .setRequired(true));
  // .addUserOption(option => 
  //   option.setName("user")
  //   .setDescription("The user to set the badge for (owner only)")
  //   .setRequired(false))

export const broadcastable = false;

const boosterPositionRole = "1183524878855458926";
const boosterRole = "638907551215255553";

const validateUserName = (name: string, _id?: string) => {
  let validated = "";
  // . and _ are the only special characters allowed in usernames, they look ugly
  // and the likelyhood we'll have a name collision is low enough that we can get away with this
  validated = name.replace(/[\.\_]/g, "");
  
  if (name.endsWith("s")) {
    validated += "'";
  }

  return validated
}

const isBooster = (rolelist: GuildMemberRoleManager): boolean => {
  return rolelist.premiumSubscriberRole?.id === boosterRole;
}

export async function execute(interaction: CommandInteraction, _preferBroadcast: boolean) {
  let icon = interaction.options.get("icon", true).attachment;
  let userRoles = interaction.member.roles as GuildMemberRoleManager;
  
  // verbose errors D:
  if (interaction.guild.premiumTier < 2) {
    // this is mainly to prevent people from using this while the server doesnt have
    // the correct boost level and casuing a ton of errors
    replyToInteraction(interaction, "Error", "You must be in a server with level 2 or higher boost level to use this command", false);
    return;
  }

  if (!isBooster(userRoles)) {
    replyToInteraction(interaction, "Error", "You must be a booster to use this command", false);
    return;
  }

  let profile = await getProfile(interaction.user.id);

  let iconBuf = await (await fetch(icon.proxyURL).then(res => res.blob())).arrayBuffer();
  let iconResized = await sharp(iconBuf).resize({ width: 64, height: 64, fit: "outside" }).png().toBuffer();
  
  let roles = interaction.guild.roles;
  let rolePos = roles.cache.get(boosterPositionRole).position;

  let userBoosterRole: Role;
  if (!profile.boosterRole) {
    // TRY CATCH :HAHAHAHA:
    try {
      userBoosterRole = await interaction.guild.roles.create({
        name: validateUserName(interaction.user.username) + " booster icon 2",
        position: rolePos + 1,
        icon: iconResized,
      })

      await userRoles.add(userBoosterRole);
    } catch (e) {
      replyToInteraction(interaction, "Error", `Failed to create role: ${e}`, false);
    }
  } else {
    // tbh if this edit fails we can just cope and move on
    userBoosterRole = roles.cache.get(profile.boosterRole);
    await userBoosterRole.edit({
      icon: iconResized
    })
  }

  if (!userRoles.cache.has(userBoosterRole.id)) {
    try {
      await userRoles.add(userBoosterRole);
    } catch (e) {
      replyToInteraction(interaction, "Error", `Failed to add role: ${e}`, false);
    }
  }

  replyToInteraction(interaction, "Success", "Updated role!", false);
}
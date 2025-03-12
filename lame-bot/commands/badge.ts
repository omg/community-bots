import {
  ChatInputCommandInteraction,
  GuildMemberRoleManager,
  Role,
  SlashCommandBuilder,
} from "discord.js";
import sharp from "sharp";
import { replyToInteraction } from "../../src/command-handler";
import { getProfile, setBoosterRole } from "../../src/database/db";
import {
  assignRole,
  createBoosterRole,
  editRole,
  renameRole,
  setRoleIcon,
} from "../../src/sleuth";
import { getCleanRoleName } from "../../src/utils";

export const data = new SlashCommandBuilder()
  .setName("badge")
  .setDescription("Various badge-related commands for boosters!")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set")
      .setDescription("Set a booster badge for yourself!")
      .addAttachmentOption((option) =>
        option
          .setName("icon")
          .setDescription("The icon to use")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The name to use")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(24)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("rename")
      .setDescription("Rename your booster badge!")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The new name to use")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(24)
      )
  );

export const broadcastable = false;

export const cooldown = 60 * 1000;

const boosterPositionRole = "1183517686232268904";
const boosterEndRole = "1267109693252309134";

const validateUserName = (name: string, _id?: string) => {
  let validated = "";
  // . and _ are the only special characters allowed in usernames, they look ugly
  // and the likelyhood we'll have a name collision is low enough that we can get away with this
  validated = name.replace(/[\.\_]/g, "");

  validated += name.endsWith("s") ? "'" : "'s";

  return validated;
};

const isBooster = (rolelist: GuildMemberRoleManager): boolean => {
  return !!rolelist.premiumSubscriberRole;
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  _preferBroadcast: boolean
) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "rename") {
    let name = interaction.options.get("name", true).value as string;
    let userRoles = interaction.member.roles as GuildMemberRoleManager;

    if (!isBooster(userRoles)) {
      await replyToInteraction(
        interaction,
        "Error",
        "\nYou must be a booster to use this command.",
        false
      );
      return true;
    }

    let profile = await getProfile(interaction.user.id);
    profile.boosterRole = profile.boosterRole || "";

    if (!profile.boosterRole) {
      await replyToInteraction(
        interaction,
        "Error",
        "\nYou must set a booster badge first.",
        false
      );
      return true;
    }

    let roles = interaction.guild.roles;
    let rolePos = roles.cache.get(boosterPositionRole).position;
    let endRolePos = roles.cache.get(boosterEndRole).position;
    let userBoosterRole = roles.cache.get(profile.boosterRole);

    const higherPosition = Math.max(rolePos, endRolePos);
    const lowerPosition = Math.min(rolePos, endRolePos);

    if (!userBoosterRole) {
      await replyToInteraction(
        interaction,
        "Error",
        "\nYour booster badge seems to be missing, please set it again.",
        false
      );
      return true;
    }

    const newName = getCleanRoleName(name);
    if (!newName) {
      await replyToInteraction(
        interaction,
        "Error",
        "\nPlease provide a valid name for your badge.",
        false
      );
      return true;
    }

    try {
      // check if other roles have this name (not including any booster roles)
      let existingRole = roles.cache.find((role) => {
        return (
          role.name.toLowerCase() == newName.toLowerCase() &&
          (role.position <= lowerPosition || role.position >= higherPosition)
        );
      });
      if (existingRole) {
        await replyToInteraction(
          interaction,
          "Error",
          `\nA role with that name already exists.`,
          false
        );
        return true;
      }
      await renameRole(userBoosterRole.id, newName);
    } catch (e) {
      console.error(e);
      await replyToInteraction(
        interaction,
        "Error",
        `\nFailed to name your role!`,
        false
      );
      return true;
    }

    await replyToInteraction(
      interaction,
      "Booster Badge",
      "\nSuccessfully named your booster badge!",
      false
    );
  } else if (subcommand === "set") {
    let icon = interaction.options.get("icon", true).attachment;
    let name = interaction.options.get("name", true).value as string;
    let userRoles = interaction.member.roles as GuildMemberRoleManager;

    // verbose errors D:
    if (interaction.guild.premiumTier < 2) {
      // this is mainly to prevent people from using this while the server doesnt have
      // the correct boost level and casuing a ton of errors
      await replyToInteraction(
        interaction,
        "Error",
        "\nYou can't use booster roles yet, the server must be at least level 2!",
        false
      );
      return true;
    }

    if (!isBooster(userRoles)) {
      await replyToInteraction(
        interaction,
        "Error",
        "\nYou must be a booster to use this command.",
        false
      );
      return true;
    }

    let profile = await getProfile(interaction.user.id);
    profile.boosterRole = profile.boosterRole || "";

    switch (icon.contentType) {
      case "image/png":
      case "image/jpeg":
      case "image/webp":
        break;
      default:
        await replyToInteraction(
          interaction,
          "Error",
          "\nPlease use a valid image type.",
          false
        );
        return true;
    }

    let iconBuf = await (
      await fetch(icon.proxyURL).then((res) => res.blob())
    ).arrayBuffer();
    let iconResized = await sharp(iconBuf)
      .resize({ width: 64, height: 64, fit: "outside" })
      .png()
      .toBuffer();

    let roles = interaction.guild.roles;
    let rolePos = roles.cache.get(boosterPositionRole).position;

    let userBoosterRole: Role;
    let roleFound = false;

    // from naming

    let endRolePos = roles.cache.get(boosterEndRole).position;

    const higherPosition = Math.max(rolePos, endRolePos);
    const lowerPosition = Math.min(rolePos, endRolePos);

    const providedName = name !== undefined;
    let newName: string;
    if (providedName) {
      newName = getCleanRoleName(name);

      if (!newName) {
        await replyToInteraction(
          interaction,
          "Error",
          "\nPlease provide a valid name for your badge.",
          false
        );
        return true;
      }

      try {
        // check if other roles have this name (not including any booster roles)
        let existingRole = roles.cache.find((role) => {
          return (
            role.name.toLowerCase() == newName.toLowerCase() &&
            (role.position <= lowerPosition || role.position >= higherPosition)
          );
        });
        if (existingRole) {
          await replyToInteraction(
            interaction,
            "Error",
            `\nA role with that name already exists.`,
            false
          );
          return true;
        }
      } catch (e) {
        console.error(e);
        await replyToInteraction(
          interaction,
          "Error",
          `\nFailed to create your role!\nTry again later.`,
          false
        );
        return true;
      }
    } else {
      newName = validateUserName(interaction.user.username) + " booster icon";
    }

    //

    if (profile.boosterRole) {
      userBoosterRole = roles.cache.get(profile.boosterRole);

      if (userBoosterRole) {
        // tbh if this edit fails we can just cope and move on
        if (providedName) {
          editRole(userBoosterRole.id, iconResized, newName);
        } else {
          setRoleIcon(userBoosterRole.id, iconResized);
        }

        roleFound = true;
      }

      // if the role is missing, we'll need to create a new one
    }

    if (!roleFound) {
      // TRY CATCH :HAHAHAHA:
      try {
        userBoosterRole = await createBoosterRole(
          newName,
          rolePos + 1,
          iconResized,
          interaction.user.id
        );

        setBoosterRole(interaction.user.id, userBoosterRole.id);
      } catch (e) {
        console.error(e);
        await replyToInteraction(
          interaction,
          "Error",
          `\nFailed to create your role!\nTry again later.`,
          false
        );
        return true;
      }
    }

    if (!userRoles.cache.has(userBoosterRole.id)) {
      try {
        await assignRole(interaction.user.id, userBoosterRole.id);
      } catch (e) {
        console.error(e);
        await replyToInteraction(
          interaction,
          "Error",
          `\nFailed to add you to the role!\nTry again later.`,
          false
        );
        return true;
      }
    }

    await replyToInteraction(
      interaction,
      "Booster Badge",
      "\nSuccessfully set your booster badge!",
      false
    );
  }
}

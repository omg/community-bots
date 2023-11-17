import { ApplicationCommandPermissionType, ChannelType, Client, Collection, CommandInteraction, Events, GuildMember, GuildTextBasedChannel, Message, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import fs from "node:fs";
import { Command } from "./commands/Command";
import { ChannelTypes, PermissionEntity, RoleTypes, SlashCommandFileData } from "./commands/Permissions";
import { tryUseCommand } from "./commands/cooldowns";
import { escapeDiscordMarkdown } from "./utils";
import { apiAllChannels, apiChannel, apiEveryone, apiRoleFromName, getChannelIDsByChannelName, getChannelIDsInCategoryName } from "./APIPermissions";
import { create } from "node:domain";

const BROADCAST_COMMAND = {
  name: "shout",
  description: "Broadcast a command!",
};

function commandJSONToOptionJSON(command: any) {
  return { type: 1, ...command };
}

//

export function registerClientAsCommandHandler(client: Client, commandFolder: string, clientID: string, token: string) {
  const commands: Collection<string, Command> = new Collection();
  
  const commandFiles = fs
    .readdirSync(commandFolder)
    .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

  const RESTApplicationCommands = [];
  const broadcastCommand = {
    ...BROADCAST_COMMAND,
    options: [],
  };

  for (const file of commandFiles) {
    const command: SlashCommandFileData = require(`${commandFolder}/${file}`)?.command;
    if (!command || !command.builder || !command.execute) continue;
    
    const createdCommand = new Command(command);
    const commandJSON = command.builder.toJSON();
    const commandName = commandJSON.name;

    commands.set(commandName, createdCommand);
    RESTApplicationCommands.push(commandJSON);

    if (createdCommand.broadcastable) {
      broadcastCommand.options.push(commandJSONToOptionJSON(commandJSON));
    }
  }

  // Only push the broadcast command if there are options to broadcast
  if (broadcastCommand.options.length > 0) RESTApplicationCommands.push(broadcastCommand);

  // TODO: mention commands - replace with "action" commands
  // for (const file of mentionCommandFiles) {
  //   const command = require(`${commandFolder}/mentions/${file}`);
  //   // check if matches and execute are defined in command
  //   if (command.matches && command.execute) {
  //     mentionCommands.set(command.NAME_DUMB, command);
  //   }
  // }

  // TODO needs to be error handled
  const rest = new REST({ version: "10" }).setToken(token);
  (async () => {
    await rest.put(
      Routes.applicationGuildCommands(clientID, process.env.GUILD_ID),
      { body: RESTApplicationCommands }
    );
  })();

  client.once("ready", async () => {
    const guildID = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildID);
    const guildCommands = await guild.commands.fetch();
  
    // iterate through all commands in the commands map
    for (const [_, command] of commands) {
      // get the command ID from the command map
      const name = command.name;
  
      // get the command from the API
      const applicationCommandID = guildCommands.find(cmd => cmd.name === name)?.id;
  
      const permissions = [];

      // at some point the "*" name should be replaced with a "global" type instead of a name
      function createRolePermissions(roles: PermissionEntity<RoleTypes>[], permission: boolean) {
        for (const role of roles) {
          if (role.type === "global") {
            permissions.push(apiEveryone(permission));
          } else {
            permissions.push(apiRoleFromName(client, role.name, permission));
          }
        }
      }

      function createChannelPermissions(channels: PermissionEntity<ChannelTypes>[], permission: boolean) {
        for (const channel of channels) {
          if (channel.type === "global") {
            permissions.push(apiAllChannels(permission));
          } else if (channel.type === "category") {
            getChannelIDsInCategoryName(client, channel.name).forEach(channelID => {
              permissions.push(apiChannel(channelID, permission));
            });
          } else {
            getChannelIDsByChannelName(client, channel.name).forEach(channelID => {
              permissions.push(apiChannel(channelID, permission));
            });
          }
        }
      }

      createRolePermissions(command.permissions.roles.allowed, true);
      createRolePermissions(command.permissions.roles.denied, false);
      createChannelPermissions(command.permissions.channels.allowed, true);
      createChannelPermissions(command.permissions.channels.denied, false);

      if (!applicationCommandID) console.error("Command ID not found for " + name);

      console.log(permissions);

      await guild.commands.permissions.set({
        command: applicationCommandID,
        permissions,
        token
      });
    
      console.log("Permissions set for " + name);
    }
  });

  // old mention command handling

  // client.on(Events.MessageCreate, async (message) => {
  //   if (!message.member) return;
  //   if (message.author.bot) return;
  //   if (!message.guild) return;
  //   if (message.channel.type !== ChannelType.GuildText) return;
    
  //   // check if it mentions the bot
  //   if (!message.mentions.has(client.user.id)) return;

  //   let member = message.member as GuildMember;
  //   let channel = message.channel as GuildTextBasedChannel;

  //   // replace the mention with nothing and trim the message, removing double spaces too
  //   let text = escapeDiscordMarkdown(message.content.replace("<@" + client.user.id + ">", "").replace(/ +/g, " ").trim());
  //   console.log(text);
    
  //   for (const [, command] of mentionCommands) {
  //     console.log(command.NAME_DUMB);
  //     if (command.matches(text)) {
  //       console.log(command.NAME_DUMB);
  //       if (isCommandLimited(member, command, command.NAME_DUMB, channel)) return;
  //       if (isOnCooldown(member.id, command.NAME_DUMB)) return;
  //       if (isOnCooldown(member.id)) return;
        
  //       setOnCooldown(message.member.id, command.NAME_DUMB, command.cooldown);
  //       addLimits(message.member, command, command.NAME_DUMB, message.channel);

  //       try {
  //         await command.execute(message, text);
  //       } catch (error) {
  //         console.error(error);
  //       }
  //       return;
  //     }
  //   }
  // });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member as GuildMember;
    
    let commandToExecuteName = interaction.commandName;
    let broadcast = isBroadcastChannel(interaction.channel);
    
    if (interaction.commandName === BROADCAST_COMMAND.name) {
      commandToExecuteName = interaction.options.getSubcommand();
      broadcast = true;
    }

    const command = commands.get(commandToExecuteName);
    if (!command) return;

    const result = tryUseCommand(member, command);

    // rate limit and cooldown handling

    if (result.status === "ratelimited" || result.status === "cooldown") {
      const timeRemaining = result.until - Date.now();
      const header = result.status === "ratelimited" ? "Limit" : "Cooldown";

      // don't send an auto-updating message if the command has a short cooldown
      if (result.status === "cooldown" && result.constraint.cooldown < 2.75) {
        replyToInteraction(
          interaction,
          header,
          "\n• Hold on! You're sending commands too quickly!",
          false
        );
        return;
      }
      
      // don't send an auto-updating message if the time remaining is less than 2 seconds
      if (timeRemaining < 2000) {
        replyToInteraction(
          interaction,
          header,
          "\n• Wait just a moment and try again!",
          false
        );
        return;
      }

      try {
        replyToInteraction(
          interaction,
          header,
          "\n• You've used this command too much! You can use it again <t:" + Math.ceil(result.until / 1000) + ":R>.",
          false
        );

        if (timeRemaining < 20 * 1000) {
          setTimeout(() => {
            editInteractionReply(
              interaction,
              header,
              "\n• You can now use the command.",
              false
            )
          }, timeRemaining);
        }
      } catch (error) {
        console.error(error);
      }

      return;
    }
    
    if (result.status === "success") {
      try {
        await command.execute(interaction, broadcast);
      } catch (error) {
        console.error(error);
        await replyToInteraction(
          interaction,
          "Error",
          "\n- Sorry, an error occurred while running that command.",
          broadcast
        );
      }
    }
  });

  client.login(token);
}

function isBroadcastChannel(channel: GuildTextBasedChannel) {
  return channel.name == "lame-bots";
}

function getInteractionContent(interaction: CommandInteraction, header: string, response: string, broadcast: boolean) {
  return "**" + header + " *｡✲ﾟ ——**" +
  (broadcast ? "\n\n<@" + interaction.user.id + ">" : "") +
  "\n" + response;
}

export async function replyToInteraction(interaction: CommandInteraction, header: string, response: string, broadcast: boolean) {
  await interaction.reply({
    content: getInteractionContent(interaction, header, response, broadcast),
    ephemeral: !broadcast,
  });
}

export async function editInteractionReply(interaction: CommandInteraction, header: string, response: string, broadcast: boolean) {
  await interaction.editReply({
    content: getInteractionContent(interaction, header, response, broadcast),
  });
}
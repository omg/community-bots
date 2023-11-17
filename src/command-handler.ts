import { ChannelType, Client, Collection, CommandInteraction, Events, GuildMember, GuildTextBasedChannel, Message, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import fs from "node:fs";
import { Command } from "./commands/Command";
import { SlashCommandFileData } from "./commands/Permissions";
import { tryUseCommand } from "./commands/cooldowns";
import { escapeDiscordMarkdown } from "./utils";

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
    if (!command.builder || !command.execute) continue;
    
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

  const rest = new REST({ version: "10" }).setToken(token);
  (async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(clientID, process.env.GUILD_ID),
        { body: RESTApplicationCommands }
      );
    } catch (error) {
      console.error(error);
    }
  })();

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

      // don't send an auto-updating message if the time remaining is less than 2 seconds
      if (timeRemaining < 2000) {
        replyToInteraction(
          interaction,
          header,
          "\n• You've used this command too much! Wait just a moment and try again.",
          false
        );
        return;
      }

      // don't send an auto-updating message if the command has a short cooldown
      if (result.status === "cooldown" && result.constraint.cooldown < 2750) {
        replyToInteraction(
          interaction,
          header,
          "\n• Hold on! You're sending commands too quickly!",
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
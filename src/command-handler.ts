import { Client, Collection, CommandInteraction, Events, GuildMember, GuildTextBasedChannel, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import fs from "node:fs";
import { Command } from "./commands/Command";
import { SlashCommandFileData } from "./commands/Permissions";
import { tryUseCommand } from "./commands/cooldowns";

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
    const command: SlashCommandFileData = require(`${commandFolder}/${file}`);
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

    if (result.status === "ratelimited") {
      // TODO
    } else if (result.status === "cooldown") {
      // TODO
    } else if (result.status === "success") {
      // TODO
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

    // if (isCommandLimited(member, command, commandName, interaction.channel)) {
    //   const timeLeft = Math.ceil(getLimitTime(member, commandName) / 1000 + 1);
    //   replyToInteraction(
    //     interaction,
    //     "Limit",
    //     "\n• You've used this command too much! You can use it again in " + secondsToEnglish(timeLeft) + ".",
    //     false
    //   );
    //   return;
    // }

    // if (isOnCooldown(interaction.user.id, commandName)) {
    //   // TODO Could personalize this message depending on the bot's personality
    //   const timeLeft = Math.ceil(getCooldown(interaction.user.id, commandName) / 1000 + 1);
    //   replyToInteraction(
    //     interaction,
    //     "Cooldown",
    //     "\n• Hold on! You can use this command again in " + timeLeft + (timeLeft === 1 ? " second." : " seconds."),
    //     false
    //   );
    //   return;
    // } else if (isOnCooldown(interaction.user.id)) {
    //   if (COOLDOWN_TIME > 2750) {
    //     const timeLeft = Math.ceil(getCooldown(interaction.user.id) / 1000 + 1);
    //     replyToInteraction(
    //       interaction,
    //       "Cooldown",
    //       "\n• Hold on! You can use another command in " + timeLeft + (timeLeft === 1 ? " second." : " seconds."),
    //       false
    //     );
    //   } else {
    //     replyToInteraction(
    //       interaction,
    //       "Cooldown",
    //       "\n• Hold on! You're sending commands too quickly!",
    //       false
    //     );
    //   }
    //   return;
    // }
  });

  client.login(token);
}

function isBroadcastChannel(channel: GuildTextBasedChannel) {
  return channel.name == "lame-bots";
}

export async function replyToInteraction(interaction: CommandInteraction, header: string, response: string, broadcast: boolean) {
  await interaction.reply({
    content:
      "**" + header + " *｡✲ﾟ ——**" +
      (broadcast ? "\n\n<@" + interaction.user.id + ">" : "") +
      "\n" + response,
    ephemeral: !broadcast,
  });
}
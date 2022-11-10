const { Collection, Events } = require("discord.js");
const discordModals = require('discord-modals');
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');

const COOLDOWN_TIME = 2000;
const commandCooldown = new Set();

function commandToBroadcastOption(command) {
  return { type: 1, ...command };
}

function registerClientAsCommandHandler(client, commandFolder, clientID, token) {
  const commands = new Collection();
  const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'));

  const JSONcommands = [];
  let broadcastCommand = {
    name: "broadcast",
    description: "Broadcast a command!",
    options: []
  };
  
  for (const file of commandFiles) {
    const command = require(`${commandFolder}/${file}`);
    // check if data and execute are defined in command
    if (command.data && command.execute) {
      const commandJSON = command.data.toJSON();

      commands.set(command.data.name, command);
      JSONcommands.push(commandJSON);

      if (command.broadcastable) {
        broadcastCommand.options.push(commandToBroadcastOption(commandJSON));
      }
    }
  }

  if (broadcastCommand.options.length > 0) JSONcommands.push(broadcastCommand);
  
  const rest = new REST({ version: '10' }).setToken(token);
  (async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(clientID, process.env.GUILD_ID),
        { body: JSONcommands },
      );
    } catch (error) {
      console.error(error);
    }
  })();
  
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (commandCooldown.has(interaction.user.id)) {
      // TODO Could personalize this message depending on the bot's personality
      replyToInteraction(interaction, "Cooldown", "\n• Hold on! You're sending commands too quickly!", false);
      return;
    }
    commandCooldown.add(interaction.user.id);
    setTimeout(() => commandCooldown.delete(interaction.user.id), COOLDOWN_TIME);
    
    let commandName = interaction.commandName;
    let preferBroadcast = isBroadcastChannel(interaction.channel);
    if (commandName === "broadcast") {
      commandName = interaction.options.getSubcommand();
      preferBroadcast = true;
    }
    
    const command = commands.get(commandName);
    if (!command) return;
    
    try {
      await command.execute(interaction, preferBroadcast);
    } catch (error) {
      console.error(error);
      try {
        // TODO this is getting janky
        await replyToInteraction(interaction, "Error", "\n• Sorry, an error occurred while running that command.", preferBroadcast);
      } catch (error) {
        console.error(error);
      }
    }
  });

  discordModals(client);
  client.login(token);
}

function isBroadcastChannel(channel) {
  return channel.name == "lame-bots";
}

async function replyToInteraction(interaction, header, response, broadcast) {
  await interaction.reply({
    content: "**" + header + " *｡✲ﾟ ——**"
    + (broadcast ? '\n\n<@' + interaction.user.id + '>' : '')
    + '\n' + response,
    ephemeral: !broadcast
  });
}

module.exports = {
  registerClientAsCommandHandler,
  replyToInteraction
}
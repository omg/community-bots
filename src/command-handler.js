const { Collection, Events } = require("discord.js");
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');

const COOLDOWN_TIME = 2000;
const commandCooldown = new Map();

function commandToBroadcastOption(command) {
  return { type: 1, ...command };
}

function isOnCooldown(userID, commandName = "") {
  return getCooldown(userID, commandName) > 0;
}

function getCooldown(userID, commandName = "") {
  return Math.max((commandCooldown.get(userID + commandName) || 0) - Date.now(), 0);
}

function setOnCooldown(userID, commandName, cooldown) {
  commandCooldown.set(userID, Date.now() + COOLDOWN_TIME);
  if (commandName && cooldown) commandCooldown.set(userID + commandName, Date.now() + cooldown);
}

function registerClientAsCommandHandler(client, commandFolder, clientID, token) {
  const commands = new Collection();
  const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'));

  const JSONcommands = [];
  let broadcastCommand = {
    name: "shout",
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

    let commandName = interaction.commandName;
    let preferBroadcast = isBroadcastChannel(interaction.channel);
    if (commandName === "shout") {
      commandName = interaction.options.getSubcommand();
      preferBroadcast = true;
    }
    
    const command = commands.get(commandName);
    if (!command) return;

    if (isOnCooldown(interaction.user.id, commandName)) {
      // TODO Could personalize this message depending on the bot's personality
      const timeLeft = Math.ceil(getCooldown(interaction.user.id, commandName) / 1000 + 1);
      replyToInteraction(interaction, "Cooldown", "\n• Hold on! You can use this command again in " + timeLeft + (timeLeft === 1 ? " second." : " seconds."), false);  
      return;
    } else if (isOnCooldown(interaction.user.id)) {
      if (COOLDOWN_TIME > 2750) {
        const timeLeft = Math.ceil(getCooldown(interaction.user.id) / 1000 + 1);
        replyToInteraction(interaction, "Cooldown", "\n• Hold on! You can use another command in " + timeLeft + (timeLeft === 1 ? " second." : " seconds."), false);  
      } else {
        replyToInteraction(interaction, "Cooldown", "\n• Hold on! You're sending commands too quickly!", false);
      }
      return;
    }

    setOnCooldown(interaction.user.id, commandName, command.cooldown);
    
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
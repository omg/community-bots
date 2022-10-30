const { Collection } = require("discord.js");

const COOLDOWN_TIME = 2000;

// const clientCommands = new Collection();
const commandCooldown = new Set();

function registerClientAsCommandHandler(client, commandFolder) {
  const commands = new Collection();
  const commandFiles = fs.readdirSync(`./commands/${commandFolder}`).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${commandFolder}/${file}`);
    // check if data and execute are defined in command
    if (command.data && command.execute) {
      commands.set(command.data.name, command);
    }
  }

  // clientCommands.set(client, commands);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

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
      replyToInteraction(interaction, "Error", "\n• Sorry, an error occurred while running that command.", preferBroadcast);
    }
  });
}

function isBroadcastChannel(channel) {
  return channel.name == "lame-bots";
}

function replyToInteraction(interaction, header, response, broadcast) {
  interaction.reply({
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
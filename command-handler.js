const { Collection } = require("discord.js");

const COOLDOWN_TIME = 2000;

const clientCommands = new Collection();
const commandCooldown = new Collection();

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

  clientCommands.set(client, commands);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    let commandName = interaction.commandName;
    let broadcastThis = isBroadcastChannel(interaction.channel);
    if (commandName === "broadcast") {
      commandName = interaction.options.getSubcommand();
    }

    const command = commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await replyToInteraction(interaction, "Error", "\n• Sorry, an error occurred while running that command.", broadcastThis);
    }
  }
}

function isBroadcastChannel(channel) {
  return channel.name == "lame-bots";
}

function replyToInteraction(interaction, header, response, broadcastThis) {
  interaction.reply({
    content: "**" + header + " *｡✲ﾟ ——**"
    + (broadcastThis ? '\n\n<@' + interaction.user.id + '>' : '')
    + '\n' + response,
    ephemeral: !broadcastThis
  });
}
// Register a slash command

const { Client, Intents, Routes, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { registerClientAsCommandHandler } = require('./command-handler');

// const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const vivi = new Client({
  intents: [
    // GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildMembers,
    // GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.MessageContent
  ]
});

vivi.on('ready', () => {
  console.log(`Logged in as ${vivi.user.tag}!`);
});

// Set Vivi's Discord presence every 24 hours (if Vivi runs too long, the status might be reset)
(function updatePresence() {
  vivi.user.setPresence({
    activities: [{
      name: '286.6K words',
      type: 'WATCHING'
    }],
    status: 'online'
  });
  setTimeout(updatePresence, 86400000);
})();

function getBroadcastJSON(command) {
  return { type: 1, ...command };
}

/*const charactersCommandJSON = {
  name: "characters",
  description: "Get the amount of characters for a word!",
  options: [
    {
      name: "query",
      description: "The text to count words from",
      type: 3,
      required: true
    },
    {
      name: "frequency",
      description: "Whether or not to calculate character frequency",
      type: 5,
      required: false
    }
  ]
}*/

// let broadcastCommand = {
//   name: "broadcast",
//   description: "Broadcast a command!",
//   options: [
//     getBroadcastJSON
// }

// let commands = [
//   solveCommandJSON,
//   checkCommandJSON,
//   countCommandJSON,
//   //versionCommandJSON,
//   {
//     name: "broadcast",
//     description: "Broadcast a command!",
//     options: [
//       getBroadcastJSON(solveCommandJSON),
//       getBroadcastJSON(checkCommandJSON),
//       getBroadcastJSON(countCommandJSON)//,
//       //getBroadcastJSON(versionCommandJSON)
//     ]
//   }
// ];

const rest = new REST({ version: '9' }).setToken(process.env.VIVI_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.VIVI_CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// function versionCommand(interaction, broadcastThis) {
//   replyToInteraction(interaction, "Version", "\n• v" + version, broadcastThis);
// }

/*

/^(?<word>[^\r\n\t\f\v]*)\t(?:(?<rootWord>[^\r\n\t\f\v ]*), )?(?:(?<tags>(?:\([^\r\n\t\f\v\)]*\) ?)*) )?(?<definition>[^\r\n\t\f\v\[]*?)(?:, also (?<also>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech>[^\r\n\t\f\v\] ]*)(?: (?<meta>[^\r\n\t\f\v\]]*))?\](?: \/ (?<definition2>[^\r\n\t\f\v\[]*?)(?:, also (?<also2>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech2>[^\r\n\t\f\v\] ]*)(?: (?<meta2>[^\r\n\t\f\v\]]*))?\])?(?: \/ (?<definition3>[^\r\n\t\f\v\[]*?)(?:, also (?<also3>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech3>[^\r\n\t\f\v\] ]*)(?: (?<meta3>[^\r\n\t\f\v\]]*))?\])?$/gm

*/

//

vivi.login(process.env.VIVI_TOKEN);
registerClientAsCommandHandler(vivi, "vivi");

//

// const Lame = require('./lame.js');

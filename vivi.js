// Register a slash command

const { Client, Intents, Routes, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');

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

//Functionality

const Dictionary = require('./dictionary.js');

function solveCountCommand(interaction, broadcastThis) {
  let prompt = Dictionary.clean(interaction.options.get("prompt").value.toUpperCase());
  if (Dictionary.isSearchGarbage(prompt)) {
    replyToInteraction(interaction, "Solve Count", "\n• Sorry, that's not a valid prompt!", broadcastThis);
    return;
  }

  let solves = Dictionary.solve(prompt);

  if (solves.length === 0) {
    replyToInteraction(interaction, "Solve Count", "\n• That prompt is impossible.", broadcastThis);
  } else {
    replyToInteraction(interaction, "Solve Count",
      '\n• There '
      + (solves.length === 1 ? 'is **1** solve' : 'are **' + formatNumber(solves.length) + '** solves')
      + ' for ' + getEmoteText(presentEmotes, prompt) + '.'
    , broadcastThis);
  }
}

// function getPromptObject(promptString) {
//   // ES 5-9
//   // ES <5
//   // ES >5
// }

function solveCommand(interaction, broadcastThis) {
  let prompt = Dictionary.clean(interaction.options.get("prompt").value.toUpperCase());
  if (Dictionary.isSearchGarbage(prompt)) {
    replyToInteraction(interaction, "Solver", "\n• Sorry, that's not a valid prompt!", broadcastThis);
    return;
  }

  let solves = Dictionary.solve(prompt);

  if (solves.length === 0) {
    replyToInteraction(interaction, "Solver", "\n• That prompt is impossible.", broadcastThis);
  } else {
    let solverString = 'I found '
      + (solves.length === 1 ? '**1** solution!' : '**' + formatNumber(solves.length) + '** solutions!')
      + '\n'

    shuffle(solves);

    let shownSolves = [];
    let solvesLength = 0;

    for (let i = 0; i < Math.min(solves.length, 4); i++) {
      let solve = solves[i];
      let promptIndex = solve.search(prompt);

      let solveDisplay = '\n• ' + getEmoteText(presentEmotes, solve.substring(0, promptIndex)) + getEmoteText(promptBlueEmotes, solve.substring(promptIndex, promptIndex + prompt.length)) + getEmoteText(presentEmotes, solve.substring(promptIndex + prompt.length));
      if (solverString.length + solvesLength + solveDisplay.length > 1910) break;
      shownSolves.push(solveDisplay);
      solvesLength += solveDisplay.length;
    }

    shownSolves.sort(function(a, b) {
      return b.length - a.length || a.localeCompare(b);
    });

    for (let i = 0; i < shownSolves.length; i++) {
      solverString += shownSolves[i];
    }

    replyToInteraction(interaction, "Solver", solverString, broadcastThis);
  }
}

function checkWordCommand(interaction, broadcastThis) {
  let word = Dictionary.clean(interaction.options.get("word").value.toUpperCase());
  if (Dictionary.isSolveGarbage(word)) {
    replyToInteraction(interaction, "Word Status", "\n• Sorry, that's not a valid word!", broadcastThis);
    return;
  }

  if (word.length > 34) {
    replyToInteraction(interaction, "Word Status",
      '\n• **' + word.substring(0, 20) + '..'
      + '\n<:Bad:775275262740791336> Too long** to be a valid English word.'
    , broadcastThis);
  } else if (Dictionary.isWord(word)) {
    replyToInteraction(interaction, "Word Status",
      '\n• **' + word
      + '\n<:Good:775275262731878410> Available** on live servers.'
    , broadcastThis);
  } else {
    replyToInteraction(interaction, "Word Status",
      '\n• **' + word
      + '\n<:Bad:775275262740791336> Not found** in the English dictionary.'
    , broadcastThis);
  }
}

// function versionCommand(interaction, broadcastThis) {
//   replyToInteraction(interaction, "Version", "\n• v" + version, broadcastThis);
// }

/*

/^(?<word>[^\r\n\t\f\v]*)\t(?:(?<rootWord>[^\r\n\t\f\v ]*), )?(?:(?<tags>(?:\([^\r\n\t\f\v\)]*\) ?)*) )?(?<definition>[^\r\n\t\f\v\[]*?)(?:, also (?<also>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech>[^\r\n\t\f\v\] ]*)(?: (?<meta>[^\r\n\t\f\v\]]*))?\](?: \/ (?<definition2>[^\r\n\t\f\v\[]*?)(?:, also (?<also2>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech2>[^\r\n\t\f\v\] ]*)(?: (?<meta2>[^\r\n\t\f\v\]]*))?\])?(?: \/ (?<definition3>[^\r\n\t\f\v\[]*?)(?:, also (?<also3>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech3>[^\r\n\t\f\v\] ]*)(?: (?<meta3>[^\r\n\t\f\v\]]*))?\])?$/gm

*/

//

vivi.login(process.env.VIVI_TOKEN);

//

const Lame = require('./lame.js');

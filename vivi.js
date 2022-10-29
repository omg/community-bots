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

// Create a commands collection loaded from the commands folder
const commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.data.name, command);
}

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
//const Vivi = require('./vivi.js');

const presentEmotes = {
  'A': '<:AWhite:971179538350477412>',
  'B': '<:BWhite:971191770958409778>',
  'C': '<:CWhite:971191771008761897>',
  'D': '<:DWhite:971179806161002496>',
  'E': '<:EWhite:971179806072905748>',
  'F': '<:FWhite:971179806202921061>',
  'G': '<:GWhite:971179848695435344>',
  'H': '<:HWhite:971191771226857472>',
  'I': '<:IWhite:971179848670265415>',
  'J': '<:JWhite:971179848871604254>',
  'K': '<:KWhite:971179848678645790>',
  'L': '<:LWhite:971179848833830973>',
  'M': '<:MWhite:971179900637704352>',
  'N': '<:NWhite:971191771155542046>',
  'O': '<:OWhite:971179900616728647>',
  'P': '<:PWhite:971179900583165952>',
  'Q': '<:QWhite:971179900599951370>',
  'R': '<:RWhite:971191771105210419>',
  'S': '<:SWhite:971179965930414122>',
  'T': '<:TWhite:971179966446305360>',
  'U': '<:UWhite:971179966496669727>',
  'V': '<:VWhite:971179966404378674>',
  'W': '<:WWhite:971180026106085386>',
  'X': '<:XWhite:971180094179647499>',
  'Y': '<:YWhite:971191771025526874>',
  'Z': '<:ZWhite:971191771067478086>',
  '\'': '<:ApostropheWhite:971179966454714428>',
  '-': '<:HyphenWhite:971179966379196496>',
  '.': '<:BlankWhite:971179538350477342>',
  '0': '<:0White:971179538329522186>',
  '1': '<:1White:971179538354688081>',
  '2': '<:2White:971179538321121330>',
  '3': '<:3White:971179538308534352>',
  '4': '<:4White:971179538279194685>',
  '5': '<:5White:971179538308534272>',
  '6': '<:6White:971179538321137734>',
  '7': '<:7White:971179538123980891>',
  '8': '<:8White:971179806173565068>',
  '9': '<:9White:971179538396635176>',
  '@': '<:AtWhite:971179538493112400>'
};
const promptBlueEmotes = {
  'A': '<:AGold:971184700167188510>',
  'B': '<:BGold:971193840348332043>',
  'C': '<:CGold:971193840369283132>',
  'D': '<:DGold:971184700150411444>',
  'E': '<:EGold:971184700171374654>',
  'F': '<:FGold:971184740549951558>',
  'G': '<:GGold:971184740541538394>',
  'H': '<:HGold:971193840457367633>',
  'I': '<:IGold:971184790231478292>',
  'J': '<:JGold:971184790269202492>',
  'K': '<:KGold:971184820573061171>',
  'L': '<:LGold:971184820694695936>',
  'M': '<:MGold:971184820245909635>',
  'N': '<:NGold:971193840352501770>',
  'O': '<:OGold:971184820627603516>',
  'P': '<:PGold:971184820606623795>',
  'Q': '<:QGold:971184862167969833>',
  'R': '<:RGold:971193840151199823>',
  'S': '<:SGold:971184862432202842>',
  'T': '<:TGold:971184862499323914>',
  'U': '<:UGold:971184862444785724>',
  'V': '<:VGold:971184862423834654>',
  'W': '<:WGold:971184898725519380>',
  'X': '<:XGold:971184898729725952>',
  'Y': '<:YGold:971193840402858014>',
  'Z': '<:ZGold:971193913379549215>',
  '\'': '<:ApostropheGold:971184500149194862>',
  '-': '<:HyphenGold:971184500145004544>',
  '.': '<:BlankGold:971184654549921812>',
  '0': '<:0Gold:971184536811614281>',
  '1': '<:1Gold:971184537151373342>',
  '2': '<:2Gold:971184537159737404>',
  '3': '<:3Gold:971184537151352862>',
  '4': '<:4Gold:971184537117790268>',
  '5': '<:5Gold:971184537193295952>',
  '6': '<:6Gold:971184537130381382>',
  '7': '<:7Gold:971184537189089290>',
  '8': '<:8Gold:971184536870350890>',
  '9': '<:9Gold:971184537147162654>',
  '@': '<:AtGold:971184500157583431>'
};

function getEmoteText(emotes, text) {
  let emoteText = '';
  for (let i = 0; i < text.length; i++) {
    emoteText += emotes[text.charAt(i)];
  }
  return emoteText;
}

function formatNumber(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const commandCooldown = new Set();
const cooldownTime = 2000;

function replyToInteraction(interaction, header, response, broadcastThis) {
  interaction.reply({
    content: "**" + header + " *｡✲ﾟ ——**"
    + (broadcastThis ? '\n\n<@' + interaction.user.id + '>' : '')
    + '\n' + response,
    ephemeral: !broadcastThis
  });
}

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

function getPromptObject(promptString) {
  // ES 5-9
  // ES <5
  // ES >5
}

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

function versionCommand(interaction, broadcastThis) {
  replyToInteraction(interaction, "Version", "\n• v" + version, broadcastThis);
}

/*

/^(?<word>[^\r\n\t\f\v]*)\t(?:(?<rootWord>[^\r\n\t\f\v ]*), )?(?:(?<tags>(?:\([^\r\n\t\f\v\)]*\) ?)*) )?(?<definition>[^\r\n\t\f\v\[]*?)(?:, also (?<also>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech>[^\r\n\t\f\v\] ]*)(?: (?<meta>[^\r\n\t\f\v\]]*))?\](?: \/ (?<definition2>[^\r\n\t\f\v\[]*?)(?:, also (?<also2>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech2>[^\r\n\t\f\v\] ]*)(?: (?<meta2>[^\r\n\t\f\v\]]*))?\])?(?: \/ (?<definition3>[^\r\n\t\f\v\[]*?)(?:, also (?<also3>[^\r\n\t\f\v\[]*) )? ?\[(?<partOfSpeech3>[^\r\n\t\f\v\] ]*)(?: (?<meta3>[^\r\n\t\f\v\]]*))?\])?$/gm

*/

//Start the bot up

function canBroadcast(member) {
  return member.roles.cache.some(role => role.name == "regular");
}

vivi.on('interactionCreate', interaction => { //I removed async before interaction, what's the diffference
  if (!interaction.isCommand()) return;

  //

  if (commandCooldown.has(interaction.user.id)) {
    interaction.reply({
      content: "**Cooldown *｡✲ﾟ ——**"
      + "\n\n• Hold on! You're sending commands too quickly!",
      ephemeral: true
    });
    return;
  }
  commandCooldown.add(interaction.user.id);
  setTimeout(() => {
    commandCooldown.delete(interaction.user.id);
  }, cooldownTime);

  //

  let broadcastThis = interaction.channel.name === 'lame-bot';
  let commandName = interaction.commandName;

  if (commandName === 'broadcast') {

    if (!canBroadcast(interaction.member)) {
      interaction.reply({
        content: "**Broadcast *｡✲ﾟ ——**"
        + "\n\n• You need to be a regular to use the broadcast command.",
        ephemeral: true
      });
      return;
    }

    if (interaction.channel.name === 'suggest-new-words') {
      interaction.reply({
        content: "**Broadcast *｡✲ﾟ ——**"
        + "\n\n• You cannot broadcast here.",
        ephemeral: true
      });
      return;
    }

    broadcastThis = true;
    commandName = interaction.options.getSubcommand();
  }

  //

  if (commandName === 'solve') {
    solveCommand(interaction, broadcastThis);
  } else if (commandName === 'count') {
    solveCountCommand(interaction, broadcastThis);
  } else if (commandName === 'check') {
    checkWordCommand(interaction, broadcastThis);
  }/* else if (commandName === 'version') {
    versionCommand(interaction, broadcastThis);
  }*/
});

//

vivi.login(process.env.VIVI_TOKEN);

//

const Lame = require('./lame.js');

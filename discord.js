const LAME_TOKEN = process.env.LAME_TOKEN;

// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
// const { token } = require('./config.json');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    //GatewayIntentBits.MessageContent
  ]
});

const { once } = require("events");

// When the client is ready, run this code (only once)
client.once('ready', () => {
  // client.user.setPresence({ activities: [{ name: 'activity' }], status: 'idle' });

  // const channel = client.channels.cache.get('id');
  // channel.send('content');
	
  console.log('Client is ready!');
});

async function waitForReady() {
  if (!client.isReady()) return once(client, "ready");
}

async function setPresence(text, idle = false) {
  await waitForReady();
  console.log("ready! doing the thingy!");
  client.user.setPresence({ activities: [{ name: text }], status: idle ? 'idle' : 'online' });
}

async function sendImportantMessageThatNeedsToBeReceived(channelID, message) {
  await waitForReady();
  try {
    await client.channels.cache.get(channelID).send(message);
  } catch {
    await sendImportantMessageThatNeedsToBeReceived(channelID, message); // this could be infinite loop with the right error message..... put some time on it
  }
}

async function sendMessage(channelID, message) {
  client.channels.cache.get(channelID).send(message).catch(() => {
    console.log("Message failed to send."); // TODO does this even work
  });
}

// Login to Discord with your client's token
client.login(LAME_TOKEN);

module.exports = {
  client,
  setPresence,
  sendImportantMessageThatNeedsToBeReceived,
  sendMessage
}
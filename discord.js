const TOKEN = process.env.TOKEN;

// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
// import { token } from './config.json';

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

client.on('messageCreate', (message) => {
  // TODO
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);

module.exports = {
  setPresence,
  sendImportantMessageThatNeedsToBeReceived,
  sendMessage
}
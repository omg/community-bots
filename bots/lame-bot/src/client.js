const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { registerClientAsCommandHandler } = require('../../src/command-handler');
const path = require('node:path');

const lameBotClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel
  ],
  allowedMentions: { parse: ['users'] }
});

lameBotClient.on('ready', () => {
  console.log(`Logged in as ${lameBotClient.user.tag}!`);
});

async function waitForReady() {
  if (lameBotClient.readyAt) return;
  await new Promise(resolve => {
    lameBotClient.once('ready', resolve);
  });
}

async function getGuild(guildID) {
  await waitForReady();
  return lameBotClient.guilds.cache.get(guildID);
}

async function getChannel(channelID) {
  await waitForReady();
  return lameBotClient.channels.cache.get(channelID);
}

// async function to send a message to a channel and wait for it to be sent, retrying with backoff with a maximum length of 5 seconds
async function sendMessage(channel, message) {
  await waitForReady();

  if (typeof channel === 'string') {
    channel = await getChannel(channel);
  }

  let retryDelay = 500;
  while (true) {
    try {
      return await channel.send(message);
    } catch (error) {
      console.error(error);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      retryDelay = Math.min(retryDelay + 500, 5000);
    }
  }
}

async function sendMessageAsReply(replyMessage, message) {
  await waitForReady();

  let retryDelay = 500;
  while (true) {
    try {
      return await replyMessage.reply(message);
    } catch (error) {
      console.error(error);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      retryDelay = Math.min(retryDelay + 500, 5000);
    }
  }
}

//

registerClientAsCommandHandler(lameBotClient, path.join(__dirname, '../commands'), process.env.LAME_CLIENT_ID, process.env.LAME_TOKEN);

//

module.exports = {
  lameBotClient,
  sendMessage,
  sendMessageAsReply,
  getChannel,
  getGuild,
  waitForReady
}
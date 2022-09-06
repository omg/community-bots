require('dotenv').config();

const TOKEN = process.env.TOKEN;

// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from 'discord.js';
import { token } from './config.json';

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    //GatewayIntentBits.MessageContent
  ]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
  // client.user.setPresence({ activities: [{ name: 'activity' }], status: 'idle' });

  // const channel = client.channels.cache.get('id');
  // channel.send('content');


	
  console.log('Ready!');
});

client.on('messageCreate', (message) => {
  // TODO
});

// Login to Discord with your client's token
client.login(token);
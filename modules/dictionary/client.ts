import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { registerClientAsCommandHandler } from '../../src/command-handler';
import path from 'node:path';

export const viviClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations
  ],
  allowedMentions: { parse: ['users'] }
});

function updatePresence() {
  viviClient.user.setPresence({
    activities: [{
      name: '286.6K words',
      type: ActivityType.Watching
    }],
    status: 'online'
  });
  setTimeout(updatePresence, 86400000);
}

viviClient.on('ready', () => {
  console.log(`Logged in as ${viviClient.user.tag}!`);
  updatePresence();
});

//

registerClientAsCommandHandler(viviClient, path.join(__dirname, '../commands'), process.env.VIVI_CLIENT_ID, process.env.VIVI_TOKEN);

//

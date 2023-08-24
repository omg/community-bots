import { Client, GatewayIntentBits, ActivityType, ApplicationCommandPermissionType } from 'discord.js';
import { registerClientAsCommandHandler } from '../../src/command-handler';
import path from 'node:path';

export const sleuthClient = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ],
  allowedMentions: { parse: ['users'] }
});

function updatePresence() {
  let memberCount = sleuthClient.guilds.cache.find(g => g.id == process.env.GUILD_ID).memberCount / 1000;
  memberCount = Math.round(memberCount * 10) / 10;

  sleuthClient.user.setPresence({
    activities: [{
      name: memberCount + 'K members',
      type: ActivityType.Watching
    }],
    status: 'dnd'
  });
  
  setTimeout(updatePresence, 86400000);
}

sleuthClient.on('ready', async () => {
  console.log(`Logged in as ${sleuthClient.user.tag}!`);
  updatePresence();

  const guild = sleuthClient.guilds.cache.get('YOUR_GUILD_ID');
  const commands = await guild.commands.fetch();

  commands.forEach(command => {
    // Check if the command is "roll"
    if (command.name !== 'roll') return;

    command.permissions.set({
      permissions: [
        {
          id: 'YOUR_ROLE_ID',
          type: ApplicationCommandPermissionType.Role,
          permission: true
        },
        {
          id: 'YOUR_ROLE_ID',
          type: ApplicationCommandPermissionType.Channel,
          permission: false
        }
      ],
      token: 'YOUR_TOKEN'
    })
  });
});

//

registerClientAsCommandHandler(sleuthClient, path.join(__dirname, '../commands'), process.env.SLEUTH_CLIENT_ID, process.env.SLEUTH_TOKEN);

//

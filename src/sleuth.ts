import { Client, GatewayIntentBits, ActivityType, Role } from 'discord.js';
import path from 'node:path';

export const sleuthClient = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ],
  allowedMentions: { parse: ['users'] }
});

function formatNumber(count: number): string {
  if (count < 1000) {
      return count.toString();
  } else if (count < 10000) {
      return (Math.floor(count / 100) / 10).toFixed(1) + 'K';
  } else {
      return Math.floor(count / 1000) + 'K';
  }
}

function updatePresence() {
  let memberCount = sleuthClient.guilds.cache.get(process.env.GUILD_ID).memberCount;
  let displayCount = formatNumber(memberCount);

  sleuthClient.user.setPresence({
    activities: [{
      name: displayCount + ' members',
      type: ActivityType.Watching
    }],
    status: 'dnd'
  });
  setTimeout(updatePresence, 1000 * 60 * 20); // 20 MINUTES
}

export async function createBoosterIcon(name: string, rolePos: number, iconResized: Buffer, userID: string): Promise<Role> {
  let userBoosterRole = await sleuthClient.guilds.cache.get(process.env.GUILD_ID).roles.create({
    name: name,
    position: rolePos,
    icon: iconResized
  });

  return userBoosterRole;
}

export async function assignRole(userID: string, roleID: string): Promise<void> {
  await sleuthClient.guilds.cache.get(process.env.GUILD_ID).members.cache.get(userID).roles.add(roleID);
}

sleuthClient.on('ready', () => {
  console.log(`Logged in as ${sleuthClient.user.tag}!`);
  updatePresence();
});
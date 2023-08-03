import { Client, GatewayIntentBits, ActivityType, Partials } from "discord.js";
import { registerClientAsCommandHandler } from "../../../src/command-handler";
import path from "node:path";

const sleuthClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
  ],
  allowedMentions: { parse: ["users"] },
});

async function updatePresence() {
  let memberCount =
    // @ts-ignore
    sleuthClient.guilds.cache.find((g) => g.id == "476593983485902850")
      .memberCount / 1000;
  memberCount = Math.round(memberCount * 10) / 10;

  // @ts-ignore
  sleuthClient.user.setPresence({
    activities: [
      {
        name: memberCount + "K members",
        type: ActivityType.Watching,
      },
    ],
    status: "dnd",
  });

  let startTime = 1675778400000;
  let now = Date.now();
  let time = now - startTime;
  let days = Math.ceil(time / 86400000);
  // @ts-ignore
  await sleuthClient.channels.cache
    .find((c) => c.id == "916735614362210344")
    // @ts-ignore
    .setName("Day " + days);

  setTimeout(updatePresence, 86400000);
}

sleuthClient.on("ready", () => {
  // @ts-ignore
  console.log(`Logged in as ${sleuthClient.user.tag}!`);
  updatePresence();
});

//

registerClientAsCommandHandler(
  sleuthClient,
  path.join(__dirname, "../commands"),
  process.env.SLEUTH_CLIENT_ID,
  process.env.SLEUTH_TOKEN
);

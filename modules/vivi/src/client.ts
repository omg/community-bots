import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import { registerClientAsCommandHandler } from "../../../src/command-handler";
import path from "node:path";

const viviClient = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: ["users"] },
});

function updatePresence() {
  // @ts-ignore
  viviClient.user.setPresence({
    activities: [
      {
        name: "286.6K words",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
  setTimeout(updatePresence, 86400000);
}

viviClient.on("ready", () => {
  // @ts-ignore
  console.log(`Logged in as ${viviClient.user.tag}!`);
  updatePresence();
});

//

registerClientAsCommandHandler(
  viviClient,
  path.join(__dirname, "../commands"),
  process.env.VIVI_CLIENT_ID,
  process.env.VIVI_TOKEN
);

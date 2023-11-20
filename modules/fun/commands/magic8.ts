import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommandFileData, allChannelsExcept, category, everyone, role } from "../../../src/commands/Permissions";

const responses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes - definitely.",
  "You may rely on it.",

  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",

  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",

  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

export const getResponse = () => "_" + responses[Math.floor(Math.random() * responses.length)] + ".._";

export const command: SlashCommandFileData = {
  builder: new SlashCommandBuilder()
  .setName("magic8")
  .setDescription("Shake the magic 8 ball!"),
  
  permissions: {
    channels: allChannelsExcept([
      category("Dictionary Contributions"),
      category("Lame Land")
    ])
  },

  constraints: {
    rules: [
      {
        roles: everyone(),
        rateLimit: {
          window: 60 * 10,
          max: 2
        }
      },
      {
        roles: role("regular"),
        rateLimit: {
          window: 60 * 5,
          max: 4
        }
      },
      {
        roles: role("reliable"),
        rateLimit: "local",
      }
    ],
    enforceRulesInBotsChannel: false
  },

  limits: {
    cooldown: 8
  },

  tags: ["fun", "annoying"],

  async execute(interaction: CommandInteraction, broadcast: boolean) {
    await interaction.reply({
      content: "https://omg.games/assets/rolling.gif"
    });
  
    setTimeout(async () => {
      // edit the reply with @user rolls X/max
      await interaction.editReply({
        content: "<@" + interaction.user.id + "> **•** " + getResponse()
      });
    }, 1200);
  }
}
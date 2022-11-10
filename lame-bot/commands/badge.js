const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ModalBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName('badge')
  .setDescription('Change your OMG Community badge!');
  // .addStringOption(option =>
  //   option.setName('word')
  //     .setDescription('The word to check for')
  //     .setRequired(true))
  // .addStringOption(option =>
  //   option.setName('dictionary')
  //     .setDescription('The dictionary to check in')
  //     .setRequired(false)
  //     .addChoices({
  //       name: 'English',
  //       value: 'English'
  //     }));

// create function to handle the command
async function execute(interaction) {
  const modal = new ModalBuilder()
		.setCustomId('badge-selector')
		.setTitle('Badge Selector');
  
  const badgeSelector = new SelectMenuBuilder()
    .setCustomId('badge')
    .setPlaceholder('Select a badge')
    .addOptions([
      {
        label: 'None',
        value: 'none',
        description: 'No badge',
        emoji: '🚫'
      },
      {
        label: 'OMG Community',
        value: 'omg-community',
        description: 'OMG Community badge',
        emoji: '👑'
      },
    ]);

  const row = new ActionRowBuilder(badgeSelector);
  modal.addComponents(row);

  await interaction.showModal(modal);
};

// export the command
module.exports = {
  data,
  execute,
  broadcastable: false
};
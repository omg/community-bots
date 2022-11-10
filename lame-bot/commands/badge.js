const { SlashCommandBuilder } = require("discord.js");
const { Modal, SelectMenuComponent } = require('discord-modals');

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
  const modal = new Modal()
	  .setCustomId('badge-selector')
	  .setTitle('Modal')
	  .addComponents(
	  	new SelectMenuComponent()
	  		.setCustomId('badge')
	  		.setPlaceholder('Which badge would you like to wear?')
	  		.addOptions(
	  			{
	  				label: 'None',
	  				// description: 'Don't wear a badge.',
	  				value: 'none',
	  				// emoji: '',
	  			},
	  			{
	  				label: 'Star',
	  				// description: 'Earned from supporting OMG on Patreon.',
	  				value: 'star',
	  				emoji: '',
	  			},
	  		),
	  );
};

// export the command
module.exports = {
  data,
  execute,
  broadcastable: false
};
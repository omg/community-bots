const data = new SlashCommandBuilder()
  .setName('check')
  .setDescription('Check if a word is in the dictionary!')
  .addStringOption(option =>
    option.setName('word')
      .setDescription('The word to check for')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('dictionary')
      .setDescription('The dictionary to check in')
      .setRequired(false)
      .addChoice('English', 'English'));

// create function to handle the command
async function execute(interaction, preferBroadcast) {
  
};

// export the command
export default {
  data,
  execute
};
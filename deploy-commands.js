// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!
// lame also does badges - that's a problem if this is going to override it!

import { SlashCommandBuilder, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import { clientId, guildId, token } from './config.json';

const commands = [
	new SlashCommandBuilder()
    .setName('server')
    .setDescription('Replies with pong!'),
	new SlashCommandBuilder()
    .setName('server')
    .setDescription('Replies with server info!'),
	new SlashCommandBuilder()
    .setName('user')
    .setDescription('Replies with user info!'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);
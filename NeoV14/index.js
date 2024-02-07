const fs = require('node:fs');
const Discord = require('discord.js')
const { Collection, GatewayIntentBits } = require('discord.js');
const config = require('./jsons/config.json');
const token = config.devtoken

const client = new Discord.Client({disableEveryone: true, failIfNotExists: false,
								   partials: ['MESSAGE', 'CHANNEL', 'REACTION'], 
								   intents: [GatewayIntentBits.Guilds, 
											 GatewayIntentBits.GuildVoiceStates, 
											 GatewayIntentBits.GuildMessages, 
											 GatewayIntentBits.GuildMembers, 
											 GatewayIntentBits.GuildMessageReactions,
											 GatewayIntentBits.MessageContent]});

	client.commands = new Collection();
	client.aliases = new Collection();
	client.categories = new Collection();


const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))

for (var file of eventFiles) {
	const event = require(`./events/${file}`)
	//event.once -> event only runs ONCE and never again. event.on is whenever the event is emitted.
	event.once ? client.once(event.name, (...args) => event.run(...args, token)) : client.on(event.name, (...args) => event.run(...args, token))
}

client.login(token);
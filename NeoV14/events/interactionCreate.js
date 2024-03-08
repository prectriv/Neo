
const { EmbedBuilder } = require('discord.js')
const config = require('../jsons/config.json')

const { wli } = require('./interactionTypes/wli.js')
const { rri } = require('./interactionTypes/rri.js')

module.exports = {
	name: 'interactionCreate',
	async run(interaction, user, token) {
		//console.log(interaction.applicationId) this is way to get client id

		if (interaction.isButton() && interaction.customId.startsWith("WL")) { //whitelisting 
			return wli(interaction);

		} else if (interaction.isButton() && interaction.customId.startsWith("RR")) { //reaction roles
			return rri(interaction);

		} else if (interaction.isChatInputCommand()) {// shash command input
			const command = interaction.client.commands.get(interaction.commandName) ?? interaction.client.commands.get(interaction.client.aliases.get(interaction.commandName))
			//if command is not found, check for alias. If still not found, error:
			if (!command) return console.error('invalid interaction \n' + interaction)

			await interaction.deferReply({ ephemeral: command.ephemeral });
			if (command.category == 'music') return require('../utils/musicFuncs.js').musicInit(interaction, command);

			try {
				await command.run(interaction);
			} catch (error) {
				console.error(error);
				await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	}
}
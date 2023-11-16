const {SlashCommandBuilder, EmbedBuilder}  = require('discord.js')
const config = require('../../jsons/config.json')
const {URL} = require('url')
const { urlHandle, search } = require('../../utils/musicFuncs')


module.exports = {
	aliases: ['p', 'search'],
	category: '',
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song')
		.addStringOption(option => option.setName('input')
			.setDescription('Either enter a YouTube URL or a search term.')
			.setRequired(true)
		),

		async run (interaction, queue) {
			let serverQueue = await queue.get(interaction.guild.id)
			const input = interaction.options.getString('input');

			try { // manual url handling
				new URL(input)
				let data = await urlHandle(interaction, input)
				console.log(data)
						
			} catch { //search handling
				console.log("searching")
				await search(interaction, input)

			}

		}

}
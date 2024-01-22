const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const fs = require("fs")
const config = require('../../jsons/config.json')
const errors = require('../../utils/errors.js');
const {blacklist} = require('../../libs/wldb.js')


module.exports = {
	aliases: ['debl'],
	category: '',
	//local: 'mc server guild id'
	data: new SlashCommandBuilder()
		.setName('deblacklist')
		.setDescription('De-blacklists specified user.')
		.addUserOption(option => option.setName('user')
			.setDescription('Enter the username of the person you wish to remove from the BL.')
			.setRequired(true)
		),

		async run (interaction) {
			if (interaction.guild.id != config.myServer) return errors.noArg(interaction, "This can only be used in Xaviers discord.", "Incorrect server.")
			//check if admin
			const GUILD_CACHE = await interaction.guild.members.cache.get(interaction.user.id);
			if (!GUILD_CACHE.roles.cache.has('697499237151408229')) return errors.noArg(interaction, "No permission.");

			let user = interaction.options.getUser('user');
			
			let blUser = (await blacklist.findByPk(user.id))
			if(blUser == null){
				return errors.noArg(interaction, `The user <@${user.id}> has not been blacklisted.`, 'Invalid User:')
			} else {
				blUser.destroy({where: {id: user.id}})
				let embed = new EmbedBuilder()
					.setTitle("Un-blacklisted user")
					.setColor(config.posHex)
					.setDescription(`<@${user.id}> has been unblacklisted.`);

				return interaction.editReply({embeds: [embed]})
			}

		}
	}
const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js')
const {rr} = require('../../libs/db.js')
const config = require('../../jsons/config.json')

module.exports = {
	aliases: ['rrd'],
	category: '',
	ephemeral: true,
	data: new SlashCommandBuilder()
		.setName('rrdel')
		.setDescription('Removes a reaction role from the system.')
		.addRoleOption(option => option.setName('role')
			.setDescription('Role to be removed.')
			.setRequired(true)
		),

		async run (interaction) {
			//get role and desc input
			let role = await interaction.options.getRole('role');
			// Guild Reaction Roles
			await rr.findOne({where: {guild: interaction.guild.id}}).then(async grr => {
				if(grr != null){ //if DB exists, attempt removing the role fom the DB
					
				} else { //no db exists
					return interaction.editReply({content: 'There are no reaction roles set up for this server!'});
				}
				await grr.save();
			});


		}
}
const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js')
const {rr} = require('../../libs/db.js')
const {rrEditMessage} = require('../../utils/functions.js');

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
					grr.roles.forEach(async r => { //check if the role already exists.
						if(r.id == role.id) {
							grr.roles = grr.roles.filter(r => r.id != role.id);
									
							if(grr.roles.length == 0) { //if there are no more roles, delete the DB.
								let msg = await interaction.channel.messages.fetch(grr.message); 
									msg.delete();

								await rr.destroy({where: {guild: interaction.guild.id}});
								return interaction.editReply({content: 'RR removed!'});
							}

							await interaction.editReply({content: 'Role removed!'});
							await grr.save();
						
							//edit message
							await rrEditMessage(rr, interaction);

							//reply to interaction to show success.
							interaction.editReply({content: `${role} has been removed from the reaction roles message!`})

						} else {
							return interaction.editReply({content: `${role} is not in the role message!`});
						}
					});
			
				} else { //no db exists
					return interaction.editReply({content: 'There are no reaction roles set up for this server!'});
				}
			});
		}
	}
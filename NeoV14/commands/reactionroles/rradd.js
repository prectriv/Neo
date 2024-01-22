const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {rr} = require('../../libs/rrdb.js');
const config = require('../../jsons/config.json');
const errors = require('../../utils/errors.js');
const {rrEditMessage} = require('../../utils/functions.js');

module.exports = {
	aliases: ['rra'],
	category: '',
	ephemeral: true,
	data: new SlashCommandBuilder()
		.setName('rradd')
		.setDescription('Adds new reaction role, initilazing the system if it hasnt been done already')
		.addRoleOption(option => option.setName('role')
			.setDescription('Role to be added.')
			.setRequired(true)
		)
		.addStringOption(option => option.setName('description')
			.setDescription('Enter the description of the role.')
			.setRequired(true)
		),

		async run (interaction) {
			//get role and desc input
			let role = await interaction.options.getRole('role');
			if(role.rawPosition == 0) return errors.noArg(interaction, 'You cannot add the @everyone role to the reaction roles message!'); //if the role is @everyone, return.
			let description = await interaction.options.getString('description');

			// Guild Reaction Roles
			let grr = await rr.findOne({where: {guild: interaction.guild.id}});
			if(!grr){ //if no DB exists, create one and set up the message to house the buttons.
				let m = await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle('Reaction Roles')]});
				grr = new rr({guild: interaction.guild.id, message: m.id, roles: [{id: role.id, description: description}]});

			} else { //if DB exists, add the role to the DB
				//cannot have more than 25 roles due to buttons. (5 rows of 5 buttons)
				if(grr.roles && grr.roles.size == 25) return errors.noArg(interaction, 'There is a limit of **25** roles per guild due to the current implementation of this system. Expect this to change in the future!', 'Reached button limit!');
				grr.roles.forEach(r => { //check if the role already exists.
					if(r.id == role.id) return errors.noArg(interaction, 'That role already exists!')
				});
				grr.roles = [...grr.roles, {id: role.id, description: description}] //.push() does not work.
				//must be done like this so the DB can detect the update. 
			}
			await grr.save();

			//edit message
			await rrEditMessage(interaction);

			//reply to interaction to show success.
			interaction.editReply({content: `${role} has been added into the reaction roles message!`})

		}
}
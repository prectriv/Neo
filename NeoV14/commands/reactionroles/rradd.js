const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const {rr} = require('../../libs/db.js');
const config = require('../../jsons/config.json');
const errors = require('../../utils/errors.js');

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
			let desc = await interaction.options.getString('description');

			// Guild Reaction Roles
			let grr = await rr.findOne({where: {guild: interaction.guild.id}});
			if(!grr){ //if no DB exists, create one and set up the message to house the buttons.
				let m = await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle('Reaction Roles')]});
				grr = new rr({guild: interaction.guild.id, message: m.id, roles: [{id: role.id, name: role.name, desc: desc}]});
			} else { //if DB exists, add the role to the DB
				//cannot have more than 25 roles due to buttons. (5 rows of 5 buttons)
				if(grr.roles && grr.roles.size == 25) return errors.noArg(interaction, 'There is a limit of **25** roles per guild due to the current implementation of this system. Expect this to change in the future!', 'Reached button limit!');
				grr.roles.forEach(r => { //check if the role already exists.
					if(r.id == role.id) return errors.noArg(interaction, 'That role already exists!')
				});
				grr.roles = [...grr.roles, {id: role.id, name: role.name, desc: desc}] //.push() does not work.
				//must be done like this so the DB can detect the update. 
			}
			await grr.save();

			//Once the roles have all been added, manage the message.
			await rr.findOne({where: {guild: interaction.guild.id}}).then(async grr => {
				let descriptionBuilder = [];
				for(let i = 0; i < grr.roles.length; i++) {//for each role in the DB, add it to the description.
					descriptionBuilder.push(`${i + 1}) <@&${grr.roles[i].id}> - ${grr.roles[i].desc}`);
				}
				
				descriptionBuilder = descriptionBuilder.join("\n"); //join the description elements with newlines.

				let embed = new EmbedBuilder() // create embed with dybamically generated description.
					.setTitle('Reaction Roles')
					.setColor(config.color)
					.setDescription(descriptionBuilder)
					.setFooter({text: 'React to this message to get a role!'});
			
				let interactionRows = []
				//create buttons
				for(let i = 0; i < 5; i++) {//for each row up to five.
					let buttons = [];
					for(let j = 5*i; j < 5*(i+1); j++){ // 5 buttons per row, incrementing in 5s based on the row number.
						let role = grr.roles[j];
						if(!role) break;
						buttons.push( // create a button and add it to the array.
							new ButtonBuilder()
								.setCustomId(`RR_${interaction.guild.id}_${role.id}`)//how to determine the role id.
								.setLabel(`${role.name}`)
								.setStyle(ButtonStyle.Secondary)
						);
					}
					if(buttons.length == 0) break; //if there are no buttons, break.
					interactionRows.push(new ActionRowBuilder().addComponents(buttons)); //add the row to the rows list.
					if(buttons.length != 5) break; //if there are less than 5 buttons, break.
				}

				//fetch message
				let msg = await interaction.channel.messages.fetch(grr.message); 
					//edit message
					msg.edit({context: '', embeds: [embed], components: [...interactionRows]});

				//reply to interaction to show success.
				interaction.editReply({content: `${role} has been added into the reaction roles message!`})

			});

		}
}
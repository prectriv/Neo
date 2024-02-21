function capitalize(text) {
	if (typeof text !== 'string') return ''
	return text.charAt(0).toUpperCase() + text.slice(1)
}


const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../jsons/config.json');
const { rr } = require('../libs/gdb.js');

/**
 * Edits the message for the reaction roles.
 * @param {*} interaction the interaction that triggered the edit.
*/
async function rrEditMessage(interaction) {
	//Once the roles have all been added, manage the message.
	await rr.findOne({ where: { guild: interaction.guild.id } }).then(async grr => {
		if (!grr) return; //DB wasn't initalized
		let descriptionBuilder = [];
		// Replace this with a loop that goes over EVERY member in a guild and stores to an object counter containing every role name
		for (const role of grr.roles) {//for each role in the DB, add it to the description.
			let cache = await interaction.guild.roles.fetch(role.id);
			if (!cache) {
				//removes the role if it cant be found in the guild.
				grr.roles = grr.roles.filter(r => r.id != role.id);
				await grr.save();
				continue;
			}

			descriptionBuilder.push(`<@&${role.id}> - ${role.description}\n**Members: ${cache.members.size}**\n`); //add the role to the description.
		}
		descriptionBuilder = descriptionBuilder.join("\n"); //join the description elements with newlines.

		let embed = new EmbedBuilder() // create embed with dybamically generated description.
			.setTitle('Reaction Roles')
			.setColor(config.color)
			.setDescription(descriptionBuilder)
			.setFooter({ text: 'React to this message to get a role!' });

		let interactionRows = []
		//create buttons

		//TODO: Some sort of verbose handling for if above 25 entries. 
		//      Perhaps a second message would be created in DB..... needs complex refactorings.
		for (let i = 0; i < 5; i++) {//for each row up to five.
			let buttons = [];
			for (let j = 5 * i; j < 5 * (i + 1); j++) { // 5 buttons per row, incrementing in 5s based on the row number.
				let role = grr.roles[j];
				if (!role) break;
				try {
					role = await interaction.guild.roles.cache.get(grr.roles[j].id); //get the role from the DB.
				} catch (e) {
					console.error(e);
					grr.roles = grr.roles.filter(r => r.id != role.id);
					continue;
				}
				buttons.push( // create a button and add it to the array.
					new ButtonBuilder()
						.setCustomId(`RR_${interaction.guild.id}_${role.id}`)//how to determine the role id.
						.setLabel(`${role.name}`)
						.setStyle(ButtonStyle.Secondary)
				);
			}
			if (buttons.length == 0) break; //Means that there are no more buttons to add, so stop the loop.
			interactionRows.push(new ActionRowBuilder().addComponents(buttons)); //add the row to the rows list.
			if (buttons.length != 5) break; //Loop will automatically stop after 25, though if there isnt 5 buttons, 
			//it will stop early as that means it reached the end of the RRs
		}

		//fetch message
		let msg = await interaction.channel.messages.fetch(grr.message);
		//edit message
		msg.edit({ context: '', embeds: [embed], components: [...interactionRows] });
	});
}

module.exports = {
	capitalize,
	rrEditMessage
}
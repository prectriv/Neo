const {SlashCommandBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder}  = require('discord.js');
const { vcCreator } = require('../../libs/gdb');

module.exports = { 
	aliases: ['vcc'],
	ephemeral: true, 
	category: '', // category of the command. Will be used for the help command (currently a placeholder)
	data: new SlashCommandBuilder()
		.setName('vccreator')
		.setDescription('Initalizes the vcCreation System.'), 

		async run (interaction) { 
			let gvc = await vcCreator.findByPk(interaction.guild.id);
			if(!gvc) {
				return createVC(interaction);
			} else { //GVC exists, so prompts for reset or cancel
				let rButton = new ButtonBuilder()
					.setLabel('Reset')
					.setCustomId('reset')
					.setStyle(ButtonStyle.Danger);
				let cButton = new ButtonBuilder()
					.setLabel('Cancel')
					.setCustomId('cancel')
					.setStyle(ButtonStyle.Secondary);
				let row = new ActionRowBuilder().addComponents(rButton, cButton);

				await interaction.channel.send({content: `vcCreator already exists for this server...\nWould you like to reset the system?`, components: [row]}).then(msg => {
					let filter = i => i.user.id == interaction.user.id;
					let collector = interaction.channel.createMessageComponentCollector({filter, time: 15000});
					collector.on('collect', async i => {
						if(i.customId == 'reset') {
							//resetting
							try { await interaction.guild.channels.cache.get(gvc.channel).delete(); } catch (e) {}
							try { await interaction.guild.channels.cache.get(gvc.category).delete(); } catch (e) {}
							//also check guild vc array and delete all the vcs in it

							await gvc.destroy();
							await msg.delete();
							collector.stop();
							return createVC(interaction);
						} else if(i.customId == 'cancel') {
							await interaction.deleteReply();
							await msg.delete();
							collector.stop(); //TODO: add this to other methods for ram clearing. Forces 'end' event to fire early.
							return;
						}
					});
					collector.on('end', async collected => {
						await msg.delete().catch(e => {});
						await interaction.deleteReply().catch(e => {});
					});
				});
			}
			/*
				Creates the database after checking if one already exists. If one does exist, prompts for user to either delete or reset the db 
					deletes the db if user chooses to delete it.
					deletes the db and then runs as normal the db if user chooses to reset it.

				When deleting the db: delete the category for this vc manipulation, and delete all the vcs in it.
					could run into issues if the category is deleted with manually created channels by server admins.
			*/
		}
}

async function createVC(interaction) {
	let gvc = await vcCreator.create({guild: interaction.guild.id});

	let category = await interaction.guild.channels.create({name: 'vcCreator', type: ChannelType.GuildCategory});
		gvc.category = category.id;

	
	let vc = await interaction.guild.channels.create({name: 'Join Me', type: ChannelType.GuildVoice});
		vc.setParent(gvc.category);
		gvc.channel = vc.id;
	
	await gvc.save();

	gvc = await vcCreator.findByPk(interaction.guild.id);
	interaction.editReply({content: `vcCreator initalized for this server\nJoin <#${gvc.channel}> to see how it works`});
}
const { SlashCommandBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { vcCreator } = require('../../libs/gdb');
const config = require('../../jsons/config.json');
const interactionCreate = require('../../events/interactionCreate');

/*
	Creates the database after checking if one already exists. If one does exist, prompts for user to either delete or reset the db 
		deletes the db if user chooses to delete it.
		deletes the db and then runs as normal the db if user chooses to reset it.

	When deleting the db: delete the category for this vc manipulation, and delete all the vcs in it.
		could run into issues if the category is deleted with manually created channels by server admins.
*/
module.exports = {
	aliases: ['vcc'],
	ephemeral: true,
	category: '', // category of the command. Will be used for the help command (currently a placeholder)
	data: new SlashCommandBuilder()
		.setName('vccreator')
		.setDescription('Initalizes the system or prompts for system reset or deletion.'),

	async run(interaction) {
		let gvc = await vcCreator.findByPk(interaction.guild.id);
		if (!gvc) {
			return createVC(interaction);
		} else { //GVC exists, so prompts for reset or cancel
			let rButton = new ButtonBuilder()
				.setLabel('Reset')
				.setCustomId('reset')
				.setStyle(ButtonStyle.Primary);

			let vcButton = new ButtonBuilder()
				.setLabel('Clean Temp VCs')
				.setCustomId('clean')
				.setStyle(ButtonStyle.Danger);

			let dButton = new ButtonBuilder()
				.setLabel('Delete System')
				.setCustomId('delete')
				.setStyle(ButtonStyle.Danger);

			let cButton = new ButtonBuilder()
				.setLabel('Cancel')
				.setCustomId('cancel')
				.setStyle(ButtonStyle.Secondary);

			let row = new ActionRowBuilder().addComponents(rButton, vcButton, dButton, cButton);

			let embed = new EmbedBuilder()
				.setColor(config.warnHex)
				.setTitle('vcCreator already exists for this server...')
				.setDescription('What would you like to do?');

			await interaction.channel.send({ embeds: [embed], components: [row] }).then(msg => {
				let filter = i => i.user.id == interaction.user.id;
				let collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
				collector.on('collect', async i => {
					switch (i.customId) {
						case 'reset':
							msg.edit({ embeds: [embed.setTitle("Resetting VCC System").setDescription('please wait...').setColor(config.negHex)] });
							await cleanDB(interaction, gvc);
							createVC(interaction);
							collector.stop();
							break;

						case 'clean':
							msg.edit({ embeds: [embed.setTitle("Cleaning spawned VCs").setDescription('please wait...').setColor(config.posHex)] });
							await cleanTempVcs(interaction, gvc);
							await interaction.editReply({ content: "Cleaned the Temp VCs" }).catch(e => { });
							collector.stop();
							break;

						case 'delete':
							msg.edit({ embeds: [embed.setTitle("Deleting VCC System").setDescription('please wait...').setColor(config.negHex)] });
							await cleanDB(interaction, gvc);
							await interaction.editReply({ content: "Deleted the VC Creation system" }).catch(e => { });
							collector.stop();
							break;

						case 'cancel':
							interaction.editReply({ content: "Canceled", components: [] })
							collector.stop();
							break;
					}
				});

				collector.on('end', collected => {
					if (collected.size == 0) interaction.editReply({ content: 'Timed out.', components: [] });
					msg.delete().catch(e => { });
				});
			});
		}
	}
}

async function cleanTempVcs(interaction, gvc) {
	for (const element of gvc.spawnedVCs) { // delete all of the vcs that were spawned by this system.
		try { await interaction.guild.channels.cache.get(element).delete(); } catch (e) { }
	}
}

async function cleanDB(interaction, gvc) {
	await cleanTempVcs(interaction, gvc);
	try { await interaction.guild.channels.cache.get(gvc.channel).delete(); } catch (e) { }
	try { await interaction.guild.channels.cache.get(gvc.category).delete(); } catch (e) { }

	await gvc.destroy();
}

async function createVC(interaction) {
	let gvc = await vcCreator.create({ guild: interaction.guild.id });

	let category = await interaction.guild.channels.create({ name: 'Temp VCs', type: ChannelType.GuildCategory });
	gvc.category = category.id;

	let vc = await interaction.guild.channels.create({ name: 'Join Me', type: ChannelType.GuildVoice, parent: category.id });
	gvc.channel = vc.id;

	await gvc.save();

	gvc = await vcCreator.findByPk(interaction.guild.id);
	interaction.editReply({ content: `vcCreator initalized for this server!\nConnect to <#${gvc.channel}> to create a new temp VCs!` });
}
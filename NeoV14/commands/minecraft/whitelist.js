const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const fs = require("fs")
const config = require('../../jsons/config.json')
const errors = require('../../utils/errors.js');
const { unverified, verified, blacklist } = require('../../libs/wldb.js')
const { capitalize } = require(`../../utils/functions.js`)
const RCON = require('rcon')

const { fetchMc, fetchMcUUID } = require("../../utils/mcUtils.js")

const ruleChannel = "697499957799682061"
const pass = process.env.RCONPASS
const rconip = 'localhost'
const rconport = 25575

module.exports = {
	aliases: ['wl'],
	category: '',
	//local: 'mc server guild id'
	data: new SlashCommandBuilder()
		.setName('whitelist')
		.setDescription('Queues a user to be veriied for whitelisting.')
		.addStringOption(option => option.setName('username')
			.setDescription('Enter a valid Minecraft Username')
			.setRequired(true)
		),

	async run(interaction) {
		if (interaction.guild.id != config.myServer) return errors.noArg(interaction, "This can only be used in Xaviers discord.", "Incorrect server.")

		//This code effectively pings the server to check if the RCON system is working.
		const conn = new RCON(rconip, rconport, pass);
		conn.connect()
		conn.on('auth', async () => {
			conn.disconnect()
		}).on('error', (err) => { // only happens if the server is down or the password is wrong.
			return errors.noArg(interaction, "The server RCON is currently down, please try again later.", "Server Down!")
		});

		//check if user is blacklisted
		const blUser = (await blacklist.findByPk(interaction.user.id))
		if (blUser != null) return errors.noArg(interaction, "You are blacklisted from the server.", "Blacklisted!")

		const vUser = (await verified.findByPk(interaction.user.id)); //TODO: change this to check if user is already verified, and prompt them to just change their username with a differnet ocmmand perhaps.
		if (vUser != null) return errors.noArg(interaction, "For now, you are unable to change your own username. Contact an admin.", "Already whitelisted!")
		//check if user is already whitelisted
		let unvUser = (await unverified.findByPk(interaction.user.id));
		if (unvUser != null) return errors.noArg(interaction, "You are already in the queue.", "Already queued!")


		// no whitelist found for user, whitelists their given username, fcn handles all errors.
		const playerData = await fetchMc(interaction, interaction.options.getString('username'));
		//TODO: verbose handling must be done here. Also check if username has already been whitelisted. 
		//TODO: figure out some way to handle whitelisting better in general with less api calls.

		let embed = new EmbedBuilder()
			.setTitle(`Would you like to be whitelisted under the username: **${playerData.name}**?`)
			.setColor(config.warnHex)
			.setDescription(`UUID: \`${playerData.uuid}\`\n**Note:** by accepting this, you agree to follow all of the rules in <#${ruleChannel}>.`); // the id in this is the network-info channel ID.

		let buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('accept_wl')
					.setLabel(`✅ | Accept`)
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('deny_wl')
					.setLabel(`❌ | Deny`)
					.setStyle(ButtonStyle.Secondary)
			);

		let denyEmbed = new EmbedBuilder()
			.setTitle('Canceled whitelisting!')
			.setColor(config.negHex)
			.setDescription(`You have not been queued.`);

		interaction.editReply({ embeds: [embed], components: [buttons] })
		let filter = i => i.user.id === interaction.user.id
		let collector = interaction.channel.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 /* 5min */ });

		// needs to be defined as such so i can do collector.off(...)
		let lamda = collected => interaction.editReply({ embeds: [denyEmbed], components: [] })

		collector.on('collect', async i => {
			collector.off('end', lamda) // prevents double editing of interaction.

			if (i.customId == 'accept_wl') {
				//await interaction.channel.send("<@&697499237151408229>")
				let acceptEmbed = new EmbedBuilder()
					.setTitle('Queued Successfully!')
					.setColor(config.posHex)
					.setDescription(`You have been queued with the username: **${playerData.name}**!\nPlease wait for an admin to verify you.`);

				let m = (await interaction.editReply({ embeds: [acceptEmbed], components: [] }));
				var unvUser = new unverified({ id: interaction.user.id });

				unvUser.wlMsg = m.id
				unvUser.uuid = playerData.uuid

				//send embed to verification channel and have admins allow or blacklist
				let verifyEmbed = new EmbedBuilder()
					.setTitle(`${capitalize(interaction.user.displayName)} is queued.`)
					.setColor(config.warnHex)
					.setDescription(`<@${interaction.user.id}> is awaiting waitlisting under the name: \n**${playerData.name} | \`${playerData.uuid}\`**`);

				let verifyButtons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(`WL_VERIFY_${interaction.user.id}`) // TODO: this button needs to, when presed, display errors to admins much like the more verbose handling mentioned before.
							.setLabel(`✅ | Accept`)
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId(`WL_BLACKLIST_${interaction.user.id}`)
							.setLabel(`❌ | Deny`)
							.setStyle(ButtonStyle.Danger)
					);

				interaction.guild.channels.cache.get('1154775798797053972').send({ embeds: [verifyEmbed], components: [verifyButtons] });
				await unvUser.save()


			} else interaction.editReply({ embeds: [denyEmbed], components: [] })

		});
		collector.on('end', lamda);
	}
}
const WLPath = /*"../*/`${__dirname}/../../Bungee4/lobby/whitelist.json`
const whitelist = require(WLPath)
const minersRoleID = "1075267520644263956"
const {EmbedBuilder} = require('discord.js')
const config = require('../jsons/config.json')

const {unverified, verified, blacklist} = require('../libs/wldb.js')
const {rr} = require('../libs/rrdb.js')

const fs = require("fs")
const { rrEditMessage } = require('../utils/functions.js')

module.exports = { // TODO: break this out into multiple files for readability
	name: 'interactionCreate',
	async run (interaction, user, token) {
		//console.log(interaction.applicationId) this is way to get client id
		if (interaction.isButton() && interaction.customId.startsWith("WL")) {//whitelisting pipeline 
			let id = interaction.customId.split("_")[2]
			//fetch from db
			let unvUser = (await unverified.findByPk(id))
			if(!unvUser) return;

			//whitelist
			if(interaction.customId.includes("VERIFY")){
				//Add the role!
				interaction.member.roles.add(minersRoleID)
				//push data to wl and DB
				whitelist.push(unvUser.mc)
					fs.writeFileSync(WLPath, JSON.stringify(whitelist), (err) => {if(err) return console.log(err)})
				
				let embed = new EmbedBuilder()
					.setTitle(`Whitelisted user:`)
					.setColor(config.posHex)
					.setDescription(`<@${id}> has been waitlisted under the account: \n**${unvUser.mc.name} | \`${unvUser.mc.uuid}\`**`); 

				interaction.reply({embeds: [embed]});
				interaction.message.delete()
				
				try {
					//fetch origonal message stored in the db
					let wl_channel = await interaction.guild.channels.cache.get('755232058049298465')
					let wl_msg = await wl_channel.messages.fetch(unvUser.wl_msg)
					wl_msg.delete()

					let acceptEmbed = new EmbedBuilder()
						.setTitle('Whitelisted Successfully!')
						.setColor(config.posHex)
						.setDescription(`You have been whitelisted with the username: **${unvUser.mc.name}**!`);

					wl_channel.send({ content: `<@${id}>`, embeds: [acceptEmbed], components: []});
				} catch(e) {return console.log(e)}
				//make verified
				let vUser = new verified({id: id, uuid: unvUser.mc.uuid})
				await vUser.save();
				//delete unv
				await unverified.destroy({where: {id: id}})
 
			} else { //blacklist
				try {
					let wl_msg = await wl_channel.messages.fetch(unvUser.wl_msg)
					wl_msg.delete()
				} catch {}
				
				try {
					//fetch origonal message stored in the db
					let wl_channel = await interaction.guild.channels.cache.get('755232058049298465')
					let wl_msg = await wl_channel.messages.fetch(unvUser.wl_msg)

					let blacklistEmbed = new EmbedBuilder()
						.setTitle('Blacklisted')
						.setColor(config.negHex)
						.setDescription(`<@${id}> has been blacklisted and will not be able able to whitelist again.\nPlease contact an admin if you believe this is a mistake.`);

					wl_msg.edit({embeds: [blacklistEmbed], components: []});
					interaction.reply({embeds: [blacklistEmbed.setDescription(`<@${id}> has been blacklisted and will not be able able to whitelist again.`)]});
					interaction.message.delete();

					//make blacklist
					let blUser = await new blacklist({id: id});
					blUser.save()

					//delete unv user.
					await unverified.destroy({where: {id: id}})

				} catch {};
			}
		} else if (interaction.isButton() && interaction.customId.startsWith("RR")) {//reaction roles pipeline
			let roleID = interaction.customId.split("_")[2] // ["RR", guildID, roleID]
			let rrGuild = (await rr.findByPk(interaction.guild.id)) //fetch from db
			if(!rrGuild) return;

			//Find the role, then attempt to add it.
			let role = interaction.guild.roles.cache.get(roleID);
				if(!role) return rrEditMessage(interaction); //role doesnt exist to update msg

			let embed = new EmbedBuilder()
				if(interaction.member.roles.cache.has(roleID)) { //if the user has the role, remove it.
					await interaction.member.roles.remove(roleID) //remove the role
					embed.setColor(config.negHex).setDescription(`${role} has been removed.`);
				} else { //if the user does not have the role, add it.
					await interaction.member.roles.add(roleID) //add the rolee
					embed.setColor(config.posHex).setDescription(`${role} has been added.`);
				}

			await interaction.reply({embeds: [embed], ephemeral: true}); //reply to interaction to show success.
			await rrEditMessage(interaction); //edit message

		} else if(interaction.isChatInputCommand()) {// shash command input
			const command = interaction.client.commands.get(interaction.commandName) ?? interaction.client.commands.get(interaction.client.aliases.get(interaction.commandName))

			if(!command) return console.error('invalid interaction \n' + interaction)

			await interaction.deferReply({ephemeral: command.ephemeral});
			if(command.category == 'music') return require('../utils/musicFuncs.js').musicInit(interaction, command);
		
			try {
				await command.run(interaction);
			} catch (error) {
				console.error(error);
				await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	}
}
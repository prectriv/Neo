const {createAudioPlayer} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const errors = require('../utils/errors.js');
const {URL} = require('url');
const Discord = require('discord.js')
const config = require('../jsons/config.json')

const queue = new Map();

module.exports = {
	//initalize music functions and/or where the bot goes to start other commands.
	async musicInit (interaction, command) {
		const queueTemplate = { // perhaps dumb this down since its majorly reduntant in most cases. only really need the first few.
			vc: null,
			tc: null,
			connection: null,
			songNumb: 0,
			songs: [],
			loop: false,
			repeat: false,  
			playing: true,
			player: undefined,
			playMsg: null,
			listeners: false,
			leaveMsg: null,
			leaveMsgTimeout: null,
			first: false //speifically this - kinda useless and really was only to cover edgecases of multiple people trying to start a queue at the same time. 
						 //Perhaps instead just change how this works by detecting when listeners exist (or just use boolean...)
		}

		if(!interaction.member.voice.channel) return errors.noArg(interaction, 'You must be in a voice channel to execute this command!', false)
		let serverQueue = await queue.get(interaction.guild.id)

		if(!serverQueue){
			//if not play (or pl), return as the other commands rely on bot being initalized. could be worked around in future.
			if(command.data.name != 'play') return errors.noArg(interaction, 'Please intilize the music functions first by using `/play`.')
			queueTemplate.tc = interaction.channel.id
			queueTemplate.vc = interaction.member.voice.channel.id
			queueTemplate.player = createAudioPlayer()
			queue.set(interaction.guild.id, queueTemplate)
		} else {
			// Figure out better way to deal with this that doesnt involve a hard denial if serverQueue exists. 
			// perhaps make it so it will delete the server queue after a failed /play.
			// if(!serverQueue.first) return errors.noArg(interaction, 'Please wait for the music functions to finish initalizing.')
		}
		command.run(interaction, queue)

	},

	async urlHandle (interaction, input){
		var vid = null, pid = null, index = null;
		
		try { vid = ytdl.getURLVideoID(input) } catch {}
		try { pid = await ytpl.getPlaylistID(input) } catch {}
	
		// if plalist id, check for index value. This will determine song played first
		if (pid) try { index = new URL(input).searchParams.get("index") } catch {}
		let data = {vid: vid, pid: pid, index: --index}

		if(!data.vid && !data.pid) return errors.noArg(interaction, 'Please double check this URLs formatting if it is a YouTube link, or use a different bot if you desire a different media platform (for now...)', 'Error: Invalid URL' )
		return data


		/* url formats: + = works
		https://youtu.be/IfeGUIPeScg?list=PLAzrFsZaBYM9cqsZM7NVZ-iT42wLXFLAb +
		https://youtu.be/IfeGUIPeScg +
		https://music.youtube.com/watch?v=pHSjs7RjZXE&feature=share +
		https://youtube.com/watch?v=IfeGUIPeScg&list=PLAzrFsZaBYM9cqsZM7NVZ-iT42wLXFLAb&index=1 + 
		https://youtube.com/watch?v=IfeGUIPeScg +
		https://music.youtube.com/playlist?list=PLsDte62K7yokiJfUtHhrB6dczamUehJH6&feature=share +*/

	},
	
	async search (interaction, query) {
		const filters = await ytsr.getFilters(query);
		const additionalFilters = filters.get("Type").get("Video"); // ensures we only get videos. 
		//This can be used as a means to get playlist searches as well - future addition perhaps. Or have search cmd display what kind of result it is.
		const raw = await ytsr(additionalFilters.url, {limit: 10}); // make this configurable.
		if(raw.items.length == 0) return errors.noArg(interaction, `No results found for your input: \n\`${query}\``, 'Search failed');

		let results = [];
		
		//needs to loop through to find actual videos, not 'shelf' which is for shorts.
		for(var i of raw.items) {
			if(i.type == 'shelf') continue;
			results.push(i)
			if(results.length == 4) break; // after 4 proper results 
		}

		//create embed for display. Both this and selectionmenu have an edgecase crash where if not 4 results, will crash. 
		let embed = new Discord.EmbedBuilder()
			.setTitle('🔎 Song Selection:')
			.setColor(config.color)
			.setDescription(`
1️⃣ - [${results[0].title.slice(0,60)}](${results[0].url}) [${results[0].duration}]
2️⃣ - [${results[1].title.slice(0,60)}](${results[1].url}) [${results[1].duration}]
3️⃣ - [${results[2].title.slice(0,60)}](${results[2].url}) [${results[2].duration}]
4️⃣ - [${results[3].title.slice(0,60)}](${results[3].url}) [${results[3].duration}]`)
			.setFooter({text: `Please select your desired 🔎 result within 25 seconds`,iconURL:interaction.user.displayAvatarURL()});

		//interactable dropdown menu for selecting song as opposed to buttons. Buttons are better in this case (cosmetically), though limites to 5 in row.
		/*const select = new Discord.StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new Discord.StringSelectMenuOptionBuilder()
					.setLabel(`${results[0].title}`)
					.setValue("0"),
				new Discord.StringSelectMenuOptionBuilder()
					.setLabel(`${results[1].title}`)
					.setDescription('The Fire-type Lizard Pokémon.')
					.setValue("1"),
				new Discord.StringSelectMenuOptionBuilder()
					.setLabel(`${results[2].title}`)
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue("2"),
				new Discord.StringSelectMenuOptionBuilder()
					.setLabel(`${results[3].title}`)
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue("3"),
				new Discord.StringSelectMenuOptionBuilder()
					.setLabel(`${results[4].title}`)
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue("4")
			);
			
			const row = new Discord.ActionRowBuilder()
			.addComponents(select);*/

		//buttons corresponding to the order of 
		let buttons = new Discord.ActionRowBuilder()
			.addComponents(
				new Discord.ButtonBuilder()
					.setCustomId("0")
					.setEmoji('1️⃣')
					.setStyle(Discord.ButtonStyle.Secondary),
				new Discord.ButtonBuilder()
					.setCustomId("1")
					.setEmoji('2️⃣')
					.setStyle(Discord.ButtonStyle.Secondary),
				new Discord.ButtonBuilder()
					.setCustomId("2")
					.setEmoji('3️⃣')
					.setStyle(Discord.ButtonStyle.Secondary),
				new Discord.ButtonBuilder()
					.setCustomId("3")
					.setEmoji('4️⃣')
					.setStyle(Discord.ButtonStyle.Secondary),
				new Discord.ButtonBuilder()
					.setCustomId("-1")
					.setEmoji('❌')
					.setStyle(Discord.ButtonStyle.Danger)
				);

		interaction.editReply({embeds: [embed], components: [buttons]})
		const filter = i => i.user.id === interaction.user.id
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 2*60*1000 /* 2min */ });

return

		message.channel.send({embeds: [embed]}).then(m => {
			m.react('1️⃣').catch(() => {return})
			m.react('2️⃣').catch(() => {return})
			m.react('3️⃣').catch(() => {return})
			m.react('4️⃣').catch(() => {return})
			m.react('5️⃣').catch(() => {return})
			m.react('❌').catch(() => {return})

			const filter = (reaction, user) => (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '3️⃣' || reaction.emoji.name == '❌') && user.id === message.author.id
				m.awaitReactions({filter, max: 1, time: 25000 })
					.then(collected => {
						m.reactions.removeAll().catch(() => {return})
						let embed = new Discord.MessageEmbed()
							.setTitle('🎵 Song Selected:')
							.setColor(config.posHex);

							switch (collected.first().emoji.name) {
								case '❌':
									embed.setTitle('🔎 Song Selection: Canceled!')
										.setColor(config.negHex)
										.setDescription('The process has been canceled.')

									return m.edit({embeds: [embed]}).catch(() => {});

								case '1️⃣':
									embed.setDescription(`[${results[0].title}](${results[0].url}) [${results[0].duration}]`)
									embed.setThumbnail(results[0].thumbnail)
										m.edit({embeds: [embed]}).catch(() => {}).then(setTimeout(() => m.delete().catch(() => {}), 5000))

									return resolve(results[0])

								case '2️⃣':
									embed.setDescription(`[${results[1].title}](${results[1].url}) [${results[1].duration}]`)
									embed.setThumbnail(results[1].thumbnail)
										m.edit({embeds: [embed]}).catch(() => {}).then(setTimeout(() => m.delete().catch(() => {}), 5000))

									return resolve(results[1])
								default:
									//aka case '3️⃣'
									embed.setDescription(`[${results[2].title}](${results[2].url}) [${results[2].duration}]`)
									embed.setThumbnail(results[2].thumbnail)
										m.edit({embeds: [embed]}).catch(() => {}).then(setTimeout(() => m.delete().catch(() => {}), 5000))

									return resolve(results[2])
							}

					}).catch(() => {
						m.reactions.removeAll().catch(() => {return})
						embed.setTitle('🔎 Song Selection: Canceled!')
								.setColor(config.negHex)
								.setDescription('No reaction recieved after 25 seconds, the process has been canceled.')
						return m.edit({embeds: [embed]}).catch(() => {return});
					});
			});
	
	}
}
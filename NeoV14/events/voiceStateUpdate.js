const { vcCreator } = require("../libs/gdb");
const { ChannelType } = require('discord.js');
const TIMEOUT_TIME = 15000; //300000 = 5min

//TODO: although it would be cool to change the name of a spawned channel to a counting down timer until deletion, 
//it would be hard. Still, try implementing it.

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run(oldState, newState, token) {
		let gvc = await vcCreator.findByPk(newState.guild.id);
		if (!gvc) return;

		if (newState.channelId == oldState.channelId) return; //means user deafened or muted

		if (newState.channelId != oldState.channelId && oldState.channelId != null) { // user moved/left a channel
			let vcObject = gvc.spawnedVCs.filter(vc => vc == oldState.channelId); // check if the channel is part of the vccreator system
			if (vcObject[0] != undefined) { // I love filters <3
				//If the channel is vc
				let channel = oldState.guild.channels.cache.get(oldState.channelId);

				if (channel.members.size == 0) { // If no one is in the channel, delete it after 5 minutes of inactivity

					setTimeout(async () => { // this timeout is checked and removed in next elseif block when fired
						let gvc = await vcCreator.findByPk(newState.guild.id);
						channel = await oldState.guild.channels.cache.get(channel.id);
						if (channel && channel.members.size == 0) {
							try { channel.delete(); } catch { };
							let temp = gvc.spawnedVCs.filter(vc => vc != oldState.channelId);
							gvc.spawnedVCs = [...temp];
							// if(temp.length == 0) gvc.spawnedVCs = [];
							// else gvc.spawnedVCs = [...temp];

							await gvc.save();
						}
					}, TIMEOUT_TIME);

					let temp = gvc.spawnedVCs.filter(vc => vc != oldState.channelId);
					gvc.spawnedVCs = [...temp, vcObject[0]];
					await gvc.save();
				}
			}
		}

		//if the user joined the vccreator channel, create a new vc for them
		if (newState.channelId == gvc.channel) {
			// TODO: add some preventative logic to stop users from creating too many channels. Limit of 3 per user sounds good
			let vc = await newState.guild.channels.create({ name: 'Unnamed VC', type: ChannelType.GuildVoice, parent: gvc.category });

			vc.send(`<@${newState.id}>, please specify a name for this vc:`).then(msg => { // ask for a name in the VC text channel
				const filter = m => m.author.id == newState.id;
				let collector = vc.createMessageCollector({ filter, time: 10000 }); //1min timer
				collector.on('collect', async m => {
					let name = `Temp: ${m.content}`
					vc.setName(name);
					m.reply(`VC name set to: \`${name}\`!`);
					collector.stop();
				});
			});

			gvc.spawnedVCs = [...gvc.spawnedVCs, vc.id];
			await gvc.save();

			try { newState.member.voice.setChannel(vc) } catch { };
		}
	}
}
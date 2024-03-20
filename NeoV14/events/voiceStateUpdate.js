const { vcCreator, guildPref } = require("../libs/gdb");
const { ChannelType } = require('discord.js');
const TIMEOUT_TIME = 300000; //300000 = 5min

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run(oldState, newState, token) {
		//TODO: once the music stuff works again, i will need to add a check to see if the user is in a music channel and if so, allow deletion if count == 1
		//		Will need to ensure that both music fucntionality and VCC functionality work together.
		let gvc = await vcCreator.findByPk(newState.guild.id);
		if (!gvc) return;

		if (newState.channelId == oldState.channelId) return; //means user deafened or muted

		if (newState.channelId != oldState.channelId && oldState.channelId != null) { // user moved/left a channel
			let vcObject = gvc.spawnedVCs.filter(vc => vc == oldState.channelId); // check if the channel is part of the vccreator system
			if (vcObject[0] != undefined) { // if objecct 0 exists, then the channel is part of the vccreator system
				let channel = oldState.guild.channels.cache.get(oldState.channelId);
				if (!channel) return; //means the channel was deleted

				if (channel.members.size == 0) { // If no one is in the channel, delete it after 5 minutes of inactivity
					setTimeout(async () => { // this timeout is checked and removed in next elseif block when fired
						let gvc = await vcCreator.findByPk(newState.guild.id);
						channel = await oldState.guild.channels.cache.get(channel.id);
						if (channel && channel.members.size == 0) {
							try { channel.delete(); } catch { };
							let temp = gvc.spawnedVCs.filter(vc => vc != oldState.channelId);
							gvc.spawnedVCs = [...temp];

							await gvc.save();
						}
					}, TIMEOUT_TIME);

					let temp = gvc.spawnedVCs.filter(vc => vc != oldState.channelId);
					gvc.spawnedVCs = [...temp, vcObject[0]];
					await gvc.save();
				}
			}
		}


		if (newState.channelId == gvc.channel) {// if the user joined the vccreator channel, create a new vc for them
			// TODO: add some preventative logic to stop too many channels from being created.
			// once the server preferences system is back online, will add a check to see if the server has a max limit set. 
			// Set the default for this value to be 10 or so, and a hardcoded limit of 25 to not overload the bot..
			let gPref = await guildPref.findOrCreate({ where: { guild: newState.guild.id } });
			if (gPref[0].vccLimit <= gvc.spawnedVCs.length) {
				newState.member.send("You have reached the limit of temp VCs for this server. Please wait for a VC to be deleted before creating a new one.");
				return;
			}
			let vc = await newState.guild.channels.create({ name: 'Temp VC', type: ChannelType.GuildVoice, parent: gvc.category });

			vc.send(`<@${newState.id}>, use the \`/rename\` command to change this VCs name!`);

			gvc.spawnedVCs = [...gvc.spawnedVCs, vc.id];
			await gvc.save();

			try { newState.member.voice.setChannel(vc) } catch { };
		}
	}
}
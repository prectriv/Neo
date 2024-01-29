const { vcCreator } = require("../libs/gdb");
const { ChannelType } = require('discord.js');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run (oldState, newState, token) {
		let gvc = await vcCreator.findByPk(newState.guild.id);
		if(!gvc) return;

		if(newState.channelId == oldState.channelId) return; //means user deafened or muted
		if(newState.channelId == gvc.channelID) return; //means user joined the channel
		if(newState.channelId == null) return; //means user left the channel

		//let channel = newState.guild.channels.cache.get(gvc.channel);

		//if joined guildvc channel, create a new vc and move them.
		if(gvc && newState.channelId != null){ 
			if(newState.channelId == gvc.channel){ //
				let vc = await newState.guild.channels.create({name: 'testy', type: ChannelType.GuildVoice});
					try { vc.setParent(gvc.category) } catch (e) { /* recreate catrgory and move? alternatively delete the vc */};
					gvc.spawnedVCs = gvc.spawnedVCs.push(vc.id);
					await gvc.save();

					newState.member.voice.setChannel(vc);
			}
		}
		//if all users leave a channel that is a spawned vc, kill the channel and remove it from the spawnedVCs array

		// if(gvc && newState.channelId != null){ 
		// 	if(newState.channelId == gvc.channel){ //
		// 		if(channel.members.size == 0){
		// 			channel.delete()
		// 		}
		// 	}
		// }
		// if (newState.channelId === null) {
		//     newState.guild.me.voice.setDeaf(false)
		//     newState.guild.me.voice.setMute(false)
		// }
	}
}
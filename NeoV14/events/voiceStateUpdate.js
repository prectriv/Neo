const { vcCreator } = require("../libs/gdb");
const { ChannelType } = require('discord.js');
const TIMEOUT_TIME = 5000; //300000 = 5min

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run (oldState, newState, token) {
		let gvc = await vcCreator.findByPk(newState.guild.id);
		if(!gvc) return;

		if(newState.channelId == oldState.channelId) return; //means user deafened or muted
	
		if(newState.channelId != oldState.channelId && oldState.channelId != null) { //user left the channel, check if its part of the vccreator system
			let vcObject = gvc.spawnedVCs.filter(vc => vc == oldState.channelId);
			if(vcObject[0] != undefined){ // I love filters <3
				//If the channel is vc
				let channel = oldState.guild.channels.cache.get(oldState.channelId);

				if(channel.members.size == 0){ // If no one is in the channel, delete it after 5 minutes of inactivity
					
					setTimeout(async () => { // this timeout is checked and removed in next elseif block when fired
						let gvc = await vcCreator.findByPk(newState.guild.id);
						channel = oldState.guild.channels.cache.get(channel.id);
						if(channel && channel.members.size == 0) {
							try { channel.delete(); } catch {};
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
		if(newState.channelId == gvc.channel){
			console.log('User joined the vccreator channel');			

			// TODO: check if the category exists still. If not, reset the entire system/ask user to reset. 
			// Alternatively, check to see how this functions without the category, and if it errors/crashes then deal with it. if not, ignore.
			// try { vc.setParent(gvc.category) } catch (e) { /* recreate catrgory and move? alternatively delete the vc */};

			let vc = await newState.guild.channels.create({name: 'testy', type: ChannelType.GuildVoice, parent: gvc.category});
			// TODO: figure out how to uniquely identify the name of the channel. Remove it from being called testy. maybe use users name?
			// Then figure out logic for users changing the name. Maybe a DM or a ping in the VC chat
			gvc.spawnedVCs = [...gvc.spawnedVCs, vc.id];
			await gvc.save();

			try { newState.member.voice.setChannel(vc) } catch {};
		}
	}
}
const { vcCreator } = require("../libs/gdb");
const { ChannelType } = require('discord.js');
const TIMEOUT_TIME = 15000; //300000 = 5min

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run (oldState, newState, token) {
		let gvc = await vcCreator.findByPk(newState.guild.id);
		if(!gvc) return;
		//console.log(gvc.spawnedVCs.filter(vc => vc.id == newState.channelId))

		if(newState.channelId == oldState.channelId) return; //means user deafened or muted
		if(newState.channelId != oldState.channelId) { //user left the channel, check if its part of the vccreator system
			let vcObject = gvc.spawnedVCs.filter(vc => vc.id == oldState.channelId);
			if(vcObject[0] != undefined){ // I love filters <3
				console.log('User left a spawned vc channel');
				let channel = oldState.guild.channels.cache.get(oldState.channelId);

				if(channel.members.size == 0){ // If no one is in the channel, delete it after 5 minutes of inactivity
					vcObject.timeoutid = setTimeout(() => { // this timeout is checked and removed in next elseif block when fired
						if(channel.members.size == 0) {
							try { channel.delete(); } catch {};
							let temp = gvc.spawnedVCs.filter(vc => vc.id != oldState.channelId);
							if(temp.length == 0) gvc.spawnedVCs = [];
							else gvc.spawnedVCs = [...temp];
							gvc.save();
						}
					}, TIMEOUT_TIME);

					await gvc.save();
				}
			}
		} else if(JSON.stringify(gvc.spawnedVCs.filter(vc => vc.id == newState.channelId)) != '[]'){ //means that the user joined a channel that is a spawned vc
			console.log('User joined a spawned vc channel')
			let vcObject = gvc.spawnedVCs.filter(vc => vc.id == newState.channelId);
			if(vcObject.timeoutid != null) {
				clearTimeout(vcObject.timeoutid); 
				vcObject.timeoutid = null;
				let temp = gvc.spawnedVCs.filter(vc => vc.id != newState.channelId);
				gvc.spawnedVCs = [...temp, vcObject];
				await gvc.save();
			}
		}

		if(newState.channelId == gvc.channel){
			console.log('User joined the vccreator channel');			

			// TODO: check if the category exists still. If not, reset the entire system/ask user to reset. 
			// Alternatively, check to see how this functions without the category, and if it errors/crashes then deal with it. if not, ignore.
			// try { vc.setParent(gvc.category) } catch (e) { /* recreate catrgory and move? alternatively delete the vc */};

			let vc = await newState.guild.channels.create({name: 'testy', type: ChannelType.GuildVoice, parent: gvc.category});
			// TODO: figure out how to uniquely identify the name of the channel. Remove it from being called testy. maybe use users name?
			// Then figure out logic for users changing the name. Maybe a DM or a ping in the VC chat
			gvc.spawnedVCs = [...gvc.spawnedVCs, {id: vc.id, timeoutid: null}];
			await gvc.save();

			newState.member.voice.setChannel(vc);
		}
	}
}
const { vcCreator } = require("../libs/gdb")

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async run (oldState, newState, token) {
		let gvc = vcCreator.findByPk(newState.guild.id);
		if(!gvc) return;

		if(newState.channelId == oldState.channelId) return; //means user deafened or muted
		if(newState.channelId == gvc.channelID) ; //means user joined the channel
		if(newState.channelId == null) return; //means user left the channel

		let channel = newState.guild.channels.cache.get(gvc.channel);


		if(gvc && newState.channelId != null){ 
			if(newState.channelId == gvc.channel){
				if(channel.members.size == 0){
					channel.delete()
				}
			}
		

		}
		// if (newState.channelId === null) {
		//     newState.guild.me.voice.setDeaf(false)
		//     newState.guild.me.voice.setMute(false)
		// }

		console.log(newState.channelId)

	}
}
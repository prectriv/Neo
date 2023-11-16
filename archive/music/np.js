const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");

module.exports = {
    name: "np",
    aliases: ['playing'],
    category: "music",
    description: "Displays information about the currently playing song.",
    usage: '',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg(message, 'There is no music in the queue!')
        var song = server_queue.songs[server_queue.songNumb]
            if(!song) song = server_queue.songs[server_queue.songNumb - 1]

            return console.log(server_queue.player.state.playbackDuration)

        let embed = new Discord.MessageEmbed()
            .setTitle(`🎶 Now Playing #${parseInt(server_queue.songNumb) + 1}:`)
            .setDescription(`[${song.title}](${song.url}) [${song.time}] \nRequested by: <@${song.req}>`)
            .setThumbnail(song.thumbnail)
            .setColor(config.posHex);
            
            var looping = '❌';
                if(server_queue.loop == true) looping = '✅'
            var repeat = '❌';
                if(server_queue.repeat == true) repeat = '✅'

            embed.setFooter(`Repeating: ${repeat} | Looping: ${looping}`)
        
        message.channel.send({embeds: [embed]})

    }
};
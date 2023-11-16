const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const {video_player} = require("../../utils/musicfuncs.js")

module.exports = {
    name: "restartQueue",
    aliases: ['restartq', 'rq'],
    category: "music",
    description: "Restarts the queue from the beginning",
    usage: '',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!');
        if(server_queue.playing == false) return errors.noArg('There queue is currently paused!', false);

        let embed = new Discord.MessageEmbed()
            .setTitle('🔂 Restarting the queue!')
            .setColor(config.posHex)
            .setFooter({text:`Requested by ${message.author.username}`, iconURL:message.author.displayAvatarURL()})
        
        server_queue.songNumb = 0

        if(server_queue.leaveMsg){
            server_queue.leaveMsg.delete().catch(() => {})
            server_queue.leaveMsg = null
            clearTimeout(server_queue.leaveMsgTimeoutID)
            server_queue.leaveMsgTimeoutID = null
        }
        song = server_queue.songs[0]

        message.reply({embeds: [embed]});

        video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);    
    }
};
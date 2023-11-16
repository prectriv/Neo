const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const {	createAudioResource } = require('@discordjs/voice');
const {video_player} = require("../../utils/musicfuncs.js");

module.exports = {
    name: "repeat",
    aliases: [],
    category: "music",
    description: "Toggles single song repeating. If the queue has come to an end, you can use this command to repeat the last song!",
    usage: '',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!');
        let song = server_queue.songs[server_queue.songNumb]
        if(!song){
            if(server_queue.repeat == false) server_queue.repeat = true;
            server_queue.songNumb = server_queue.songNumb - 1
            if(server_queue.leaveMsg) try{ server_queue.leaveMsg.delete() } catch {}
                clearTimeout(server_queue.leaveMsgTimeoutID)
                server_queue.leaveMsgTimeoutID = null
                server_queue.leaveMsg = null
            return video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);
        }

        if(server_queue.repeat == true) {
            message.react('❌').catch(() => {})
            server_queue.repeat = false
            let embed = new Discord.MessageEmbed()
                .setTitle('🎶 Now Playing:')
                .setDescription(`[${song.title}](${song.url}) [${song.time}] \nRequested by: <@${song.req}>`)
                .setThumbnail(song.thumbnail)
                .setColor(config.color);
            var repeat = '❌';
            var looping = '❌';
                if(server_queue.loop == true) looping = '✅'

            embed.setFooter({text:`Repeating: ${repeat} | Looping: ${looping}`});
            server_queue.text_channel.messages.fetch(server_queue.playMsg).then(async message => {
                await message.edit({embeds: [embed]}).catch(() => {})
            });      
        } else {
            message.react('🔂').catch(() => {});
            server_queue.repeat = true
            let embed = new Discord.MessageEmbed()
                .setTitle('🎶 Now Playing:')
                .setDescription(`[${song.title}](${song.url}) [${song.time}] \nRequested by: <@${song.req}>`)
                .setThumbnail(song.thumbnail)
                .setColor(config.color);
            var repeat = '✅';
            var looping = '❌';
                if(server_queue.loop == true) looping = '✅'

            embed.setFooter({text:`Repeating: ${repeat} | Looping: ${looping}`});

            server_queue.text_channel.messages.fetch(server_queue.playMsg).then(async message => {
                await message.edit({embeds: [embed]}).catch(() => {})
            })  
        }
    }
};
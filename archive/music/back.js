const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const {	createAudioResource } = require('@discordjs/voice');
const cooldown = new Set();
const {video_player} = require("../../utils/musicfuncs.js");


module.exports = {
    name: "back",
    aliases: ['unskip', 'b'],
    category: "music",
    description: "Goes back to a song or by a specific number of songs. Note: skipping a specified number of songs includes skipping the current song. So the queue will jump from 1 to 5 if your input was 6.",
    usage: '[number of songs to skip]',
    run: async (client, message, args, queue, voice_channel) => { 
        if(cooldown.has(message.guild.id)){
            return message.reply({content: `To go back multiple songs, just input the number of songs you wish to go back by.`}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 6000)));
        }
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!')

        cooldown.add(message.guild.id)
        setTimeout(() => {
            cooldown.delete(message.guild.id)
        }, 2000);

        let current = parseInt(server_queue.songNumb) 
            if(args[0]){
                var max = parseInt(server_queue.songs.length) - 1 
                    max = Math.abs(parseInt(server_queue.songNumb - max));
                    
                    skipNum = await functions.numtest(message, args[0], 0, max)
                        if(skipNum != 1) skipNum = skipNum - 1
                        if(server_queue.songs[current - skipNum]){
                            skipFinish(current - skipNum);  
                        } else {
                            return errors.noArg(message, 'You cannot skip to a song that does not exist!', false);
                        }  
                    
            } else {
                server_queue.songNumb - 1;
                skipFinish(server_queue.songNumb - 1);
            }
        async function skipFinish (numb) {
            var song = await server_queue.songs[numb];
                if(!song){
                    if(server_queue.loop == true){
                        song = server_queue.songs[0]
                        server_queue.songNumb = 0
                    } else {
                        return errors.noArg(message, 'There is no song to skip to!', false)
                    }
                } else {
                    server_queue.songNumb = numb
                }
            message.react('👌').catch(() => {})
            video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);

        }
    }
};
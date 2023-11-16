const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const {	createAudioResource } = require('@discordjs/voice');
const cooldown = new Set();

module.exports = {
    name: "move",
    aliases: ['m'],
    category: "music",
    description: "Moves a specified song to a position of your choosing! This will move the song *to* that position, moving the song currently in that position up by one.",
    usage: '<song to move> <position to move it to/next/n>',
    run: async (client, message, args, queue, voice_channel) => { 
        var server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!')

        if(args[0] && args[1]){
            num = await functions.numtest(message, args[0], 1, server_queue.songs.length)
                if(args[1].toLowerCase() == 'n' || args[1].toLowerCase() == 'next') temp = server_queue.songNumb + 2
                else temp = args[1]
                pos = await functions.numtest(message, temp, 1, server_queue.songs.length) 
                    if(!num || !pos) return;
                    num -= 1
                    pos -= 1
                    //if(num == server_queue.songNumb || pos == server_queue.songNumb) return message.reply('no')//add in handling for this later on
                    if(num == pos) return errors.noArg(message, "You want to move a song to the same postion?", false, 'Uhh...')

                    const moving = server_queue.songs[num]
                    const playing = server_queue.songs[server_queue.songNumb]
                    server_queue.songs.splice(pos, 0, server_queue.songs[num])

                    var movedPlaying = false
                        if(num == server_queue.songNumb) movedPlaying = true

                    for(var i in server_queue.songs){   
                        if(server_queue.songs[i] == moving){
                            if(i != pos){
                                server_queue.songs.splice(i, 1)
                                break;
                            }
                        }
                    }
                    let newPos = 0
                    for(var i in server_queue.songs){
                        if(server_queue.songs[i] == moving){
                            newPos = parseInt(i) + 1
                            if(movedPlaying) server_queue.songNumb = parseInt(i)
                        }
                    }

                    if(!movedPlaying){
                        for(var i in server_queue.songs){
                            if(server_queue.songs[i] == playing){
                                server_queue.songNumb = parseInt(i)
                                break
                            }
                        }
                    }
                    message.react('✅').catch(() => {return})
                    let embed = new Discord.MessageEmbed()
                        .setTitle('Song Moved:')
                        .setColor(config.posHex)
                        .setThumbnail(moving.thumbnail)
                        .setDescription(`[${moving.title}](${moving.url}) moved to position **${newPos}**!`)
        
                    message.reply({embeds: [embed]}).catch(() => {})
                    
        } else errors.noArg(message, "Please input both the song you wish to move, and the position you desire to move it to.")
        //possibly make it so it prompts for new position   
        //possibly make it so if only one is provided, it will move the current song to that position
    }
};
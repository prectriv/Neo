const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const functions = require("../../utils/functions.js");
const {video_player} = require("../../utils/musicfuncs.js");
const {getVoiceConnection} = require('@discordjs/voice');
const stop = require("./stop.js");

module.exports = {
    name: "remove",
    aliases: [],
    category: "music",
    description: "Removes a specific song from the queue, all old songs if you input `old`, or a range of songs if you input `<startNumber> <endNumber>`. If no additional parameter was provided, the currently playing song will be removed.",
    usage: '<song number/old/range>',
    run: async (client, message, args, queue, voice_channel) => { 
        var server_queue = queue.get(message.guild.id);
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!');
        
        if(args[0] && args[1]){
            var min, max;
            num = await functions.numtest(message, args[0], 1, server_queue.songs.length)
                num2 = await functions.numtest(message, args[1], 1, server_queue.songs.length)
                    if(!num || !num2) return;
                    if(num > num2){
                        max = num
                        min = num2
                    } else if(num < num2){
                        max = num2
                        min = num
                    } else if(num == num2) return removeOne(num - 1);

                    min -= 1
                    max -= 1
                    amnt = max - min 

                    var nextTemp
                    if(max >= server_queue.songNumb && server_queue.songNumb >= min){
                        if(server_queue.songs[max + 1]) nextTemp = server_queue.songs[max + 1]
                        else if(server_queue.songs[min - 1]) nextTemp  = server_queue.songs[min - 1]
                        else return removeAll()
                    }
                    
                    const next = nextTemp            
                    const current = server_queue.songs[server_queue.songNumb];
                    const newQueue = server_queue.songs;
                        removed = newQueue.splice(min, amnt + 1)


                    let embed = new Discord.MessageEmbed()
                        .setTitle(`Removed ${removed.length} songs from the queue!`)
                        .setColor(config.negHex)
                        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL())


                    var ctr = 0;
                    if(removed.includes(current)) {
                        for(var i in server_queue.songs){
                            if(server_queue.songs[i] == next){
                                ctr = parseInt(i)
                                break;
                            } 
                        }
                        server_queue.songNumb = ctr
                        video_player(message, message.guild, server_queue.songs[ctr], queue)
                    } else {
                        for(var i in server_queue.songs){
                            if(server_queue.songs[i] == current){
                                ctr = parseInt(i)
                                break;
                            } 
                        } 
                        server_queue.songNumb = ctr
                    }

                message.channel.send({embeds: [embed]})

        } else if(!args[0]){
            removeOne(server_queue.songNumb, true)

        } else if(args[0].toLowerCase() == 'old'){
            const currentSong = server_queue.songs[server_queue.songNumb]
            var ctr = 0;
                while(server_queue.songs[0] != currentSong){
                    ctr++
                    server_queue.songs.shift()
                } 
            server_queue.songNumb = 0
            message.react('✅').catch(() => {})
            return message.reply(`Removed **${ctr}** songs from the queue!`)

        } else if(args[0].toLowerCase() == 'all'){
            return removeAll();

        } else if(args[0]) {
            functions.numtest(message, args[0], 1, server_queue.songs.length, function(num){
                if(num - 1 == server_queue.songNumb) removeOne(num - 1, true)
                removeOne(num - 1)
            })

        } else {
            message.react('❌').catch(() => {})
            return errors.noArg(message, 'Please supply either `old`, `min`, `max`, or the song number you wish to remove.', 8000)
        }

        function removeOne (num, play = false){
            if(!server_queue.songs[num + 1] && !server_queue.songs[num - 1]) return removeAll()
            removed = server_queue.songs.splice(num, 1)

            if(play) video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);
            return final(removed)
        }
        
        function removeAll(){
            return stop.run(client, message, args, queue, voice_channel)
        }

        function final (removed) {
            message.react('✅').catch(() => {})
            let embed = new Discord.MessageEmbed()
                .setTitle('Song Removed:')
                .setColor(config.negHex)
                .setThumbnail(removed[0].thumbnail)
                .setDescription(`[${removed[0].title}](${removed[0].url})`)

            message.reply({embeds: [embed]}).catch(() => {})
        }

    }
};
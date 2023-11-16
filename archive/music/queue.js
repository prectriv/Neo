const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const { numtest } = require('../../utils/functions.js');
const functions = require("../../utils/functions.js");

module.exports = {
    name: "queue",
    aliases: ['q'],
    category: "music",
    description: "Shows the entire queue",
    usage: '[page number]',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
        if(!server_queue || !server_queue.songs[0]) return errors.noArg(message, 'There is no music in the queue!')
        
        let fetch = async function(callback) {
            var songs = []
            var pages = []  
            var num = 0;
            var songPageNumber = 0
            let playing;

            for(var i in server_queue.songs){
                num++ 
                if(i == server_queue.songNumb){
                    playing = `__**${num}**__ - __**[${server_queue.songs[i].title}](${server_queue.songs[i].url})**__ [${server_queue.songs[i].time}] | <@${server_queue.songs[i].req}>`
                    songs.push(playing)
                } else songs.push(`${num} - [${server_queue.songs[i].title}](${server_queue.songs[i].url}) [${server_queue.songs[i].time}] | <@${server_queue.songs[i].req}>`)

            }
            let pagesAmnt;
                if(songs.length / 10 == Math.trunc(songs.length / 10)) pagesAmnt = (songs.length / 10)
                else pagesAmnt = Math.trunc(songs.length / 10) + 1

            i = 0
            while(i < pagesAmnt){
                n = 0
                var tempPage = [];
                while(n < 10){
                    if(songs[0] == playing) songPageNumber = i

                    if(songs[0] && n == 0) tempPage.push(songs.shift())
                    else if(songs[0] && n != 0) tempPage.push(songs.shift())
                    else if(!songs[0]){
                        pages.push(tempPage)
                        break;
                    }

                    if(n == 9) pages.push(tempPage)

                    n++
                }
                i++
            }    
            return callback(pages, songPageNumber)
        }

        fetch (async function(pages, num) {
            //pass through page number with the now playing song on it.
            var songTemp;    
                if(!server_queue.songs[server_queue.songNumb]) songTemp = server_queue.songs[server_queue.songNumb - 1]
                else songTemp = server_queue.songs[server_queue.songNumb]

                const song = songTemp
            
            if(args[0]){
                pagenum = await numtest(message, args[0], 1, pages.length)
                console.log(pagenum)
                num = pagenum - 1
            }
            
            var looping = '❌';
                if(server_queue.loop == true) looping = '✅'
            var repeat = '❌';
                if(server_queue.repeat == true) repeat = '✅'

            let embed = new Discord.MessageEmbed()
                .setTitle('🗒️ Server Queue:')
                .setColor(config.color)
                .setThumbnail(song.thumbnail)
                .setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) [${song.time}] | Queued by <@${song.req}>\n\n ${pages[num].join('\n')}`)
                .setFooter({text: `Showing page ${num + 1} of ${pages.length} | Repeating: ${repeat} | Looping: ${looping}`, iconURL: message.author.displayAvatarURL()});
            
            message.channel.send({embeds: [embed]}).then(m => {
                m.react('⏮️').catch(() => {return})
                m.react('⏪').catch(() => {return})
                m.react('⏩').catch(() => {return})
                m.react('⏭️').catch(() => {return})


                function reaction (pages, pageNum) {
                    try{
                    const filter = (reaction, user) => (reaction.emoji.name == '⏮️' || reaction.emoji.name == '⏪' || reaction.emoji.name == '⏩' || reaction.emoji.name == '⏭️') && user.id === message.author.id
                        m.awaitReactions({filter, max: 1, time: 90000})
                            .then(collected => {
                                collected.first().message.reactions.resolve(collected.first().emoji.name).users.remove(message.author.id)

                                let embed = new Discord.MessageEmbed()
                                    .setTitle('🗒️ Server Queue:')
                                    .setColor(config.color)
                                    .setThumbnail(song.thumbnail)
                                    .setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) | Queued by <@${song.req}>\n\n ${pages[pageNum].join('\n')}`)

                                    switch (collected.first().emoji.name) {
                                        case '⏮️':
                                            pageNum = 0
                                            embed.setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) | Queued by <@${song.req}>\n\n ${pages[pageNum].join('\n')}`)
                                            embed.setFooter({text: `Showing page ${pageNum + 1} of ${pages.length} | Repeating: ${repeat} | Looping: ${looping}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {});

                                                return reaction(pages, pageNum)

                                        case '⏪':
                                            if(pageNum == 0) {
                                                pageNum = pages.length - 1 
                                            } else pageNum = pageNum -1

                                            embed.setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) | Queued by <@${song.req}>\n\n ${pages[pageNum].join('\n')}`)
                                            embed.setFooter({text: `Showing page ${pageNum + 1} of ${pages.length} | Repeating: ${repeat} | Looping: ${looping}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})

                                                return reaction(pages, pageNum) 

                                        case '⏩':
                                            if(pageNum == pages.length - 1){
                                                pageNum = 0
                                            } else pageNum = pageNum + 1
                                            embed.setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) | Queued by <@${song.req}>\n\n ${pages[pageNum].join('\n')}`)
                                            embed.setFooter({text:`Showing page ${pageNum + 1} of ${pages.length} | Repeating: ${repeat} | Looping: ${looping}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})

                                                return reaction(pages, pageNum)

                                        default:
                                            pageNum = pages.length - 1 
                                            //aka case '⏭️'
                                            embed.setDescription(`__Now Playing (${server_queue.songNumb + 1})__ - [${song.title}](${song.url}) | Queued by <@${song.req}>\n\n ${pages[pageNum].join('\n')}`)
                                            embed.setFooter({text:`Showing page ${pageNum + 1} of ${pages.length} | Repeating: ${repeat} | Looping: ${looping}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})

                                                return reaction(pages, pageNum)
                                    }

                            }).catch(() => {
                                return m.reactions.removeAll().catch(() => {})
                            });
                        } catch {}

                }
                return reaction(pages, num)
            });
        });
            
//run one base function whenever command runs. createPage(message, [pageNumber])
// with that function, do like what i did inside of the play command, and await for reactions pertaining to changing pages. Have it call back to the function within the function and rerun everything
    }
};
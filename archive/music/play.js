/**
 * Plays/searches for a song on YouTube. If you send a playlist link and the playlist link contains data for a specific youtube video, it will queue that song first.
 * When the bot reacts with '👌', it has recieved your information.
 * When the bot reacts with '🤔' it has validated and is testing your inforamtion. 
 * When the bot reacts with '✅' the song has been properly processed and had been added to the queue/will be played shortly.
 * @param {Object} client - The Discord client object
 * @param {Object} message - The Discord message object
 * @param {Array} args - The arguments passed with the command
 * @param {Map} queue - The queue of songs to be played
 * @param {Object} voice_channel - The voice channel object
 * @param {Boolean} autoShuffle - Whether to shuffle the playlist or not
 * @returns {Promise<void>}
 */
const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const ytpl = require("ytpl")
const ytSearch = require('yt-search');
const resume = require('./resume.js')
const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const { video_player } = require('../../utils/musicfuncs');
const cooldown = new Set();
// ➡️ - use for the 'play queued song next' feature
module.exports = {
    name: "play",
    aliases: ['p'],
    category: "music",
    description: `Plays/searches for a song on YouTube. If you send a playlist link and the playlist link contains data for a specific youtube video, it will queue that song first.
    When the bot reacts with '👌', it has recieved your information.
    When the bot reacts with '🤔' it has validated and is testing your inforamtion. 
    When the bot reacts with '✅' the song has been properly processed and had been added to the queue/will be played shortly.`,
    usage: '<url/search terms/playlist url>',
    run: async (client, message, args, queue, voice_channel, autoShuffle = false) => {
        const queue_constructor = {
            guild: message.guild,
            voice_channel: voice_channel,
            text_channel: message.channel,
            connection: null,
            songs: [],
            loop: false,
            songNumb: 0,
            repeat: false,
            playing: true,
            player: createAudioPlayer(),
            playMsg: null,
            listeners: false,
            leaveMsg: null,
            leaveMsgTimeoutID: null,
            first: false
        }
        var server_queue = queue.get(message.guild.id);
        if (server_queue) {
            if (server_queue.playing == false && !args[0]) {
                return resume.run(client, message, args, queue, voice_channel);
            }
        }
        //test values
        if (!args[0]) return errors.noArg(message, 'No search terms/URL given!');
        if (args[1] && (args[1].toLowerCase() == 't' || args[1].toLowerCase() == 'true')) autoShuffle = true

        if (server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!')
        if (message.member.voice.userLimit != 0 && message.member.voice.userLimit >= message.member.voice.channel.members.size) return errors.noArg(message, 'Your voice channel is full!')

        if (cooldown.has(message.guild.id)) {
            return message.reply({ content: `To play multiple songs, you can input a playlist or just wait a bit longer between uses of this command.` }).then(msg => (setTimeout(() => msg.delete().catch(() => { }), 6000)));
        }

        message.react('👌').catch(() => { })
        cooldown.add(message.guild.id)
        setTimeout(() => {
            cooldown.delete(message.guild.id)
        }, 5000);

        //calls validator to do all the processing of the URL        
        let song = await validator(args)
        server_queue = queue.get(message.guild.id);

        message.react('🤔').catch(() => { })
        if (!server_queue) {
            queue.set(message.guild.id, queue_constructor);
            //if playlist
            if (song.items) {
                //callback dentoes if there is serverqueue or not
                await playlistHandler(queue_constructor, song).then(joinProcess())

            } else {
                queue_constructor.songs.push(song);
                joinProcess()
            }
            async function joinProcess() {
                try {
                    const connection = joinVoiceChannel({
                        channelId: voice_channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator
                    });
                    connection.subscribe(queue.get(message.guild.id).player)

                    queue_constructor.connection = connection;
                    message.reactions.removeAll().catch(() => { return });
                    await message.react('✅').catch(() => { return })
                    video_player(message, message.guild, queue_constructor.songs[0], queue);
                } catch (err) {
                    queue.delete(message.guild.id);
                    message.channel.send('There was an error connecting!');
                    throw err;
                }
            }

        } else {
            message.reactions.removeAll().catch(() => { return });
            await message.react('✅').catch(() => { return })
            if (song.items && !server_queue.songs[server_queue.songNumb - 1] && server_queue.songNumb - 1 != -1) {
                if (server_queue.leaveMsg) {
                    server_queue.leaveMsg.delete().catch(() => { })
                    server_queue.leaveMsg = null
                    clearTimeout(server_queue.leaveMsgTimeoutID)
                    server_queue.leaveMsgTimeoutID = null
                }
                data = await playlistHandler(queue_constructor, song)
                video_player(message, message.guild, data, queue);

            } else if (song.items) {
                if (!server_queue.songs[server_queue.songNumb]) {
                    data = await playlistHandler(server_queue, song)
                    video_player(message, message.guild, data, queue);
                }
                else playlistHandler(server_queue, song);

            } else if (!server_queue.songs[server_queue.songNumb]) {
                server_queue.songs.push(song)
                video_player(message, message.guild, song, queue);

            } else {
                server_queue.songs.push(song);
                let embed = new Discord.MessageEmbed()
                    .setTitle(`🎵 Song Queued:`)
                    .setColor(config.posHex)
                    .setDescription(`${server_queue.songs.length} - [${song.title}](${song.url}) [${song.time}]`)
                    .setThumbnail(song.thumbnail)

                message.channel.send({ embeds: [embed] }).then(m => {
                    m.react('➡️').catch(() => { return })

                    const filter = (reaction, user) => reaction.emoji.name == '➡️' && user.id === message.author.id
                    m.awaitReactions({ filter, max: 1, time: 10000 })
                        .then(collected => {
                            return client.commands.get('move').run(client, message, [server_queue.songs.length, 'n'], queue, voice_channel)
                        }).catch(() => {
                            return m.reactions.removeAll().catch(() => { })
                        });
                });

            }
        }
        //playlist manager
        async function playlistHandler(server_queue, playlist) {
            return new Promise(async resolve => {
                //tests if playlist has a video linked with it and will play that song first if so
                if (!playlist.items) return errors.noArg(message, 'You cannot add an empty playlist!', false)
                let starter = args[0].split('&')
                if (!autoShuffle) {
                    if (starter[0].includes('watch?v=')) {
                        let first = await validator(starter)
                        server_queue.songs.push(first)
                        playlistFinal(first.title)

                    } else if (starter[0].includes('youtu.be/')) {
                        starter = starter[0].split('?')

                        let first = await validator(starter)
                        server_queue.songs.push(first)
                        playlistFinal(first.title)

                    } else playlistFinal()

                } else playlistFinal()

                async function playlistFinal(firstTitle) {
                    var temp = []
                    for (var i in playlist.items) {
                        if (firstTitle != undefined && playlist.items[i].title == firstTitle) {
                            continue;
                        } else {
                            temp.push({ title: playlist.items[i].title, url: playlist.items[i].shortUrl, thumbnail: playlist.items[i].thumbnails[0].url, time: playlist.items[i].duration, req: message.author.id });
                        }
                    }

                    if (autoShuffle) {
                        functions.shuffle(temp, null, function f(shuffled) {
                            completePlaylist(shuffled)
                        })
                    } else completePlaylist(temp)

                    async function completePlaylist(arr) {
                        for (var i in arr) {
                            server_queue.songs.push(arr[i])
                        }
                        queue.set(server_queue.guild.id, server_queue);
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`🎵 Playlist Queued:`)
                            .setColor(config.posHex)
                            .setDescription(`**${playlist.items.length}** Songs queued from: [${playlist.title}](${playlist.url})`)
                            .setThumbnail(playlist.thumbnails[0].url)
                        message.channel.send({ embeds: [embed] });

                        resolve({ title: playlist.items[0].title, url: playlist.items[0].shortUrl, thumbnail: playlist.items[i].thumbnails[0].url, time: playlist.items[i].duration, req: message.author.id })
                    }

                }

            })
        }

        //tests for URL and searches for one to continue command process.

        async function validator(args) {
            return new Promise(async resolve => {
                //playlist information
                if (args[0].includes('youtu.be') && args[0].includes('?list=')) {
                    let temp = args[0].split('?list=')
                    await ytpl.getPlaylistID(temp[1]).then(async id => {
                        try {
                            var playlist = await ytpl(id, { limit: Infinity, pages: Infinity })
                            resolve(playlist)
                        } catch { }
                    });

                } else if (ytpl.validateID(args[0])) {
                    await ytpl.getPlaylistID(args[0]).then(async id => {
                        try {
                            var playlist = await ytpl(id, { limit: Infinity, pages: Infinity })
                            resolve(playlist)

                        } catch {
                            return errors.noArg(message, 'No results found! Please check your spelling and/or URL formatting. Perhaps the playlist is private or empty...', false)
                        }
                    });


                } else {
                    //single song information
                    if (ytdl.validateURL(args[0])) {
                        let song_info;
                        try {
                            song_info = await ytdl.getInfo(args[0]);
                        } catch { return errors.noArg(message, 'No results found! Please check your spelling and/or URL formatting.', false) }
                        resolve({ title: song_info.videoDetails.title, url: song_info.videoDetails.video_url, thumbnail: song_info.videoDetails.thumbnails[0].url, time: functions.sToTime(song_info.videoDetails.lengthSeconds), req: message.author.id })

                    } else {
                        //calls search function    
                        let video = await video_finder(args.join(' '))
                        if (video) {
                            resolve({ title: video.title, url: video.url, thumbnail: video.thumbnail, time: video.timestamp, req: message.author.id })
                        } else {
                            errors.noArg(message, 'Error finding video.');
                        }
                    }
                }
            });
        }

        async function video_finder(query) {
            return new Promise(async resolve => {
                const video_result = await ytSearch(query)
                if (!video_result.videos[0]) return errors.noArg(message, 'No results found! Please check your spelling and/or URL formatting.', false)

                let embed = new Discord.MessageEmbed()
                    .setTitle('🔎 Song Selection:')
                    .setColor(config.color)
                    .setDescription(`
    1️⃣ - [${video_result.videos[0].title}](${video_result.videos[0].url}) [${video_result.videos[0].timestamp}]
    2️⃣ - [${video_result.videos[1].title}](${video_result.videos[1].url}) [${video_result.videos[1].timestamp}]
    3️⃣ - [${video_result.videos[2].title}](${video_result.videos[2].url}) [${video_result.videos[2].timestamp}]
    4️⃣ - [${video_result.videos[3].title}](${video_result.videos[3].url}) [${video_result.videos[3].timestamp}]
    5️⃣ - [${video_result.videos[4].title}](${video_result.videos[4].url}) [${video_result.videos[4].timestamp}]`)
                    .setFooter({ text: `Please react to select your desired 🔎 result within 25 seconds`, iconURL: message.author.displayAvatarURL() });

                message.channel.send({ embeds: [embed] }).then(m => {
                    m.react('1️⃣').catch(() => { return })
                    m.react('2️⃣').catch(() => { return })
                    m.react('3️⃣').catch(() => { return })
                    m.react('4️⃣').catch(() => { return })
                    m.react('5️⃣').catch(() => { return })
                    m.react('❌').catch(() => { return })

                    const filter = (reaction, user) => (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '3️⃣' || reaction.emoji.name == '❌') && user.id === message.author.id
                    m.awaitReactions({ filter, max: 1, time: 25000 })
                        .then(collected => {
                            m.reactions.removeAll().catch(() => { return })
                            let embed = new Discord.MessageEmbed()
                                .setTitle('🎵 Song Selected:')
                                .setColor(config.posHex);

                            switch (collected.first().emoji.name) {
                                case '❌':
                                    embed.setTitle('🔎 Song Selection: Canceled!')
                                        .setColor(config.negHex)
                                        .setDescription('The process has been canceled.')

                                    return m.edit({ embeds: [embed] }).catch(() => { });

                                case '1️⃣':
                                    embed.setDescription(`[${video_result.videos[0].title}](${video_result.videos[0].url}) [${video_result.videos[0].timestamp}]`)
                                    embed.setThumbnail(video_result.videos[0].thumbnail)
                                    m.edit({ embeds: [embed] }).catch(() => { }).then(setTimeout(() => m.delete().catch(() => { }), 5000))

                                    return resolve(video_result.videos[0])

                                case '2️⃣':
                                    embed.setDescription(`[${video_result.videos[1].title}](${video_result.videos[1].url}) [${video_result.videos[1].timestamp}]`)
                                    embed.setThumbnail(video_result.videos[1].thumbnail)
                                    m.edit({ embeds: [embed] }).catch(() => { }).then(setTimeout(() => m.delete().catch(() => { }), 5000))

                                    return resolve(video_result.videos[1])
                                default:
                                    //aka case '3️⃣'
                                    embed.setDescription(`[${video_result.videos[2].title}](${video_result.videos[2].url}) [${video_result.videos[2].timestamp}]`)
                                    embed.setThumbnail(video_result.videos[2].thumbnail)
                                    m.edit({ embeds: [embed] }).catch(() => { }).then(setTimeout(() => m.delete().catch(() => { }), 5000))

                                    return resolve(video_result.videos[2])
                            }

                        }).catch(() => {
                            m.reactions.removeAll().catch(() => { return })
                            embed.setTitle('🔎 Song Selection: Canceled!')
                                .setColor(config.negHex)
                                .setDescription('No reaction recieved after 25 seconds, the process has been canceled.')
                            return m.edit({ embeds: [embed] }).catch(() => { return });
                        });
                });

            })

        }
    }
};
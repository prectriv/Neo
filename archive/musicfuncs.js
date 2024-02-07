const Discord = require('discord.js');
const config = require('../jsons/config.json')
const errors = require("./errors.js");

const {URL} = require('url')
const ytpl = require('ytpl')

async function plvalidator(pl){
    return new Promise(async resolve => {
        try {
            var temp = new URL(pl).searchParams.get("list")
        } catch {
            return resolve(null)
        }

        if(!temp) resolve(null)
            ytpl.getPlaylistID(temp).then(async id => {
            try {
                var playlist = await ytpl(id, {limit: Infinity, pages: Infinity})
                resolve(playlist)
            } catch {
                resolve(null)
            }
        })
    });
}


const {createAudioResource, getVoiceConnection} = require('@discordjs/voice');
const ytdl = require("ytdl-core")

async function video_player(message, guild, song, queue){

    var server_queue = queue.get(message.guild.id);
    if(!server_queue || !song){
        let connection = getVoiceConnection(message.guild.id);
            try { 
                connection.destroy();
                queue.delete(guild.id) 
            } catch {}
        return;
    }

    if(server_queue.leaveMsg){
        server_queue.leaveMsg.delete().catch(() => {})
        server_queue.leaveMsg = null
        clearTimeout(server_queue.leaveMsgTimeoutID)
        server_queue.leaveMsgTimeoutID = null
    } 

    if(server_queue.playMsg){
        try {
            server_queue.text_channel.messages.fetch(server_queue.playMsg).then(async message => {
                await message.delete().catch(() => {})
            });
        } catch {}
    } 
    var resource;
        try {
            resource = await createAudioResource(ytdl(song.url, { filter: 'audioonly', highWaterMark: 1048576 * 32 /*32mb*/, quality: "highestaudio" }));
        } catch (e) {
            server_queue.text_channel.send('An error has occured while playing your audio.')
        };

    if(!server_queue.first) server_queue.first = true
    
    try {
        server_queue.player.play(resource)
    } catch {
        server_queue.text_channel.send('An error has occured while playing your audio.')
    }
        let embed = new Discord.MessageEmbed()
            .setTitle(`🎶 Now Playing #${parseInt(server_queue.songNumb) + 1}:`)
            .setDescription(`[${song.title}](${song.url}) [${song.time}] \nRequested by: <@${song.req}>`)
            .setThumbnail(song.thumbnail)
            .setColor(config.color);

        var looping = '❌';
            if(server_queue.loop == true) looping = '✅'
        var repeat = '❌';
            if(server_queue.repeat == true) repeat = '✅'

        embed.setFooter({text: `Repeating: ${repeat} | Looping: ${looping}`});
    
        await message.channel.send({embeds: [embed]}).then(async m => server_queue.playMsg = m.id);


    if(server_queue.listeners == false) {
        server_queue.listeners = true

        server_queue.player.on('idle', async () => {
            if(server_queue.repeat == true) {
                video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);
            } else if(server_queue.loop == true) {
                if(!server_queue.songs[server_queue.songNumb + 1]){
                    server_queue.songNumb = 0
                } else {
                    server_queue.songNumb = server_queue.songNumb + 1
                }
                video_player(message, message.guild, server_queue.songs[server_queue.songNumb], queue);

//no song
            } else if(!server_queue.songs[server_queue.songNumb + 1]) {
                server_queue.songNumb = server_queue.songNumb + 1;
                if(server_queue.leaveMsg) {
                    server_queue.leaveMsg.delete().catch(() => {})
                    clearTimeout(server_queue.leaveMsgTimeoutID)
                    server_queue.leaveMsgTimeoutID = null
                }
                    server_queue.text_channel.send(":mailbox_with_no_mail: I have reached the end of my queue. After 5min I will disconnect if the queue is still empty!").then(msg => {
                        server_queue.leaveMsg = msg

                        server_queue.leaveMsgTimeoutID = setTimeout(async (msg) => {
                            const test = await queue.get(guild.id)
                                if(!test){
                                    if(msg) msg.delete().catch(() => {})
                                    return
                                } 

                            if(msg){
                                if(test.leaveMsg.id != msg.id) return msg.delete().catch(() => {})
                            }
                
                            if(test.songs[test.songNumb] == undefined) {
                                let connection = getVoiceConnection(guild.id);
                                    connection.destroy();
                                    test.player.stop();

                                    test.leaveMsg.edit(':mailbox_with_no_mail: I have disconnected after 5min of inactivity!').catch(() => {})
                                    return queue.delete(guild.id);

                            } else {
                                 if(msg) msg.delete().catch(() => {})
                            }
                        }, 300000); //5min = 300000
                    }); 

                } else {
                    server_queue.songNumb = server_queue.songNumb + 1;
                    video_player(message, guild, server_queue.songs[server_queue.songNumb], queue); 
                }
        });

        server_queue.player.on('error', error => {
            console.error(error)
            console.log('\n' + server_queue)
            server_queue.text_channel.send('An error has occured while playing your audio.')
        });
    }
}

module.exports = {
    plvalidator: plvalidator,
    video_player: video_player
}
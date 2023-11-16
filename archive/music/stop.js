const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: "stop",
    aliases: ['end', 'leave', 'dc'],
    category: "music",
    description: "Ends the music functions and disconnects the bot from the voice channel.",
    usage: '',
    run: async (client, message, args, queue, voice_channel, force = false) => { 
        if(force) return kill()
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!')

        message.reply(`Are you sure you want to disconnect the bot?`).then(msg => {
            msg.react('✅').catch(() => {})
            msg.react('❌').catch(() => {})
            
            try {            
                const filter = (reaction, user) => (reaction.emoji.name == '✅' || reaction.emoji.name == '❌') && user.id === message.author.id
                msg.awaitReactions({filter, max: 1, time: 15000 })
                    .then(collected => {
                        if(collected.first().emoji.name == '✅'){
                            kill()
                            msg.reactions.removeAll().catch(() => {})
                            msg.edit(`👋 The music has been terminated!`).catch(() => {})

                        } else {
                            msg.edit(`The songs will carry on!`).catch(() => {});
                            msg.reactions.removeAll().catch(() => {})
                        }
                        
                    }).catch(e => {
                        console.log(e)
                        msg.edit('No reaction recieved after 15 seconds, the process has been canceled.').catch(() => {});
                        msg.reactions.removeAll().catch(() => {}) 
                    });
            } catch {}

            function kill() {
                let connection = getVoiceConnection(message.guild.id);
                    connection.destroy();
                    server_queue.player.stop();
                    queue.delete(msg.guild.id);
            }
        });
    }
}
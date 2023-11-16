const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const functions = require("../../utils/functions.js");
const ytdl = require("ytdl-core")
const {	createAudioResource } = require('@discordjs/voice');
const {video_player} = require("../../utils/musicfuncs.js");

module.exports = {
    name: "skipto",
    aliases: ['skipt', 'st'],
    category: "music",
    description: "Skips to a specific song number in the queue.",
    usage: '[number of songs to skip]',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
            if(!server_queue) return errors.noArg(message, `Please initalize the music functions by using \`${config.prefix}play\``)
        if(!server_queue.songs) return errors.noArg('There is no music in the queue!')
        if(server_queue && message.member.voice.channel.id !== server_queue.voice_channel.id) return errors.noArg(message, 'Please join *my* voice channel!')
        if(!args[0]) return errors.noArg(message, 'Please provide a song number to skip to!', false)

            skipNum = await functions.numtest(message, args[0], 0, server_queue.songs.length)
                if(skipNum == undefined) return;
                
                skipNum = skipNum - 1
                    if(skipNum == server_queue.songNumb) return errors.noArg(message, "You can't skip to a song that's already playing!")
                    
                    message.react('👌').catch(() => {})
                    server_queue.songNumb = skipNum
                    video_player(message, message.guild, server_queue.songs[skipNum], queue)


    }
};
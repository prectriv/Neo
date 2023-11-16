const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const events = require("../../utils/events.js");
const {shuffle} = require("../../utils/functions.js");

module.exports = {
    name: "shuffle",
    aliases: ['sfl', 'sh'],
    category: "music",
    description: "Shuffles the entire queue. If 'new' is entered, it will delete all played songs and shuffle the current song/unplayed songs.",
    usage: '[new]',
    run: async (client, message, args, queue, voice_channel) => { 
        let server_queue = queue.get(message.guild.id);
        if(!server_queue || !server_queue.songs[0]) return errors.noArg(message, 'There is no music in the queue!')

        if(args[0] == 'new'){
            const currentSong = server_queue.songs[server_queue.songNumb]
                while(server_queue.songs[0] != currentSong) server_queue.songs.shift()
                server_queue.songNumb = 0
        }
        
        shuffle(server_queue.songs, server_queue.songNumb, function(shuffled) {
            server_queue.songNumb = 0
            server_queue.songs = shuffled
            message.react('✅').catch(() => {})
        })
    }
};
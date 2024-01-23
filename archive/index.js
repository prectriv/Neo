const Discord = require("discord.js");
const client = new Discord.Client({disableEveryone: true, failIfNotExists: false,
                                   partials: ['MESSAGE', 'CHANNEL', 'REACTION'], 
                                   intents: [Discord.Intents.FLAGS.GUILDS, 
                                             Discord.Intents.FLAGS.GUILD_VOICE_STATES, 
                                             Discord.Intents.FLAGS.GUILD_MESSAGES, 
                                             Discord.Intents.FLAGS.GUILD_MEMBERS, 
                                             Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

const config = require("./jsons/config.json");
    //let prefix = config.prefix;
    let prefix = config.devprefix;
const fs = require('fs');
const events = require("./utils/events.js")
const economy = require("./jsons/economy.json")
const functions = require("./utils/functions.js");
const cooldown = new Set();
const reactionR = require("./utils/reactionRoles.js");
const prefs = require("./jsons/prefs.json");
const errors = require("./utils/errors.js");
const queue = new Map();
const { getVoiceConnection } = require('@discordjs/voice');
const queueTimer = new Set();

//nodemon -e js (to start and watch only js files)

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.categories = fs.readdirSync("./commands/");

["command"].forEach(handler => {
    require(`./utils/${handler}`)(client);
});


client.on("ready", async () => {
    const activities = [
        `${prefix}info | Serving ${client.guilds.cache.size} servers`, 
        `${prefix}info | Monitoring ${client.channels.cache.size} channels`,
        //`${prefix}info | Serving ${client.users.cache.size} users`, THIS NO LONGER WORKS
        ]; 

        client.user.setPresence({activities: [{
            name: `${prefix}info`,
             type: "WATCHING"
            }], status: 'idle', afk: true});


        setInterval(() => {
            let index = Math.floor(Math.random() * activities.length);

            client.user.setPresence({ activities: [{ 
                name: activities[index], 
                type: "WATCHING"
            }], status: 'idle' });
        }, 300000);

    console.log('Online!')
});


client.on("error", error => console.error(error))
client.on("guildCreate", async guild => {
    events.guildCreate(client, guild)
    economy[guild.id] = {
        guild: guild.name,
        members: {},
        bot: {
            coins: 69420
        }
    };

    functions.json('economy', economy)
});

client.on("messageReactionAdd", async (reaction, user) => reactionR.add(client, reaction, user));
client.on("messageReactionRemove", async (reaction, user) => reactionR.remove(client, reaction, user));

client.on("guildDelete", async guild => events.guildDelete(client, guild)); //make it delete any json values for this guild
client.on("guildMemberAdd", async member => events.join(client, member)); 
client.on("guildMemberRemove", async member => events.leave(client, member));
//client.on("channelCreate", async channel => events.channelCreate(client, channel));
//client.on("channelDelete", async channel => events.channelDelete(client, channel));
client.on("voiceStateUpdate", async (oldState, newState) => {
    var server_queue = queue.get(oldState.guild.id)
    if(!server_queue) return;
    //if user disconnects bot
    if((newState.id == config.botID  && !newState.channelId) || (newState.id == config.betaBotID && !newState.channelId)){
        server_queue.player.stop();
        server_queue.text_channel.send('📭 I have been disconnected!')
        if(server_queue.leaveMsg) server_queue.leaveMsg.delete().catch(() => {})
        queue.delete(oldState.guild.id);
    } else if(queueTimer.has(newState.guild.id)){
        if(!oldState.channelId || oldState.channelId != server_queue.voice_channel.id) {
            if(newState.channelId) {
                if(newState.channelId == server_queue.voice_channel){
                    server_queue.leaveMsg.delete().catch(() => {})
                    server_queue.leaveMsg = null
                    server_queue.text_channel.send('Welcome back! The music will now continue where it left off.').then(m => setTimeout(() => {m.delete().catch(() => {})}, 10000));
                    server_queue.player.unpause();
                    server_queue.playing = true;
                    queueTimer.delete(server_queue.voice_channel.guild.id);
                }
            }
        } else return;
    } else {
        if(server_queue){
            if(newState.channelId == server_queue.voice_channel.id) return;
            else if(oldState.channelId == server_queue.voice_channel.id) {
                if(server_queue.voice_channel.members.size == 1){
                    if(server_queue.leaveMsg){
                        let connection = getVoiceConnection(server_queue.guild.id);
                            connection.destroy();
                            server_queue.player.stop();

                        server_queue.leaveMsg.edit(':mailbox_with_no_mail: I have disconnected!').catch(() => {});
                        return queue.delete(server_queue.guild.id);
                    }
                    server_queue.text_channel.send(`👋 Everyone has left my vc :(\nThe music has been paused and will be terminated after 5min of inactivity.`).then(msg => {
                        server_queue.leaveMsg = msg;
                        server_queue.player.pause();
                        server_queue.playing = false;

                        queueTimer.add(newState.guild.id);

                        setTimeout(async () => {
                            if(!queueTimer.has(server_queue.voice_channel.guild.id)) return;
                            try { queueTimer.delete(server_queue.voice_channel.guild.id) } catch {}
                            let leave_queue = queue.get(oldState.guild.id)
                            if(!leave_queue || !leave_queue.voice_channel) return;
       
                            if(leave_queue.voice_channel.members.size == 1) {
                                try {
                                    let connection = getVoiceConnection(leave_queue.voice_channel.guild.id);
                                        connection.destroy();
                                        leave_queue.player.stop();
                                        queue.delete(leave_queue.guild.id);

                                        msg.edit('👋 Everyone has left my vc and the music has been terminated.').catch(() => {})

                                } catch { msg.delete().catch(() => {})}
                            } else { 
                                msg.delete().catch(() => {})
                            }
                        }, 300000) //5min
                    });
                }
            }
        }
    }
});

client.on("messageCreate", async message => { 
//coins
    if(message.channel.type == "dm") return;
    if(economy[message.guild.id]){
        economy[message.guild.id].guild = message.guild.name
        functions.json('economy', economy)

    } else { 
        economy[message.guild.id] = {
            guild: message.guild.name,
            members: {},
            bot: {
                coins: 69420
            }   
        }
        functions.json('economy', economy)
    }
    
    if(prefs[message.guild.id]){
        prefs[message.guild.id].name = message.guild.name
        functions.json('prefs', prefs);
    } else {
        events.newPref(message.guild)
    }

    if(message.author.bot) return;
    if(!message.guild) return;

    if(!economy[message.guild.id].members[message.author.id]) events.userecon(message, message.author)

    if(prefs[message.guild.id].prefix != null){
        if(message.content.startsWith(prefs[message.guild.id].prefix)){
            return runCommand(true);
        }
    }

    if(!prefs[message.guild.id].override){
        if(message.content.startsWith(prefix)) return runCommand(false);
    }

    if(!cooldown.has(message.author.id + message.guild.id)) giveCoin();

    async function giveCoin() {
        economy[message.guild.id].members[message.author.id].user = message.author.username
        functions.json('economy', economy)

        cooldown.add(message.author.id + message.guild.id)
        setTimeout(() => {
            cooldown.delete(message.author.id + message.guild.id)
        }, 5 * 1000 * 60)

        let i = parseInt(Math.floor(Math.random() * 10));
            if(i == 5) {
                let amnt = parseInt(Math.floor(Math.random() * 35) + 1)
                
                economy[message.guild.id].members[message.author.id].coins = economy[message.guild.id].members[message.author.id].coins += amnt
                    functions.json('economy', economy)

                if(prefs[message.guild.id].coinMsg){ 
                    let coinEmbed = new Discord.MessageEmbed()
                        .setAuthor({name:`+${amnt} coins`, iconURL: message.author.displayAvatarURL()})
                        .setColor(config.warnHex)
                        .setFooter({text:`Total coins: ${economy[message.guild.id].members[message.author.id].coins}`})
                    message.channel.send({embeds: [coinEmbed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 2500)));
                }
            }
    
    }

    async function runCommand(custom) {
        try {
            if(!message.member) message.member = await message.guild.fetchMember(message);

            let args;
            if(!custom) {
                args = message.content.slice(prefix.length).trim().split(/ +/g);
            } else {
                args = message.content.slice((prefs[message.guild.id].prefix).length).trim().split(/ +/g);

            }
            const cmd = args.shift().toLowerCase();
            
            if (cmd.length === 0) return;
            
            let command = client.commands.get(cmd);
                if(!command) command = client.commands.get(client.aliases.get(cmd));
                    if(command.category == 'music'){
                        const voice_channel = message.member.voice.channel;
                            if (!voice_channel && command.name != 'playlist'){
                                message.react('❌')
                                return errors.noArg(message,'You need to be in a voice channel to execute this command!');
                            } else if(command.name != 'play' && command.name != 'playlist'){
                                var server_queue = queue.get(message.guild.id);
                                if(!server_queue || !server_queue.first) return errors.noArg(message, "Please wait until the first song is already playing to run this command.", false)
                                command.run(client, message, args, queue, voice_channel)
                            } else return command.run(client, message, args, queue, voice_channel)
                        } else command.run(client, message, args);

        } catch {};
    }

});

//client.login(config.token)
client.login(config.devtoken)
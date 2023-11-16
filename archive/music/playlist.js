const Discord = require('discord.js');
const config = require("../../jsons/config.json");
const errors = require("../../utils/errors.js");
const { json, numtest } = require("../../utils/functions.js");
const playlists = require("../../jsons/playlists.json");
const {plvalidator} = require('../../utils/musicfuncs.js')
const {pEmbed} = require('../../utils/functions.js')


module.exports = {
    name: "playlist",
    aliases: ['pl'],
    category: "music",
    description: "Saves youtube playlists for easy access later. Note: `^pl gl` currently only works in servers <1000 members due to Discord api restrictions",
    usage: 'run `^pl` for information. ',
    run: async (client, message, args, queue, voice_channel) => { 
        //add in special parameters into root to make this command bypass its restrictions on music cmds
        const playlistTemplate = {
            username: message.author.username,
            user: message.author.id,   
            playlists: []
        }
        // how to mention based off of only ID message.channel.send(`<@${message.author.id}>`)
        var userList = playlists[message.author.id]
            if(!userList){
                playlists[message.author.id] = playlistTemplate
            } else {
                playlists[message.author.id].username = message.author.username
            }

        json('playlists', playlists)
        userList = playlists[message.author.id] 

        function search(title){
            return new Promise(async resolve => {
                for(var i in userList.playlists){
                    if(title == userList.playlists[i].name.toLowerCase()) resolve(i)
                    else if(i == parseInt(userList.playlists.length) - 1) resolve(null)
                } 
            });
        }

        //make version where if no args[0] it returns a embed of what the cmd does and how to use

        if (args[0] && (args[0].toLowerCase() == 'list' || args[0].toLowerCase() == 'l')){
            //formattedPl = formPl
            var formPl = []

            for(var i in userList.playlists){
                formPl.push(`${parseInt(i) + 1}: [${userList.playlists[i].name}](${userList.playlists[i].url}) - **${userList.playlists[i].len}** Songs - AutoShuffle: ${userList.playlists[i].autoShuffle}`)
            }

            pages = await pEmbed(formPl)
            pageNum = 0

            let embed = new Discord.MessageEmbed()
                .setTitle('🗒️ Saved Playlists:')
                .setColor(config.color)
                .setDescription(pages[pageNum].join('\n'))
                .setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})

            message.channel.send({embeds: [embed]}).then(m => {
                m.react('⏮️').catch(() => {return})
                m.react('⏪').catch(() => {return})
                m.react('⏩').catch(() => {return})
                m.react('⏭️').catch(() => {return})

                function reaction(pages) {
                    try{
                    const filter = (reaction, user) => (reaction.emoji.name == '⏮️' || reaction.emoji.name == '⏪' || reaction.emoji.name == '⏩' || reaction.emoji.name == '⏭️') && user.id === message.author.id
                        m.awaitReactions({filter, max: 1, time: 90000})
                            .then(collected => {
                                collected.first().message.reactions.resolve(collected.first().emoji.name).users.remove(message.author.id)
                                    switch (collected.first().emoji.name) {
                                        case '⏮️':
                                            pageNum = 0
                                            embed.setDescription(pages[pageNum].join('\n'))
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                            m.edit({embeds: [embed]}).catch(() => {});
    
                                                return reaction(pages, pageNum)
    
                                        case '⏪':
                                            if(pageNum == 0) {
                                                pageNum = pages.length - 1 
                                            } else pageNum = pageNum -1
    
                                            embed.setDescription(pages[pageNum].join('\n'))
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum) 
    
                                        case '⏩':
                                            if(pageNum == pages.length - 1){
                                                pageNum = 0
                                            } else pageNum = pageNum + 1
                                            embed.setDescription(pages[pageNum].join('\n'))
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum)
    
                                        default:
                                            pageNum = pages.length - 1 
                                            //aka case '⏭️'
                                            embed.setDescription(pages[pageNum].join('\n'))
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum)
                                    }
    
                            }).catch(() => {
                                return m.reactions.removeAll().catch(() => {})
                            });
                        } catch {}
                }
 
                return reaction(pages)
            })

        } else if (args[0] && (args[0].toLowerCase() == 'guildlist' || args[0].toLowerCase() == 'gl')){
            //https://discord.js.org/#/docs/discord.js/stable/typedef/GuildListMembersOptions
            var users = await message.guild.members.list({limit: 1000})
            var gids = []
            
            users.forEach(element => { if(!element.user.bot) gids.push(element.id) });
            
            function gplGet() {
                return new Promise(async resolve =>{
                    var ctr = 0 
                    var gpls = []
                    for(var i in playlists){
                        if(gids.includes(i)){
                            var temp = []
                            var u = await client.users.fetch(i)
                            for(var p in playlists[i].playlists){
                                temp.push(`${parseInt(p) + 1}: [${playlists[i].playlists[p].name}](${playlists[i].playlists[p].url}) - **${playlists[i].playlists[p].len}** Songs - AutoShuffle: ${playlists[i].playlists[p].autoShuffle}`)
                                if(parseInt(p) + 1 == playlists[i].playlists.length){    
                                    gpls[ctr] = {title: `🗒️ Saved playlists of ${u.username}#${u.discriminator}`, desc: temp.join('\n')}
                                }
                            }
                        }
                        ++ctr
                    }
                    resolve(gpls)
                })
            }

            pages = await gplGet()
            pageNum = 0

            let embed = new Discord.MessageEmbed()
                .setTitle(pages[pageNum].title)
                .setColor(config.color)
                .setDescription(pages[pageNum].desc)
                .setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})

            message.channel.send({embeds: [embed]}).then(m => {
                m.react('⏮️').catch(() => {return})
                m.react('⏪').catch(() => {return})
                m.react('⏩').catch(() => {return})
                m.react('⏭️').catch(() => {return})

                function reaction(pages) {
                    try{
                    const filter = (reaction, user) => (reaction.emoji.name == '⏮️' || reaction.emoji.name == '⏪' || reaction.emoji.name == '⏩' || reaction.emoji.name == '⏭️') && user.id === message.author.id
                        m.awaitReactions({filter, max: 1, time: 90000})
                            .then(collected => {
                                collected.first().message.reactions.resolve(collected.first().emoji.name).users.remove(message.author.id)
                                    switch (collected.first().emoji.name) {
                                        case '⏮️':
                                            pageNum = 0
                                            embed.setTitle(pages[pageNum].title)
                                            embed.setDescription(pages[pageNum].desc)
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                            m.edit({embeds: [embed]}).catch(() => {});
    
                                                return reaction(pages, pageNum)
    
                                        case '⏪':
                                            if(pageNum == 0) {
                                                pageNum = pages.length - 1 
                                            } else pageNum = pageNum -1

                                            embed.setTitle(pages[pageNum].title)
                                            embed.setDescription(pages[pageNum].desc)
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum) 
    
                                        case '⏩':
                                            if(pageNum == pages.length - 1){
                                                pageNum = 0
                                            } else pageNum = pageNum + 1

                                            embed.setTitle(pages[pageNum].title)
                                            embed.setDescription(pages[pageNum].desc)
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum)
    
                                        default:
                                            pageNum = pages.length - 1 
                                            //aka case '⏭️'

                                            embed.setTitle(pages[pageNum].title)
                                            embed.setDescription(pages[pageNum].desc)
                                            embed.setFooter({text: `Showing page ${pageNum + 1}/${pages.length}`, iconURL:message.author.displayAvatarURL()})
                                                m.edit({embeds: [embed]}).catch(() => {})
    
                                                return reaction(pages, pageNum)
                                    }
    
                            }).catch(() => {
                                return m.reactions.removeAll().catch(() => {})
                            });
                        } catch {}
                }
 
                return reaction(pages)
            })

        
        } else if (args[0] && (args[0].toLowerCase() == 'save' || args[0].toLowerCase() == 's')){
            if(!args[1]) return errors.noArg(message, 'No playlist URL was given!')
            message.react('🤔').catch(()=>{})

            pl = await plvalidator(args[1])
            if(!pl) return errors.noArg(message, 'No results found! Please check your spelling and/or URL formatting. Perhaps the playlist is private or empty...', false)
                
            message.reactions.removeAll().catch(()=>{})

//test if playlist exists already in user json
            for(var i in userList.playlists){
                if(userList.playlists[i].url == pl.url){
                    errors.noArg(message, `Playlist already is already saved!\n Refreshing currently saved data for entry ${parseInt(i) + 1}`, false)
                    userList.playlists[i] = {name: pl.title.replace(/[^A-z0-9 ]/g, ""), url: pl.url, len: pl.items.length, autoShuffle: userList.playlists[i].autoShuffle}
                    message.react('✅').catch(()=>{})
                    return json('playlists', playlists)
                }
            }   

            message.react('✅').catch(()=>{})

            if(args[2] && (args[2].toLowerCase() == 'true' || args[2].toLowerCase()== 't')){
                var temp = true
            } else {
                var temp = false
            }
//replace syntax
            userList.playlists.push({name: pl.title.replace(/[^A-z0-9 ]/g, ""), url: pl.url, len: pl.items.length, autoShuffle: temp}) 
            json('playlists', playlists)
            
        } else if (args[0] && (args[0].toLowerCase() == 'delete' || args[0].toLowerCase() == 'd')){
            if(!args[1]) return errors.noArg(message, 'No playlist was specified!') 
            if(!userList.playlists) return errors.noArg(message, 'No playlists are saved!')
            args.shift(args)
            title = args.join(' ').replace(/[^A-z0-9 ]/g, "").toLowerCase()

            if(args.length == 1){
                var num = parseInt(title)
                if(num){
                    numtest(message, num, 0, userList.playlists.length).then (n => runDelete(parseInt(n) - 1))
  
                } else {
                    sel = await search
                        if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                        runDelete(sel)
                }

            } else {    
                sel = await search(title)
                    if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                    runDelete(sel)
            }

            async function runDelete(sel){
                tmp = userList.playlists.splice(sel, 1)
                playlists[message.author.id] = userList
                json('playlists', playlists)
                message.react('✅').catch(()=>{})

                embed = new Discord.MessageEmbed()
                    .setDescription(`Removed playlist ${parseInt(sel) + 1} - [${tmp[0].name}](${tmp[0].url})`)
                    .setColor(config.color)
                message.reply({embeds: [embed]})
            }

        } else if (args[0] && (args[0].toLowerCase() == 'refresh' || args[0].toLowerCase() == 'r')) {
            if(!userList.playlists.length) return errors.noArg(message, 'No playlists are saved!', false)
            
            async function getRefresh(){
                return new Promise(async resolve =>{
                    var list = []
                    message.react('🤔').catch(() => {})
                    for(var i in userList.playlists){
                        pl = await plvalidator(userList.playlists[i].url)
                        if(!pl) continue
                        list.push({name: pl.title.replace(/[^A-z0-9 ]/g, ""), url: pl.url, len: pl.items.length, autoShuffle: userList.playlists[i].autoShuffle}) 
    
                        if(i == parseInt(userList.playlists.length) - 1) resolve(list)  
                    }
                })
            }

            let list = await getRefresh()
                message.reactions.removeAll().catch(()=>{})
                message.react('✅').catch(()=>{})
                playlists[message.author.id].playlists = list
                json('playlists', playlists)
            
        } else if (args[0] && (args[0].toLowerCase() == 'autoshuffle' || args[0].toLowerCase() == 'as')){
            if(!args[1]) return errors.noArg(message, 'No playlist was specified!') 
            if(!userList.playlists) return errors.noArg(message, 'No playlists are saved!')
            args.shift(args)
            title = args.join(' ').replace(/[^A-z0-9 ]/g, "").toLowerCase()

            if(args.length == 1){
                var num = parseInt(title)
                if(num){
                    numtest(message, num, 0, userList.playlists.length).then(n => runToggle(parseInt(n) - 1))
  
                } else {
                    sel = await search(title)
                        if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                        runToggle(sel)
                }

            } else {    
                sel = search(title)
                    if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                    runToggle(sel)
            }

            function runToggle(n){
                sel = userList.playlists[n].autoShuffle
                userList.playlists[n].autoShuffle = !sel
                json('playlists', playlists)
                message.react('✅').catch(()=>{})
            }
    
        } else if (args[0] && (args[0].toLowerCase() == 'play' || args[0].toLowerCase() == 'p')){
            mention = message.mentions.users.first()
            if(mention) {
                var userList = playlists[mention.id]
                if(!userList){
                    playlists[mention.id] = playlistTemplate
                } else {
                    playlists[mention.id].username = mention.username
                }
            }

            if(!args[1]) return errors.noArg(message, 'No playlist was specified!') 
            if(!userList.playlists) return errors.noArg(message, `No playlists are saved for <@${userlist.id}>!`)
            args.shift(args)
            title = args.join(' ').replace(/[^A-z0-9 ]/g, "").toLowerCase()

            if(args.length == 1){
                var num = parseInt(title)
                if(num){
                    numtest(message, num, 0, userList.playlists.length).then(n => runPlay(parseInt(n) - 1))
  
                } else {
                    sel = await search(title)
                        if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                        runPlay(sel)
                }

            } else {    
                sel = await search(title)
                    if(!sel) return errors.noArg(message, 'Perhaps check your spelling...', false, 'No playlist found!')
                    runPlay(sel)
            }

            function runPlay(n){
                client.commands.get('play').run(client, message, [userList.playlists[n].url], queue, voice_channel, userList.playlists[n].autoShuffle)
            }

        } else {
            let embed = new Discord.MessageEmbed()
                .setTitle('🗒️ Playlist command:')
                .setColor(config.color)
                .setDescription(`
\`${config.prefix}pl\` ~ Presents this message.

\`${config.prefix}pl <list/l>\` ~ Shows a list of all the saved playlists

\`${config.prefix}pl <guildlist/gl>\` ~ Shows a list of all the saved playlists of every user in the guild. You can then play these by doing \`${config.prefix}pl p <mention> <url> <true/t/false/f>\`

\`${config.prefix}pl <save/s>\` ~ Saves a playlist. Enter the URL and if you'd like the playlist to autoshuffle
Usage: \`${config.prefix}pl s <url> <true/t/false/f>\`

\`${config.prefix}pl <delete/d>\` ~ Deletes a saved playlist. Enter the number or name of the playlist you'd like to delete
Usage: \`${config.prefix}pl d <name/num>\`

\`${config.prefix}pl <refresh/r>\` ~ Refreshes the bots saved playlist data and removes deleted playlists. This is only for refreshing the display data, the bot does the rest automatically.

\`${config.prefix}pl <autoshuffle/as>\` ~ Toggles auto-shuffling for the specified playlist.
Usage: \`${config.prefix}pl as <name/num>\`

\`${config.prefix}pl <play/p>\` ~ Selects a playlist to play out of the saved lists via name or number
Usage: \`${config.prefix}pl p <name/number>\`
            `)
            .setFooter({text: `Syntax: <> = required, [] = optional`})

            message.reply({embeds: [embed]})
        }
    }
}
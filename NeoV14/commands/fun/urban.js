const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const config = require('../../jsons/config.json')
const errors = require('../../utils/errors.js')
const superagent = require('superagent')

module.exports = {
    aliases: [],
    category: '',
    data: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Randomly picks a number between a lower and upper bound.')
        .addStringOption(option => option.setName('term')
            .setDescription('Term to search the Urban Dictionary with. If left blank, you will recieve a random phrase.')
        ),
        async run (interaction) {
            const term = interaction.options.getString('term')
            let link = term ? `https://api.urbandictionary.com/v0/define?term=${term}` : 'https://api.urbandictionary.com/v0/random'
            
            let {body} = await superagent
                .get(link)
                .catch(e => { return errors.noArg(interaction, title = 'No results found!', body = `\`${term}\` has no results, check your spelling and try again!`)})

            res = body.list
                if(!res || !res.length) return errors.noArg(interaction, title = 'No results found!', body = `\`${term}\` has no results, check your spelling and try again!`)

            async function sort () {
                return new Promise(async resolve => {
                  var max = 0
                  for(var i in res){
                    if((res[i].thumbs_up - res[i].thumbs_down) > max){
                      max = (res[i].thumbs_up - res[i].thumbs_down)
                      highestScore = i
                    }
                  }
                  resolve(highestScore)
                });
            }

            res = res[await sort()]

            let embed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(res.word)
                .setURL(res.permalink)
                .setDescription(`**Definition:**\n*${res.definition}*`)
                .addFields(
                    {name: `**Example:**`, value:`*${res.example}*`},
                    {name: '**Author**', value: res.author, inline: true},
                    {name: '**Rating**', value: `**\`Upvotes: ${res.thumbs_up} | Downvotes: ${res.thumbs_down}\`**`, inline: true}
                );
        
            interaction.editReply({embeds: [embed]}).catch(() => {errors.noArg(interaction, `The result is too long for the bot to display... here's the link to the [article](${res.permalink})!`, false)});
    
        }
}
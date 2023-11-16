const {SlashCommandBuilder, EmbedBuilder}  = require('discord.js')
const config = require('../../jsons/config.json')

module.exports = {
    aliases: [],
    category: '',
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Displays the invite link, simple as that!'),

        async run (interaction) {
            let embed = new EmbedBuilder()
                .setAuthor({name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL()})
                .setColor(config.color)
                .setDescription(`Here's my invite [link](https://discord.com/oauth2/authorize?client_id=${interaction.client.application.id}&permissions=8&scope=applications.commands%20bot)!`)

            interaction.editReply({embeds: [embed]})
            
        }
}
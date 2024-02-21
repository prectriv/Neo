const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const config = require('../../jsons/config.json')

module.exports = {
    aliases: [],
    ephemeral: true,
    category: '',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the full list of commands.'),

    async run(interaction) {
        interaction.editReply('This currently is a placeholder.')

    }
}
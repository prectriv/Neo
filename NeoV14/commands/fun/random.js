const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const config = require('../../jsons/config.json')
const errors = require('../../utils/errors.js')

module.exports = {
    aliases: ['rndm', 'numb'],
    category: '',
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Randomly picks a number between a lower and upper bound.')
        .addIntegerOption(option => option.setName('upper')
            .setDescription('The highest number the bot could choose.')
            .setRequired(true)
        )
        .addIntegerOption(option => option.setName('lower')
            .setDescription('The lowest number the bot could choose. Defaults to 0')
        ),

    async run(interaction) {
        low = interaction.options.getInteger('lower') ?? 0
        high = interaction.options.getInteger('upper')
        if (low == high) return errors.noArg(interaction, `The chosen number is **${low}**.`, 'The lower bound and upper bound are the same number...')
        if (low > high) [low, high] = [high, low]

        let pick = Math.floor(Math.random() * (high - low + 1)) + low

        let embed = new EmbedBuilder()
            .setDescription(`I choose: **${pick}**`)
            .setColor(config.color)
            .setFooter({ text: `From ${low}:${high}`, iconURL: interaction.user.displayAvatarURL() })
        interaction.editReply({ embeds: [embed] })
    }
}
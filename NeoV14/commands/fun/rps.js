const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { negHex, warnHex, posHex } = require('../../jsons/config.json')

module.exports = {
    aliases: [],
    category: '',
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('play a simple game of Rock-Paper-Scissors with the bot!')
        .addStringOption(option => option.setName('choice')
            .setDescription('Your move against the bot.')
            .setRequired(true)
            .addChoices(
                { name: 'Rock', value: '0' },
                { name: 'Paper', value: '1' },
                { name: 'Scissors', value: '2' }
            )
        ),

    async run(interaction) {
        let outputC = ['Rock', 'Paper', 'Scissors']
        let winText = [`it's a draw!`, 'I win!', 'you win!']

        choice = parseInt(interaction.options.getString('choice'))

        i = 0
        while (i < choice) {
            outputC.push(outputC.shift())
            i++
        }

        win = Math.floor(Math.random() * 3) //0 = draw, 1 = bot win, 2 = user win
        //if(win == 0) color = warnHex else if(win == 1) color = negHex else color = posHex
        let color = win == 0 ? warnHex : win == 1 ? negHex : posHex

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Rock, Paper, Scissors!" })
            .setColor(color)
            .addFields(
                { name: "You chose", value: `${outputC[0]}!`, inline: true },
                { name: "I chose...", value: `${outputC[win]}, ${winText[win]}`, inline: true }
            )

            .setFooter({ text: `Battling against ${interaction.user.username}!`, iconURL: interaction.user.displayAvatarURL() })
        interaction.editReply({ embeds: [embed] })

    }

}
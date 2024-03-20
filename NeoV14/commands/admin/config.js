const { SlashCommandBuilder } = require('discord.js')
const { guildPref } = require('../../libs/gdb.js')

module.exports = {
    aliases: ['cfg', 'pref'],   // array of aliases for the command. Will Dynamically add them to the commandhandler.
    ephemeral: false, // true or false - if true, the command will only be visible to the user who ran it.
    category: '', // category of the command. Will be used for the help command (currently a placeholder)
    data: new SlashCommandBuilder()
        .setName('config') // name of command should be the same as file name.
        .setDescription('Sets the server configuration for this server')
        .addStringOption(option => option.setName('setting')
            .setDescription('The name of the option you\'d like to change. Leave blank for a printout.')
            .setRequired(false)
        ),

    async run(interaction) {
        const name = interaction.options.getString('setting');
        let gp = await guildPref.findByPk(interaction.guild.id);





    }
}
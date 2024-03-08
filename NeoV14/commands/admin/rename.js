const { SlashCommandBuilder } = require('discord.js')
const { vcCreator } = require('../../libs/gdb.js')

module.exports = {
    aliases: [],   // array of aliases for the command. Will Dynamically add them to the commandhandler.
    ephemeral: true, // true or false - if true, the command will only be visible to the user who ran it.
    category: '', // category of the command. Will be used for the help command (currently a placeholder)
    data: new SlashCommandBuilder()
        .setName('rename') // name of command should be the same as file name.
        .setDescription('renames a VC if it was created by the temp system') // description of the command.
        .addStringOption(option => option.setName('name').setDescription('The new name for the VC').setRequired(true)),

    async run(interaction) {
        const name = interaction.options.getString('name');
        let gvc = await vcCreator.findByPk(interaction.guild.id);
        if (!gvc) return interaction.editReply({ content: 'This server does not have the VC Creator system enabled.', ephemeral: true });

        let vcObject = gvc.spawnedVCs.filter(vc => vc == interaction.channel.id);
        if (vcObject[0] != undefined) {
            let channel = interaction.guild.channels.cache.get(interaction.channel.id);
            //see if the user is in the channel
            if (interaction.member.voice.channelId != channel.id) return interaction.editReply({ content: 'You must be in the VC to rename it.', ephemeral: true });

            channel.setName(name.slice(0, 100));
            interaction.editReply({ content: `VC name set to: \`${name.slice(0, 100)}\`!`, ephemeral: true });
        } else {
            interaction.editReply({ content: 'This channel was not created by the VC Creator system.', ephemeral: true });
        }

    }
}
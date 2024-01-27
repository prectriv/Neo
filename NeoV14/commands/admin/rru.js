const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const {rr} = require('../../libs/gdb.js');

const errors = require('../../utils/errors.js');
const {rrEditMessage} = require('../../utils/functions.js');

module.exports = {
	aliases: [],
	category: '',
	ephemeral: true,
	data: new SlashCommandBuilder()
		.setName('rru')
		.setDescription('Forces an update to the RR system. (use if the message is incorrect/did not update)'),

		async run (interaction) {
            //edit message
            await rrEditMessage(interaction);
		
			//reply to interaction to show success.
			interaction.editReply({content: `Reaction roles message updated!`})
		}
	}
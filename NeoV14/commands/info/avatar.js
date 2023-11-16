const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAverageColor } = require('fast-average-color-node');


module.exports = {
     aliases: ['pfp'],
     category: '',
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Displays the specified users avatar, or your avatar if no user is provided.')
		.addUserOption(option => option.setName('user')
               .setDescription('The user\'s avatar to show. Leave blank if you want your own.')
          ),

          async run (interaction) {
               const user = interaction.options.getUser('user') || interaction.user
               let img = user.displayAvatarURL({ dynamic: true , size: 4096 , format: "png" })
               const color = await getAverageColor(img);
          
               let embed = new EmbedBuilder()
                    .setTitle(user.username)
                    .setColor(color.hex)
                    .setURL(img)
                    .setImage(img)
          
               interaction.editReply({embeds: [embed]});
	}
};
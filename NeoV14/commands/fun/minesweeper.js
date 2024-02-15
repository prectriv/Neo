const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	aliases: [],   // array of aliases for the command. Will Dynamically add them to the commandhandler.
	ephemeral: BOOLEAN, // true or false - if true, the command will only be visible to the user who ran it.
	category: '', // category of the command. Will be used for the help command (currently a placeholder)
	data: new SlashCommandBuilder()
		.setName('minesweeper') // name of command should be the same as file name.
		.setDescription('Generates a playable 5x5 minesweeper played with buttons'), // description of the command.
	//other args from the SlashCommandBuilder can be added here. 

	async run(interaction) { // other args can be added after the interaction of the commandhandler is configured to do so.
		//actual code of the command.
	}
}
const {SlashCommandBuilder}  = require('discord.js');
const { vcCreator } = require('../../libs/gdb');

module.exports = { 
    aliases: ['vcc'],
    ephemeral: false, 
    category: '', // category of the command. Will be used for the help command (currently a placeholder)
    data: new SlashCommandBuilder()
        .setName('vcCreator')
        .setDescription('Initalizes the vcCreation System.'), 

        async run (interaction) { 
            /*
            Creates the database after checking if one already exists. If one does exist, prompts for user to either delete or reset the db 
                deletes the db if user chooses to delete it.
                deletes the db and then runs as normal the db if user chooses to reset it.

            when deleting the db: delete the category for this vc manipulation, and delete all the vcs in it.
                could run into issues if the category is deleted with manually created channels by server admins.
            */
        }
}
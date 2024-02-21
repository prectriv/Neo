const Discord = require("discord.js");
let config = require("../jsons/config.json");
//errors = require(`/home/pi/Desktop/bot/utils/errors.js`);

// module.exports.noPerms = (interaction, perm) => {
//     let embed = new Discord.EmbedBuilder()
//         .setAuthor(interaction.author.username)
//         .setColor(config.negHex)
//         .setTitle('Error')
//         .setDescription(`Permission(s) needed: ${perm}`);
// //return errors.noPerms(interaction, "MANAGE_ROLES");

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

// module.exports.jsonErr = (interaction, json) => {

//     let embed = new Discord.EmbedBuilder()
//         .setColor(config.negHex)
//         .setTitle("Error")
//         .setDescription(`There has been an error while writing to the ${json}.json file. Please contact my creator with some context of the error.`);

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

// module.exports.noValue = (interaction) => {

//     let embed = new Discord.EmbedBuilder()
//         .setColor(config.negHex)
//         .setTitle("Error")
//         .setDescription('No or invalid value given.')

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

// module.exports.noNumber = (interaction, numb) => {

//     let embed = new Discord.EmbedBuilder()
//         .setColor(config.negHex)
//         .setTitle("Error")
//         .setDescription(`\`${numb}\` is an invalid number.`)

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

// module.exports.noUser = (interaction) => {
//     let embed = new Discord.EmbedBuilder()
//         .setTitle("Error")
//         .setDescription("No valid user provided.")
//         .setColor(config.negHex);

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

// module.exports.owner = (interaction) => {
//     let embed = new Discord.EmbedBuilder()
//         .setTitle("Error")
//         .setDescription("You are not on my dev team, only they may execute this.")
//         .setColor(config.negHex);

//     interaction.reply({embeds: [embed]}).then(msg => (setTimeout(() => msg.delete().catch(() => {}), 5000)));
// }

module.exports.noArg = (interaction, body, title = 'Error') => {
    let embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(body)
        .setColor(config.negHex)

    interaction.editReply({ embeds: [embed] })
}
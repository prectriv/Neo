const { rr } = require('../../libs/gdb.js')
const { EmbedBuilder } = require('discord.js')
const { rrEditMessage } = require('../../utils/functions.js')
const config = require('../../jsons/config.json')

async function rri() {
    let roleID = interaction.customId.split("_")[2] // ["RR", guildID, roleID]
    let rrGuild = (await rr.findByPk(interaction.guild.id)) //fetch from db
    if (!rrGuild) return;

    //Find the role, then attempt to add it.
    let role = interaction.guild.roles.cache.get(roleID);
    if (!role) return rrEditMessage(interaction); //role doesnt exist to update msg

    let embed = new EmbedBuilder()
    if (interaction.member.roles.cache.has(roleID)) { //if the user has the role, remove it.
        await interaction.member.roles.remove(roleID) //remove the role
        embed.setColor(config.negHex).setDescription(`${role} has been removed.`);
    } else { //if the user does not have the role, add it.
        await interaction.member.roles.add(roleID) //add the rolee
        embed.setColor(config.posHex).setDescription(`${role} has been added.`);
    }

    await interaction.reply({ embeds: [embed], ephemeral: true }); //reply to interaction to show success.
    await rrEditMessage(interaction); //edit message

}

module.exports = { rri }
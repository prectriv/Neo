const { unverified, verified, blacklist } = require('../../libs/wldb.js')
const whitelist = require(`../../../Bungee4/lobby/whitelist.json`)
const minersRoleID = "1075267520644263956"
const fs = require("fs")
const { EmbedBuilder } = require('discord.js')
const config = require('../../jsons/config.json')

async function wli(interaction) {
    let id = interaction.customId.split("_")[2]
    //fetch from db
    let unvUser = (await unverified.findByPk(id))
    if (!unvUser) return;

    if (interaction.customId.includes("VERIFY")) {
        //Add the role!
        interaction.member.roles.add(minersRoleID)
        //push data to wl and DB
        whitelist.push(unvUser.mc)
        //TODO: change this to using mincraft RCON port
        //https://wiki.vg/RCON 
        fs.writeFileSync(WLPath, JSON.stringify(whitelist), (err) => { if (err) return console.log(err) }) //write to WL.json file.

        let embed = new EmbedBuilder()
            .setTitle(`Whitelisted user:`)
            .setColor(config.posHex)
            .setDescription(`<@${id}> has been waitlisted under the account: \n**${unvUser.mc.name} | \`${unvUser.mc.uuid}\`**`);

        interaction.reply({ embeds: [embed] });
        interaction.message.delete()

        try {
            //fetch origonal message stored in the db
            let wl_channel = await interaction.guild.channels.cache.get('755232058049298465')
            let wlMsg = await wl_channel.messages.fetch(unvUser.wlMsg)
            wlMsg.delete()

            let acceptEmbed = new EmbedBuilder()
                .setTitle('Whitelisted Successfully!')
                .setColor(config.posHex)
                .setDescription(`You have been whitelisted with the username: **${unvUser.mc.name}**!`);

            wl_channel.send({ content: `<@${id}>`, embeds: [acceptEmbed], components: [] });
        } catch (e) { return console.log(e) }
        //make verified
        let vUser = new verified({ id: id, uuid: unvUser.mc.uuid })
        await vUser.save();
        //delete unv
        await unverified.destroy({ where: { id: id } })

    } else { //blacklist
        try {
            let wlMsg = await wl_channel.messages.fetch(unvUser.wlMsg)
            wlMsg.delete()
        } catch { }

        try {
            //fetch origonal message stored in the db
            let wl_channel = await interaction.guild.channels.cache.get('755232058049298465')
            let wlMsg = await wl_channel.messages.fetch(unvUser.wlMsg)

            let blacklistEmbed = new EmbedBuilder()
                .setTitle('Blacklisted')
                .setColor(config.negHex)
                .setDescription(`<@${id}> has been blacklisted and will not be able able to whitelist again.\nPlease contact an admin if you believe this is a mistake.`);

            wlMsg.edit({ embeds: [blacklistEmbed], components: [] });
            interaction.reply({ embeds: [blacklistEmbed.setDescription(`<@${id}> has been blacklisted and will not be able able to whitelist again.`)] });
            interaction.message.delete();

            //make blacklist
            let blUser = await new blacklist({ id: id });
            blUser.save()

            //delete unv user.
            await unverified.destroy({ where: { id: id } })

        } catch { };
    }
}

module.exports = { wli }
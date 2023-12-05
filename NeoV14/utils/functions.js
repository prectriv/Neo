function capitalize(text){
    if (typeof text !== 'string') return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
}

const {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const config = require('../jsons/config.json');
/**
 * Edits the message for the reaction roles.
 * @param {*} rr the reaction role DB
 * @param {*} interaction the interaction that triggered the edit.
 */
async function rrEditMessage(rr, interaction) {
    //Once the roles have all been added, manage the message.
    await rr.findOne({where: {guild: interaction.guild.id}}).then(async grr => {
        let descriptionBuilder = [];
        for(let i = 0; i < grr.roles.length; i++) {//for each role in the DB, add it to the description.
            descriptionBuilder.push(`${i + 1}) <@&${grr.roles[i].id}> - ${grr.roles[i].desc}`);
        }
        
        descriptionBuilder = descriptionBuilder.join("\n"); //join the description elements with newlines.

        let embed = new EmbedBuilder() // create embed with dybamically generated description.
            .setTitle('Reaction Roles')
            .setColor(config.color)
            .setDescription(descriptionBuilder)
            .setFooter({text: 'React to this message to get a role!'});
    
        let interactionRows = []
        //create buttons
        for(let i = 0; i < 5; i++) {//for each row up to five.
            let buttons = [];
            for(let j = 5 * i; j < 5 * (i + 1); j++){ // 5 buttons per row, incrementing in 5s based on the row number.
                let role = grr.roles[j];
                if(!role) break;
                buttons.push( // create a button and add it to the array.
                    new ButtonBuilder()
                        .setCustomId(`RR_${interaction.guild.id}_${role.id}`)//how to determine the role id.
                        .setLabel(`${role.name}`)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            if(buttons.length == 0) break; //if there are no buttons, break.
            interactionRows.push(new ActionRowBuilder().addComponents(buttons)); //add the row to the rows list.
            if(buttons.length != 5) break; //if there are less than 5 buttons, break.
        }

        //fetch message
        let msg = await interaction.channel.messages.fetch(grr.message); 
            //edit message
            msg.edit({context: '', embeds: [embed], components: [...interactionRows]});

    });
}

module.exports = {
    capitalize,
    rrEditMessage
}
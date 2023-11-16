const config = require("../jsons/config.json")
const WLPath = /*"../*/`${__dirname}/../../Bungee4/lobby/whitelist.json`
const whitelist = require(WLPath)
const errors = require('../utils/errors.js');
const {verified} = require('../libs/db.js');
const fs = require("fs")

//marked for deletion.
module.exports = {
	name: 'messageReactionAdd',
	async run (reaction, user, token) {
        return 
		console.log(reaction)
		if (member.guild.id != config.myServer) return;
		let currentUser = await verified.findOne({where: {id: member.id}});
		if (currentUser){
			for (let j = 0; j < whitelist.length; j++) {
				if(whitelist[j].uuid == currentUser.uuid){
					whitelist.splice(j, 1)
					fs.writeFileSync(WLPath , JSON.stringify(whitelist), (err) => {if(err) return console.log(err)})
					break
				}
			}

			await verified.destroy({where: {id: member.id}});
					 
		}
	}
}
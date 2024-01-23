module.exports = {
	name: 'roleDelete',
	async run (role, token) {
		const {rr} = require('../libs/gdb.js');

		// Guild Reaction Roles
		await rr.findOne({where: {guild: role.guild.id}}).then(async grr => {
			if(grr != null){ //if DB exists, attempt removing the role fom the DB
				grr.roles.forEach(async r => { //check if the role existed in the DB before.
					if(r.id == role.id) {
						grr.roles = grr.roles.filter(r => r.id != role.id);
								
						if(grr.roles.length == 0) { //if there are no more roles, delete the DB.
							let msg = await role.guild.channels.cache.get(grr.channel).messages.fetch(grr.message); 
								msg.delete();

							await rr.destroy({where: {guild: role.guild.id}});
							return;
						}

						await grr.save();
					}
				});
			}
		});
	}
}
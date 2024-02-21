const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const commands = [];

module.exports = {
    async run(client, token) {
        fs.readdirSync('./commands/').forEach(dir => {
            const commandFiles = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith('.js'));

            let categoryFiles = []
            commandFiles.forEach(f => { categoryFiles.push(f.slice(0, -3)) })
            client.categories.set(dir, categoryFiles)


            for (var file of commandFiles) {
                let command = require(`../commands/${dir}/${file}`);

                commands.push(command.data.toJSON());
                command.category = dir
                client.commands.set(command.data.name, command)

                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        let editedc = command.data.toJSON()
                        editedc.name = alias
                        editedc.description = `Alias of /${command.data.name} | ${command.data.description}`
                        commands.push(editedc)
                        client.aliases.set(alias, command.data.name)
                    });
                }
            }
        });

        const rest = new REST({ version: '10' }).setToken(token);

        rest.put(Routes.applicationCommands(client.application.id), { body: commands })
            .then(() => console.log('Successfully registered global application commands.'))
            .catch(console.error);

    }
}

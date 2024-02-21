module.exports = {
    name: 'ready',
    once: true,
    run(client, token) {
        require("../utils/deploycmd.js").run(client, token)
        console.log('Ready!');

        // below is code for leaving guilds.
        //    const Guilds = client.guilds.cache.map(guild => guild.id);
        //     console.log(Guilds);
        //     g1 = client.guilds.cache.get('949822724056940575')
        //     g2 = client.guilds.cache.get('750162421452243024')
        //     g1.leave()
        //     g2.leave()
        //    console.log(g1,g2)
    }
}
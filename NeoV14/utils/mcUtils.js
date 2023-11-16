const errors = require('../utils/errors.js');
const superagent = require('superagent');

async function UUIDFormat(uuid) {
    const id = []
        id.push(uuid.slice(0,8));
        id.push(uuid.slice(8,12));
        id.push(uuid.slice(12,16));
        id.push(uuid.slice(16,20));
        id.push(uuid.slice(20));

    return id.join('-')
}

async function fetchMc(interaction, username) {
    return new Promise(async resolve => {
        try {
            var {body, status} = await superagent.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            if (status != 200) return errors.noArg(interaction, `Invalid Username: **${username}**. Perhaps check the spelling.`) //html status code 200 - success
        } catch { 
            return errors.noArg(interaction, `Invalid Username: **${username}**. Perhaps check the spelling.`) 
        }
        let id = await UUIDFormat(body.id)
        resolve({uuid: id, name: body.name})
    })  
}

async function fetchMcUUID(uuid) { // has no catch/error handling as if this fails, then I fucked up somewhere in terms of db handling and whitelist file-ing.
    return new Promise(async resolve => {
        var {body} = await superagent.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
        let id = await UUIDFormat(body.id)
        resolve({uuid: id, name: body.name})
    })  
}

module.exports = {
    UUIDFormat,
    fetchMc,
    fetchMcUUID
}

# NeoV14

## Folder Structure
> [!Note]
> Please note that this folder structure is designed in a way that allows all new commands and event handlers to be added dynamically without speific configuration by the user in any other manner other than following the structure present in these files.
> Check `./index.js` and `./utils/deploycmd.js` for more information.

- `./commands/`
    - This folder contains subfolders each pertaining to their category name like so: `/<category>/<name>.js`
    - Within those folders, there are individual command files 
- `./events/`
    - This folder contains discord event handler files named for the event in which they correspond to
    - Ex) `./events/guildMemberRemove.js` is the guildMemberRemove event.
- `./libs/`
    - This folder currently contains two files, one for each database this bot uses. Each database has multiple purposes and functionality, though it is broken up for easier debugging and testing.
- `./utils/`
    - This folder contains utility and helper functions for commands
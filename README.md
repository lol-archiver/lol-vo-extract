# lol-vo-extract
League of Legends champion voices download, extract with renamed events.

**Most of implementation based on [CDTB](https://github.com/CommunityDragon/CDTB). Sincerely Thanks!**

## ATTENTION PLEASE
`lol-vo-extract` does not guarantee 100% match for all events for all skin:
- Because different skins have **different** production dates and packaging formats, it is very easy to extract out unknown events.
- Sometimes the literal and actual trigger are different!

Some not perfect match as following:
* Lux: Not all events from `skin*.BIN` and `_event.bnk` can match. Need to match manually through `data/EventIDMap/Lux.json`;
* Twist Fate: `VO` and `SFX` are not independent of each other. Need to increase `sfxLevel`.
* Mecha Kingdoms Jax: The event `JaxRelentlessAssault` shows that the trigger of this is to activate the passive `Relentless Assault`. But in the actual game, the trigger is to use the R skill `Grandmaster's Might`.

## Requirement
- Node.js 14.X+
- Package which published on my private NPM BUT NOT published on `npmjs.com`.  
	You can clone them and install them locally
	- [@nuogz/hades](https://github.com/zheung/hades)
	- [@nuogz/poseidon](https://github.com/zheung/poseidon)

## Usage
The entry file is `index.js`. All extracted files will be stored in `_final` folder:
````batch
cd lol-vo-extract
node index
````

## Config
- `lol-vo-extract` uses `config/config.*.json` to determine the behavior of everything. 
- `config/config.example.*.jsonc` contains all available options and comments.

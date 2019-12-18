# lol-vo-extract
League of Legends Champion Voices Download/Extract/Rename with events.

Most of implementation based on [CDTB](https://github.com/CommunityDragon/CDTB)'s by Node.js 10.X+. Sincerely Thanks!

## Installation

`lol-vo-extract` requires Node v10.X+ or higher for ES2015, Async function and BigInt support. (v8.X+ maybe OK, v6.X should be not)

Before use, should install npm package:
````javascript
	npm install
````

NOTE: `lol-vo-extract` uses [xxhash](https://github.com/mscdex/node-xxhash). It is a C library that need to rebuild when installing. If rebuild failed, consider install [Windows-Build-Tools](https://github.com/felixrieseberg/windows-build-tools) at first.

## Usage
	`lol-vo-extract` use `config.js` determined all. `config.default.js` is sample.
````javascript
module.exports = {
	channel: 'pbe-pbe-win',
	solution: 'game',
	cdn: 'https://lol.dyn.riotcdn.net',

	proxy: false,
	// proxy: { host: '127.0.0.1', port: 9000, },

	hero: 'annie',
	lang: 'en_us',

	skinMax: 50,

	finalFormat: 'wav',

	rextractorConsolePath: 'D:/RavioliGameTools/RExtractorConsole.exe',
};
````

## Convert WEM to WAV/OGG

Currently, `lol-vo-extract` can extract `WEM` directly.

`lol-vo-extract` also support convert `WEM` to `WAV` or `OGG` by calling `RExtractorConsole.exe`. You need to configure `rextractorConsole` at First.

````javascript
module.exports = {
	// ...
	rextractorConsolePath: 'D:/RavioliGameTools/RExtractorConsole.exe',
	// ...
};
````
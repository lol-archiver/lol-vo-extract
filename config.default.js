module.exports = {
	region: 'NA1',
	solution: 'game',
	cdn: 'https://lol.dyn.riotcdn.net',
	sie: 'https://sieve.services.riotcdn.net',

	proxy: false,
	// proxy: { host: '127.0.0.1', port: 9000, },

	champ: 'annie',
	lang: 'en_us',
	format: 'wav',

	// 0, no SFX; 1, only asset; 2, all
	useSFXLevel: 0,
	// 0, cache first; 1, force fetch; 2, use client file
	useWADLevel: 0,

	detect: {
		baseForce: false,

		array: [],

		min: 0,
		max: 27,
	},

	path: {
		rextractorConsole: 'D:/RavioliGameTools/RExtractorConsole.exeRExtractorConsole.exe',
		game: 'D:/Game/League of Legends',
	}
};
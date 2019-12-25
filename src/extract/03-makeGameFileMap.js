const makePathSoundBank = function(usage, lang, hero, index, type, format, version = '2016') {
	return `assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${lang}/` : ''}characters/${C.hero}/skins/${index}/${C.hero}_${index}_${usage}_${type}.${format}`;
};
const makeArrPathSoundBank = function(usage, lang, hero, index, version = '2016') {
	return [
		[makePathSoundBank(usage, lang, hero, index, 'audio', 'wpk', version), `${usage}_${index}_audio.wpk`],
		[makePathSoundBank(usage, lang, hero, index, 'audio', 'bnk', version), `${usage}_${index}_audio.bnk`],
		[makePathSoundBank(usage, lang, hero, index, 'events', 'bnk', version), `${usage}_${index}_event.bnk`],
	];
};

module.exports = function makeGameFileDict() {
	L(`[Main] Make game files hash dict`);

	const mapHash_GameFile = {};
	const usages = C.sfxLevel ? ['vo', 'sfx'] : ['vo'];

	for(const usage of usages) {
		for(let i = 0; i <= C.skinMax; i++) {
			mapHash_GameFile[T.wadHash(`data/characters/${C.hero}/skins/skin${i}.bin`)] = `skin${i}.bin`;
		}

		for(const [pathSoundBank, simpleName] of makeArrPathSoundBank(usage, C.lang, C.hero, 'base')) {
			mapHash_GameFile[T.wadHash(pathSoundBank)] = simpleName;
		}

		for(let i = 0; i <= C.skinMax; i++) {
			for(const [pathSoundBank, simpleName] of makeArrPathSoundBank(usage, C.lang, C.hero, String(i).padStart(2, '0'))) {
				mapHash_GameFile[T.wadHash(pathSoundBank)] = simpleName;
			}
		}
	}

	return mapHash_GameFile;
};
const genPathSoundBank = function(usage, lang, champion, index, type, format, version = '2016') {
	return `assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${lang}/` : ''}characters/${C.champ}/skins/${index}/${C.champ}_${index}_${usage}_${type}.${format}`;
};

const genArrPathSoundBank = function(usage, lang, champion, index, version = '2016') {
	return [
		[genPathSoundBank(usage, lang, champion, index, 'audio', 'wpk', version), `${usage}_${index}_audio.wpk`],
		[genPathSoundBank(usage, lang, champion, index, 'audio', 'bnk', version), `${usage}_${index}_audio.bnk`],
		[genPathSoundBank(usage, lang, champion, index, 'events', 'bnk', version), `${usage}_${index}_event.bnk`],
	];
};

module.exports = function genNameFiles_hash() {
	L(`[Main] Generate a name map to in-wad files, indexed by path-hashes`);

	const nameFiles_hash = {};

	const usages = C.useSFXLevel ? ['vo', 'sfx'] : ['vo'];

	const infoFiles = [];
	for(const usage of usages) {
		for(const i of C.detect.array) {
			nameFiles_hash[T.wadHash(`data/characters/${C.champ}/skins/skin${i}.bin`)] = `skin${i}.bin`;

			infoFiles.push(...genArrPathSoundBank(usage, C.lang, C.champ, `skin${String(i).padStart(2, '0')}`));
		}

		if(C.detect.array.includes(0) || C.detect.baseForce) {
			infoFiles.push(...genArrPathSoundBank(usage, C.lang, C.champ, 'base'));
		}
	}

	for(const [pathSoundBank, nameFile] of infoFiles) {
		nameFiles_hash[T.wadHash(pathSoundBank)] = nameFile;
	}

	return nameFiles_hash;
};
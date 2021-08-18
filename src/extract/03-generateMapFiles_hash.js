import { C, I, G } from '../../lib/global.js';
import { wadHash } from '../../lib/Tool.js';


const genPathSoundBank = function(usage, lang, champion, index, type, format, version = '2016') {
	return `assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${lang}/` : ''}characters/${I.slot}/skins/${index}/${I.slot}_${index}_${usage}_${type}.${format}`;
};

const genArrPathSoundBank = function(usage, lang, champion, index, version = '2016') {
	return [
		[genPathSoundBank(usage, lang, champion, index, 'audio', 'wpk', version), `${usage}_${index}_audio.wpk`],
		[genPathSoundBank(usage, lang, champion, index, 'audio', 'bnk', version), `${usage}_${index}_audio.bnk`],
		[genPathSoundBank(usage, lang, champion, index, 'events', 'bnk', version), `${usage}_${index}_event.bnk`],
	];
};

export default function genNameFiles_hash() {
	G.info('HashGenerator', 'generate a name map to in-wad files, indexed by path-hashes');

	const nameFiles_hash = {};

	const usages = C.useSFXLevel ? ['vo', 'sfx'] : ['vo'];

	const infoFiles = [];
	for(const usage of usages) {
		for(const i of I.idsSkin) {
			nameFiles_hash[wadHash(`data/characters/${I.slot}/skins/skin${i}.bin`)] = `skin${i}.bin`;

			infoFiles.push(...genArrPathSoundBank(usage, C.lang, I.slot, `skin${String(i).padStart(2, '0')}`));
		}

		if(I.idsSkin.includes(0) || C.forceUseBase) {
			infoFiles.push(...genArrPathSoundBank(usage, C.lang, I.slot, 'base'));
		}
	}

	for(const [pathSoundBank, nameFile] of infoFiles) {
		nameFiles_hash[wadHash(pathSoundBank)] = nameFile;
	}

	return nameFiles_hash;
}
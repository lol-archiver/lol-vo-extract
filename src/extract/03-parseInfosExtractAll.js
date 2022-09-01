import { resolve } from 'path';

import { C, G } from '@nuogz/pangu';

import { dirCache } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { pad0 } from '../../lib/utility.js';



const genPathSoundBank = (usage, language, champion, index, type, format, version = '2016') => {
	return `assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${language}/` : ''}characters/${I.slot}/skins/${index}/${I.slot}_${index}_${usage}_${type}.${format}`;
};

const genArrPathSoundBank = (usage, language, champion, index, version = '2016') => {
	return [
		[genPathSoundBank(usage, language, champion, index, 'audio', 'wpk', version), `${usage}_${index}_audio.wpk`],
		[genPathSoundBank(usage, language, champion, index, 'audio', 'bnk', version), `${usage}_${index}_audio.bnk`],
		[genPathSoundBank(usage, language, champion, index, 'events', 'bnk', version), `${usage}_${index}_event.bnk`],
	];
};

export default function parseInfosExtractAll() {
	G.info('HashGenerator', 'generate a name map to in-wad files, indexed by path-hashes');

	const infosExtractRaw = {};

	const usages = C.useSFXLevel ? ['vo', 'sfx'] : ['vo'];

	const infoFiles = [];
	for(const usage of usages) {
		for(const i of I.idsSkin) {
			infosExtractRaw[`data/characters/${I.slot}/skins/skin${i}.bin`] = `file|${`skin${i}.bin`}|${resolve(dirCache, 'extract', `skin${i}.bin`)}`;

			infoFiles.push(...genArrPathSoundBank(usage, C.lang, I.slot, `skin${pad0(i, 2)}`));
		}

		if(I.idsSkin.includes(0) || C.forceUseBase) {
			infoFiles.push(...genArrPathSoundBank(usage, C.lang, I.slot, 'base'));
		}
	}

	for(const [pathSoundBank, nameFile] of infoFiles) {
		infosExtractRaw[pathSoundBank] = `file|${nameFile}|${resolve(dirCache, 'extract', nameFile)}`;
	}

	return infosExtractRaw;
}

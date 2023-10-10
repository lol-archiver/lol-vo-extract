import { resolve } from 'path';

import { C, G } from '@nuogz/pangu';

import { dirCache } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { pad0 } from '../../lib/utility.js';



const parseSoundBankPath = (usage, language, champion, target, type, format, version = '2016') =>
	`assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${language}/` : ''}characters/${I.slot}/skins/${target}/${I.slot}_${target}_${usage}_${type}.${format}`;

const parseSoundBankPaths = (usage, language, champion, target, index, version = '2016') => [
	[parseSoundBankPath(usage, language, champion, target, 'audio', 'wpk', version), `${usage}_${target}_audio.wpk`, index],
	[parseSoundBankPath(usage, language, champion, target, 'audio', 'bnk', version), `${usage}_${target}_audio.bnk`, index],
	[parseSoundBankPath(usage, language, champion, target, 'events', 'bnk', version), `${usage}_${target}_event.bnk`, index],
];

export default function parseExtractInfo() {
	G.info('HashGenerator', 'generate a name map to in-wad files, indexed by path-hashes');

	const infosExtract$pathInWAD = {};

	const usages = C.useSFXLevel ? ['vo', 'sfx'] : ['vo'];

	const infosSoundBank = [];
	for(const usage of usages) {
		for(const i of I.idsSkin) {
			infosExtract$pathInWAD[`data/characters/${I.slot}/skins/skin${i}.bin`] = {
				index: i,
				type: 'file',
				key: `skin${i}.bin`,
				fileTarget: resolve(dirCache, 'extract', `skin${i}.bin`),
			};

			infosSoundBank.push(...parseSoundBankPaths(usage, C.lang, I.slot, `skin${pad0(i, 2)}`, i));
		}

		if(I.idsSkin.includes(0) || C.forceUseBase) {
			infosSoundBank.push(...parseSoundBankPaths(usage, C.lang, I.slot, 'base', 0));
		}
	}

	for(const [pathSoundBank, nameFile, index] of infosSoundBank) {
		infosExtract$pathInWAD[pathSoundBank] = {
			index,
			type: 'file',
			key: nameFile,
			fileTarget: resolve(dirCache, 'extract', nameFile),
		};
	}

	return infosExtract$pathInWAD;
}

import { parse as parsePath, resolve } from 'path';

import { pad0 } from '../lib/utility.js';
import { LEVEL_SOUND_EFFECT } from '../lib/constant.js';


/** @param {number} id */
const parseSoundBankTarget = id => id == 0 ? 'base' : `skin${pad0(id, 2)}`;

/**
 * @param {string} usage
 * @param {string} language
 * @param {string} slotChampion
 * @param {number} idSkin
 * @param {string} type
 * @param {string} format
 * @param {string} [version]
 * @returns {string}
 */
const parseSoundBankPath = (usage, language, slotChampion, idSkin, type, format, version = '2016') =>
	`assets/sounds/wwise${version}/${usage}/${usage == 'vo' ? `${language}/` : ''}characters/${slotChampion}/skins/${parseSoundBankTarget(idSkin)}/${slotChampion}_${parseSoundBankTarget(idSkin)}_${usage}_${type}.${format}`;

/**
 * @param {string} usage
 * @param {string} language
 * @param {string} slotChampion
 * @param {number} idSkin
 * @param {string} [version]
 * @returns {string[]}
 */
const parseSoundBankPaths = (usage, language, slotChampion, idSkin, version = '2016') => [
	parseSoundBankPath(usage, language, slotChampion, idSkin, 'audio', 'wpk', version),
	parseSoundBankPath(usage, language, slotChampion, idSkin, 'audio', 'bnk', version),
	parseSoundBankPath(usage, language, slotChampion, idSkin, 'events', 'bnk', version),
];


/**
 * @param {import('../bases.js').ExtractConfig} E
 * @returns {import('@lol-archiver/lol-wad-extract').ExtractConfig[]}
 */
export default function parseGameFilesNeed(E) {
	if(E.mode == 'specify') { return {}; }


	const configsExtract = [
		{
			fileInpack: `data/characters/${E.champion.slot}/skins/root.bin`,
			fileSave: resolve(E.dirCacheUnpack, `root.bin`),
		},
		{
			fileInpack: `data/characters/${E.champion.slot}/skins/skin${E.skin.id}.bin`,
			fileSave: resolve(E.dirCacheUnpack, `skin${E.skin.id}.bin`),
		},
	];


	const usages = E.levelSoundEffect == LEVEL_SOUND_EFFECT.PARSE || E.levelSoundEffect == LEVEL_SOUND_EFFECT.EXTRACT
		? ['vo', 'sfx'] : ['vo'];
	const filesInpackNeed = [];
	for(const usage of usages) {
		filesInpackNeed.push(...parseSoundBankPaths(usage, E.langInGame == '{lang}' ? E.lang : E.langInGame || 'en_us', E.champion.slot, E.skin.id));

		if(E.skin.id > 0 && E.useBaseSkinFiles) {
			filesInpackNeed.push(...parseSoundBankPaths(usage, E.langInGame == '{lang}' ? E.lang : E.langInGame || 'en_us', E.champion.slot, 0));
		}
	}

	for(const fileInpack of filesInpackNeed) {
		configsExtract.push({
			fileInpack,
			fileSave: resolve(E.dirCacheUnpack, parsePath(fileInpack).base),
		});
	}


	return configsExtract;
}

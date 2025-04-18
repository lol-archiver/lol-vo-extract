import { G } from '@nuogz/pangu';

import { appendFileSync, copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { parse as parsePath, resolve as resolvePath } from 'path';

import { ensureDirSync } from 'fs-extra/esm';

import { T, TS } from '../lib/i18n.js';

import { crc32, pad0, showID, toHexL8 } from '../lib/utility.js';

import { HIRCContainer, HIRCEvent, HIRCSound, HIRCSwitch } from './entry/bnk/HIRCObject.js';

const GG = G.where(T('save-audios:where'));



/**
 * @param {import('./entry/bnk/HIRCObject.js').HIRCObject} objectParsed
 * @param {import('./entry/bnk/HIRCObject.js').HIRCObject[]} objectsAll
 * @param {import('./entry/bnk/HIRCObject.js').HIRCAction} action
 * @returns {number[]}
 */
const groupActionChildAudioIDs = (objectParsed, objectsAll, action) => {
	const idsAudio = [];

	if(objectParsed instanceof HIRCSound) {
		idsAudio.push(objectParsed.idAudio);
	}
	else if(objectParsed instanceof HIRCContainer) {
		const objects = [...new Set([
			...objectsAll.filter(object => objectParsed.idsChildren.includes(object.id)),
			...objectParsed.switches ?? [],
		])];

		for(const object of objects) {
			idsAudio.push(...groupActionChildAudioIDs(object, objectsAll, action, GG));
		}
	}
	else if(objectParsed instanceof HIRCSwitch) {
		const objects = objectsAll.filter(object => objectParsed.idsChildren.includes(object.id));

		for(const object of objects) {
			idsAudio.push(...groupActionChildAudioIDs(object, objectsAll, action, GG));
		}
	}
	else if(!objectParsed) {
		GG.warnD(...TS('parse-bnk:group-ids-audio-action', { idAction: showID(action.id), idTarget: showID(action.idTarget) }, 'unknown-action-object'));
	}
	else if(objectParsed) {
		GG.warnD(...TS('parse-bnk:group-ids-audio-action', { idAction: showID(action.id), idTarget: showID(action.idTarget), clazz: Object.getPrototypeOf(objectParsed).constructor.name }, 'unknown-action-object-type'));
	}

	return idsAudio;
};


/**
 * @param {string[]} filesBank
 * @param {import('./entry/bnk/HIRCObject.js').HIRCObject[]} objectsBNKAll
 * @param {import('../bases.js').ExtractConfig} E
 */
export default function copyAudios$fileBank(filesBank, objectsBNKAll, E) {
	/** @type {Object<string, Set>} */
	const events$idAudio = {};
	for(const event of objectsBNKAll.filter(object => object instanceof HIRCEvent)) {
		const idsAudioChild = [];
		for(const actionID of event.idsAction) {
			/** @type {HIRCAction} */
			const action = objectsBNKAll.find(object => object.id == actionID);

			const objectAction = objectsBNKAll.find(object => object.id == action.idTarget);

			idsAudioChild.push(...groupActionChildAudioIDs(objectAction, objectsBNKAll, action));
		}


		for(const idAudio of idsAudioChild) {
			(events$idAudio[idAudio] || (events$idAudio[idAudio] = new Set())).add(event.name);
		}
	}


	/** @type {Object<string, Set>} */
	const idsSound$idAudio = {};
	for(const sound of objectsBNKAll.filter(object => object instanceof HIRCSound)) {
		(idsSound$idAudio[sound.idAudio] || (idsSound$idAudio[sound.idAudio] = new Set())).add(sound.id);
	}




	for(const fileBank of filesBank) {
		const pathParsedBank = parsePath(fileBank);
		const baseBank = pathParsedBank.base;


		const willCopy = baseBank.includes('sfx') ? (E.levelSoundEffect == 'extract' ? true : false) : true;
		const willCopyWEM = E.format == 'wem';

		const dirCacheAudioWAV = resolvePath(E.dirCacheAudio, `[wav]${baseBank}`);
		const dirCacheAudioWEM = resolvePath(E.dirCacheAudio, `[wem]${baseBank}`);

		if(!willCopyWEM && !existsSync(dirCacheAudioWAV)) {
			GG.warnD(...TS('save-audios:exist-dir', { name: 'WAV', path: dirCacheAudioWAV }, 'not-exist'));

			continue;
		}
		if(!existsSync(dirCacheAudioWEM)) {
			GG.warnD(...TS('save-audios:exist-dir', { name: 'WEM', path: dirCacheAudioWEM }, 'not-exist'));

			continue;
		}

		for(const fileAudio of readdirSync(willCopyWEM ? dirCacheAudioWEM : dirCacheAudioWAV)) {
			const idAudio = parsePath(fileAudio).name;
			const hexIDAudio = toHexL8(idAudio);

			const srcAudio = resolvePath(willCopyWEM ? dirCacheAudioWEM : dirCacheAudioWAV, `${idAudio}.${E.format}`);
			const srcWEM = resolvePath(dirCacheAudioWEM, `${idAudio}.wem`);

			const events = [...events$idAudio[idAudio] ?? []].map(event => String(event)
				.replace(/^play_vo_/i, '')
				.replace(new RegExp(`^${E.champion?.slot}${E.skin?.id ? `skin${pad0(E.skin.id, 2)}` : ''}_`, 'i'), '')
			);
			if(!events.length && willCopy) { events.push('unmatch-event'); }


			const existedWEM = existsSync(srcWEM);
			if(!existedWEM) { GG.warnD(...TS('save-audios:exist-wem-source', { id: showID(idAudio) }, 'not-exist')); }

			const partHexIDAudio = E.noAudioIDInExportFileName ? '' : `[${hexIDAudio}]`;
			const partHashWEM = E.noWEMHashInExportFileName ? ''
				: existedWEM ? `[${crc32(readFileSync(srcWEM))}]`
					: '[no-wem]';


			const logsTooLong = [`-------${E.timeExtract.format()}-------`];

			const dirExportVoice = resolvePath(E.dirExportVoice, E.nameDirVoiceExport);
			ensureDirSync(dirExportVoice);


			const eventsText = events.join('&');
			const idsSound = [...idsSound$idAudio[idAudio] ?? []];
			const audioText = (idsSound
				? `[${idsSound.slice(0, 4).map(id => toHexL8(id)).join('.')}${idsSound.length > 4 ? '.more' : ''}]`
				: `[no-sound]`)
				+ `${partHexIDAudio}${partHashWEM}.${E.format}`;


			try {
				if(eventsText.length > 128) { throw 'eventsText.length > 128'; }

				copyFileSync(
					E.format == 'wem' ? srcWEM : srcAudio,
					resolvePath(dirExportVoice, `${eventsText}${audioText}`),
				);
			}
			catch {
				copyFileSync(
					E.format == 'wem' ? srcWEM : srcAudio,
					resolvePath(dirExportVoice, `@long-event${audioText}`),
				);

				logsTooLong.push(`[${hexIDAudio}] ==> ${events.sort().join(' | ')}`);
			}

			if(logsTooLong.length > 1) {
				appendFileSync(resolvePath(dirExportVoice, '@long-event.txt'), '\n' + logsTooLong.join('\n'));
			}
		}
	}
}

import { G } from '@nuogz/pangu';

import { appendFileSync, copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { parse as parsePath, resolve as resolvePath } from 'path';

import { ensureDirSync } from 'fs-extra/esm';


import { crc32, pad0, showID, toHexL8 } from '../lib/utility.js';



/**
 * @param {string[]} filesBank
 * @param {Object<string, Set>} events$idAudio
 * @param {Object<string, Set>} idsSound$idAudio
 * @param {import('../bases.js').ExtractConfig} E
 */
export default function copyAudios$fileBank(filesBank, events$idAudio, idsSound$idAudio, E) {
	G.infoU('AudioCopier', 'copy audio', '○ coping...');

	for(const fileBank of filesBank) {
		const pathParsedBank = parsePath(fileBank);
		const baseBank = pathParsedBank.base;


		const willCopy = baseBank.includes('sfx') ? (E.levelSoundEffect == 'extract' ? true : false) : true;

		const dirCacheAudioWAV = resolvePath(E.dirCacheAudio, `[wav]${baseBank}`);
		const dirCacheAudioWEM = resolvePath(E.dirCacheAudio, `[wem]${baseBank}`);

		if(!existsSync(dirCacheAudioWAV)) {
			G.warn('AudioCopier', 'copy audio', `path~{${dirCacheAudioWAV}} not exists`);

			continue;
		}
		if(!existsSync(dirCacheAudioWEM)) {
			G.warn('AudioCopier', 'copy audio', `path~{${dirCacheAudioWEM}} not exists`);

			continue;
		}

		for(const fileAudio of readdirSync(dirCacheAudioWAV)) {
			const idAudio = parsePath(fileAudio).name;
			const hexIDAudio = toHexL8(idAudio);

			const srcWAV = resolvePath(dirCacheAudioWAV, `${idAudio}.${E.format}`);
			const srcWEM = resolvePath(dirCacheAudioWEM, `${idAudio}.wem`);

			const events = [...events$idAudio[idAudio]].map(event => event.toLowerCase()
				.replace(/^play_vo_/, '')
				.replace(new RegExp(`^${E.champion?.slot}${E.skin?.id ? `skin${pad0(E.skin.id, 2)}` : ''}_`.toLowerCase()), '')
			);
			if(!events.length && willCopy) { events.push('unmatch-event'); }


			const existedWEM = existsSync(srcWEM);
			if(!existedWEM) { G.warn('AudioCopier', `~[Audio File]~{${showID(idAudio)}} does not have ~[source WEM]`, '✖'); }
			const crcWEM = existedWEM ? crc32(readFileSync(srcWEM)) : 'no-wem';


			const logsTooLong = [`-------${E.timeExtract.format()}-------`];

			const dirExportVoice = resolvePath(E.dirExportVoice, E.nameDirExport);
			ensureDirSync(dirExportVoice);


			const eventsText = events.join('&');
			const idsSound = [...idsSound$idAudio[idAudio]];
			const audioText = (idsSound
				? `[${idsSound.slice(0, 4).map(id => toHexL8(id)).join('.')}${idsSound.length > 4 ? '.more' : ''}]`
				: `[no-sound]`)
				+ `[${hexIDAudio}][${crcWEM}].${E.format}`;


			try {
				if(eventsText.length > 128) { throw 'eventsText.length > 128'; }

				copyFileSync(
					srcWAV,
					resolvePath(dirExportVoice, `${eventsText}${audioText}`),
				);
			}
			catch {
				copyFileSync(
					srcWAV,
					resolvePath(dirExportVoice, `@long-event${audioText}`),
				);

				logsTooLong.push(`[${hexIDAudio}] ==> ${events.sort().join(' | ')}`);
			}

			if(logsTooLong.length > 1) {
				appendFileSync(resolvePath(dirExportVoice, '@long-event.txt'), '\n' + logsTooLong.join('\n'));
			}
		}
	}

	G.infoD('AudioCopier', 'copy audio', '✔ ');
}

import { appendFileSync, copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { parse, resolve } from 'path';

import { ensureDirSync } from 'fs-extra/esm';

import { C, G } from '@nuogz/pangu';

import { dirCache, dirFinal } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { crc32, pad0, toHexL8 } from '../../lib/utility.js';


const lang = !C.saveWithShort ? C.lang : C.lang.split('_')[0];
const region = (!C.saveWithShort ? C.server.region : C.server.region.replace(/\d+$/, '')).toLowerCase();



export default function copyAudios(eventsAll$idAudio, namesFileSoundBank, idsSoundAll$idAudio, infosExtract$pathInWAD) {
	G.infoU('AudioCopier', 'copy audio', '○ coping...');

	for(const nameFileSoundBank of namesFileSoundBank) {
		const copyWhileEmpty = nameFileSoundBank.startsWith('sfx') ? (C.useSFXLevel >= 2 ? true : false) : true;

		const pathDir = resolve(dirCache, 'audio', nameFileSoundBank);

		if(!existsSync(pathDir)) {
			G.warn('AudioCopier', 'copy audio', `path~{${pathDir}} not exists`);

			continue;
		}

		for(let audioFile of readdirSync(pathDir).filter(file => file != 'wem')) {
			const idAudio = parse(audioFile).name;
			const hexIDAudio = toHexL8(idAudio);
			const src = resolve(pathDir, `${idAudio}.${C.format}`);
			const srcWEM = resolve(pathDir, 'wem', `${idAudio}.wem`);

			const events$nameSkin = {};
			const eventsAudio$idAudio = eventsAll$idAudio[idAudio] || [];

			const indexFileAudio = Object.values(infosExtract$pathInWAD).find(info => info.key == nameFileSoundBank)?.index ?? '';

			for(const eventAudio of eventsAudio$idAudio) {
				let nameSkin;
				let event;

				if(typeof eventAudio == 'object') {
					nameSkin = `${pad0(I.id)}${pad0(eventAudio.index)}@${eventAudio.skinName.replace(/[:"]/g, '') || I.slot}@${region}@${lang}`;
					event = eventAudio.short;
				}
				else if(typeof eventAudio == 'number') {
					nameSkin = `${pad0(I.id)}${indexFileAudio}@unknown@${region}@${lang}`;
					event = eventAudio;
				}

				(events$nameSkin[nameSkin] || (events$nameSkin[nameSkin] = [])).push(event);
			}

			if(!eventsAudio$idAudio.length && copyWhileEmpty) {
				const nameSkin = `${pad0(I.id)}${indexFileAudio}@unmatch@${region}@${lang}`;

				(events$nameSkin[nameSkin] || (events$nameSkin[nameSkin] = [])).push('Unmatch');
			}

			if(!Object.keys(events$nameSkin).length || !existsSync(srcWEM)) { continue; }

			const crcWEM = crc32(readFileSync(srcWEM));

			for(const [nameSkin, events] of Object.entries(events$nameSkin)) {
				const logsTooLong = [`-------${I.time}-------`];

				const pathFolder = resolve(dirFinal, nameSkin);

				ensureDirSync(pathFolder);

				const eventsText = events.join('&');
				const audioText =
					`[${idsSoundAll$idAudio[idAudio].map(id => toHexL8(id)).join('.')}][${hexIDAudio}][${crcWEM}].${C.format}`;

				try {
					if(eventsText.length > 128) { throw 'eventsText.length > 128'; }

					copyFileSync(
						src,
						resolve(pathFolder, `${eventsText}${audioText}`),
					);
				} catch(error) {
					copyFileSync(
						src,
						resolve(pathFolder, `@LongEvent${audioText}`),
					);

					logsTooLong.push(`[${hexIDAudio}] ==> ${events.sort().join(' | ')}`);
				}

				if(logsTooLong.length > 1) {
					appendFileSync(resolve(pathFolder, '@LongEvent.txt'), '\n' + logsTooLong.join('\n'));
				}
			}
		}
	}

	G.infoD('AudioCopier', 'copy audio', '✔ ');
}

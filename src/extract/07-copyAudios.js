import { appendFileSync, copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { parse, resolve } from 'path';

import FSX from 'fs-extra';
import Moment from 'moment';

import { dirCache, dirFinal } from '../../lib/global.dir.js';
import { C, I, G } from '../../lib/global.js';
import { crc32, pad0, toHexL } from '../../lib/Tool.js';


export default function copyAudios(mapAudioID_Event, arrAudioPackFile) {
	G.infoU('AudioCopier', 'copy audio', 'coping...');

	for(const audioPackFile of arrAudioPackFile) {
		const copyWhileEmpty = audioPackFile.startsWith('sfx') ? (C.useSFXLevel >= 2 ? true : false) : true;

		const pathDir = resolve(dirCache, 'audio', audioPackFile);

		if(!existsSync(pathDir)) {
			G.warn('AudioCopier', 'copy audio', `path~{${pathDir}} not exists`);

			continue;
		}

		for(let audioFile of readdirSync(pathDir).filter(file => file != 'wem')) {
			const audioID = parse(audioFile).name;
			const audioIDHex = toHexL(audioID, 8);
			const src = resolve(pathDir, `${audioID}.${C.format}`);
			const srcWEM = resolve(pathDir, 'wem', `${audioID}.wem`);

			const events_nameSkin = {};
			const events_audioID = mapAudioID_Event[audioID] || [];

			for(const eventInfo of events_audioID) {
				let nameSkin;
				let event;

				if(typeof eventInfo == 'object') {
					nameSkin = `[${pad0(I.id)}${pad0(eventInfo.index)}]${eventInfo.skinName.replace(/[:"]/g, '')}`;
					event = eventInfo.short;
				}
				else if(typeof eventInfo == 'number') {
					nameSkin = '[Bad]';
					event = eventInfo;
				}

				(events_nameSkin[nameSkin] || (events_nameSkin[nameSkin] = [])).push(event);
			}

			if(!events_audioID.length && copyWhileEmpty) {
				(events_nameSkin['[Bad]'] || (events_nameSkin['[Bad]'] = [])).push('Unmatch');
			}

			if(!Object.keys(events_nameSkin).length) { continue; }

			const crcWEM = crc32(readFileSync(srcWEM));

			for(const [nameSkin, events] of Object.entries(events_nameSkin)) {
				const logsTooLong = [`-------${Moment().format('YYYY-MM-DD HH:mm:ss')}-------`];

				const pathFolder = resolve(dirFinal, `${nameSkin.replace(/[:"]/g, '')}[${I.slot}@${C.server.region}@${C.lang}]`);

				FSX.ensureDirSync(pathFolder);

				const eventsText = events.join('&');
				const audioText = `[${nameSkin == '[Bad]' ? `${audioID}][${audioIDHex}` : audioIDHex}][${crcWEM}].${C.format}`;

				try {
					if(eventsText.length > 128) { throw 'eventsText.length > 128'; }

					copyFileSync(
						src,
						resolve(pathFolder, `${eventsText}${audioText}`),
					);
				} catch(error) {
					copyFileSync(
						src,
						resolve(pathFolder, `_EventsTooLong${audioText}`),
					);

					logsTooLong.push(`[${audioIDHex}] ==> ${events.sort().join(' | ')}`);
				}

				if(logsTooLong.length > 1) {
					appendFileSync(resolve(pathFolder, '_EventsTooLong.txt'), '\n' + logsTooLong.join('\n'));
				}
			}
		}
	}

	G.infoD('AudioCopier', 'copy audio', '✔ ');
}
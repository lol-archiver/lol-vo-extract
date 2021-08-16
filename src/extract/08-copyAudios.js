import { appendFileSync, copyFileSync, readdirSync, readFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import Moment from 'moment';
import { parse, resolve } from 'path';
import { C, dirApp, dirCache, G, I } from '../../lib/global.js';
import { crc32, toHexL } from '../../lib/Tool.js';


export default function copyAudios(mapAudioID_Event, arrAudioPackFile) {
	G.info(`[Main] Copy audio file`);


	for(const audioPackFile of arrAudioPackFile) {
		const copyWhileEmpty = audioPackFile.startsWith('sfx') ? (C.useSFXLevel >= 2 ? true : false) : true;

		for(let audioFile of readdirSync(resolve(dirCache, 'audio', audioPackFile))) {
			const audioID = parse(audioFile).name;
			const audioIDHex = toHexL(audioID, 8);
			const src = resolve(dirCache, 'audio', audioPackFile, `${audioID}.${C.format}`);

			const events_nameSkin = {};
			const events_audioID = mapAudioID_Event[audioID] || [];

			for(const eventInfo of events_audioID) {
				let nameSkin;
				let event;

				if(typeof eventInfo == 'object') {
					nameSkin = `[${String(C.id).padStart(3, '0')}${String(eventInfo.index).padStart(3, '0')}]${eventInfo.skinName.replace(/[:"]/g, '')}`;
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

			const crc32File = crc32(readFileSync(src));

			for(const [nameSkin, events] of Object.entries(events_nameSkin)) {
				const logsTooLong = [`-------${Moment().format('YYYY-MM-DD HH:mm:ss')}-------`];

				const pathFolder = resolve(dirApp, '_final', `${nameSkin.replace(/[:"]/g, '')}[${I.slot}@${C.region}@${C.lang}]`);

				ensureDirSync(pathFolder);

				const eventsText = events.join('&');
				const audioText = `[${nameSkin == '[Bad]' ? `${audioID}][${audioIDHex}` : audioIDHex}][${crc32File}].${C.format}`;

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
}
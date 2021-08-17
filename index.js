import { resolve } from 'path';

import { emptyDirSync } from 'fs-extra';

import { dirCache, } from './lib/global.js';

import { pathWadVoice, pathWadChamp, wadsToFetch } from './src/extract/01-initFetch.js';
import fetchWads from './src/extract/02-fetchWads.js';
import generateMapFiles_hash from './src/extract/03-generateMapFiles_hash.js';
import extractWad from './src/extract/04-takeWad.js';
import parseBin from './src/extract/05-parseBin.js';
import parseBnk from './src/extract/06-parseBin.js';
import extractAudios from './src/extract/07-extractAudios.js';
import copyAudios from './src/extract/08-copyAudios.js';
import saveEvents from './src/extract/09-saveEvents.js';


(async () => {
	await fetchWads(wadsToFetch);

	emptyDirSync(resolve(dirCache, 'extract'));

	const mapHash_GameFile = generateMapFiles_hash();

	const arrSkinFile = await extractWad(pathWadChamp, mapHash_GameFile);

	const mapName_Event = {};

	for(const binFile of arrSkinFile.filter(file => file.includes('.bin')).sort((a, b) => a.match(/\d+/)[0] - b.match(/\d+/)[0])) {
		const arrEvent = parseBin(resolve(dirCache, 'extract', binFile), ~~binFile.match(/\d+/g)[0]);

		if(arrEvent instanceof Array) {
			for(const event of arrEvent) {
				(mapName_Event[event.name] || (mapName_Event[event.name] = [])).push(event);
			}
		}
	}

	const setEventName = new Set(Object.keys(mapName_Event));
	const arrVoiceFile = await extractWad(pathWadVoice, mapHash_GameFile);
	const mapAudioID_Event = {};

	for(let eventFile of arrVoiceFile.filter(file => file.includes('event.bnk'))) {
		const mapAudioID_EventName = await parseBnk(
			resolve(dirCache, 'extract', eventFile),
			setEventName
		);

		if(mapAudioID_EventName) {
			for(const audioID in mapAudioID_EventName) {
				const setEventName_AudioID = mapAudioID_EventName[audioID];

				for(const eventName of setEventName_AudioID) {
					const arrEvent_EventName = mapName_Event[eventName];

					if(arrEvent_EventName) {
						for(const event of arrEvent_EventName) {
							(mapAudioID_Event[audioID] || (mapAudioID_Event[audioID] = [])).push(event);
						}
					}
					else {
						(mapAudioID_Event[audioID] || (mapAudioID_Event[audioID] = [])).push(eventName);
					}
				}
			}
		}
	}

	const arrAudioPackFile = [
		...arrVoiceFile.filter(file => file.includes('audio.')),
		...arrSkinFile.filter(file => file.includes('audio.')),
	];

	// extract vocie files from wpk
	extractAudios(arrAudioPackFile);

	// copy voice files and rename with events
	copyAudios(mapAudioID_Event, arrAudioPackFile);

	// save event JSON for `lol-vo-lines-dictation`
	saveEvents(mapAudioID_Event, arrAudioPackFile);
})();
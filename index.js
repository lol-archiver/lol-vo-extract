import './index.env.js';

import { resolve } from 'path';

import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { C } from '@nuogz/pangu';

import { dirCache } from './lib/dir.js';


import initWADInfo from './src/extract/01-initFetch.js';
import fetchWADs from './src/extract/02-fetchWads.js';
import parseInfosExtractAll from './src/extract/03-parseInfosExtractAll.js';
import parseBIN from './src/extract/04-parseBIN.js';
import parseBNK from './src/extract/05-parseBNK.js';
import extractAudios from './src/extract/06-extractAudios.js';
import copyAudios from './src/extract/07-copyAudios.js';
import saveEvents from './src/extract/08-saveEvents.js';




const { fileWADChampionDefault, fileWADChampionLocale, wadsNeedFetch } = initWADInfo();


await fetchWADs(wadsNeedFetch);


const infosExtractRaw = parseInfosExtractAll();


const resultExtractDefault = await extractWAD(fileWADChampionDefault, infosExtractRaw);


const mapName_Event = {};

for(const binFile of Object.keys(resultExtractDefault).filter(file => file.includes('.bin')).sort((a, b) => a.match(/\d+/)[0] - b.match(/\d+/)[0])) {
	const events = parseBIN(resolve(dirCache, 'extract', binFile), ~~binFile.match(/\d+/g)[0], C.useSFXLevel);

	if(events instanceof Array) {
		for(const event of events) {
			(mapName_Event[event.name] || (mapName_Event[event.name] = [])).push(event);
		}
	}
}

const setNameEvent = new Set(Object.keys(mapName_Event));

const resultExtractLocale = await extractWAD(fileWADChampionLocale, infosExtractRaw);

const mapAudioID_Event = {};
const mapAudioID_SoundID = {};

for(let eventFile of Object.keys(resultExtractLocale).filter(file => file.includes('event.bnk'))) {
	const [mapAudioID_EventName, mapSubAudioID_SoundID] = await parseBNK(
		resolve(dirCache, 'extract', eventFile),
		setNameEvent
	);

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

	for(const audioID in mapSubAudioID_SoundID) {
		const setSoundID_AudioID = mapSubAudioID_SoundID[audioID];

		(mapAudioID_SoundID[audioID] || (mapAudioID_SoundID[audioID] = [])).push(...setSoundID_AudioID);
	}

}

const arrAudioPackFile = [
	...Object.keys(resultExtractLocale).filter(file => file.includes('audio.')),
	...Object.keys(resultExtractDefault).filter(file => file.includes('audio.')),
];


if(!C.skipExtract) {
	// extract vocie files from wpk
	extractAudios(arrAudioPackFile);


	// copy voice files and rename with events
	copyAudios(mapAudioID_Event, arrAudioPackFile);


	// save event JSON for `lol-vo-lines-dictation`
	saveEvents(mapAudioID_Event, arrAudioPackFile, mapAudioID_SoundID);
}

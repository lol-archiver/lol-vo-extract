import './index.env.js';

import { resolve } from 'path';

import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { C } from '@nuogz/pangu';

import { dirCache } from './lib/dir.js';


import initWADInfo from './src/extract/01-initFetch.js';
import fetchWADs from './src/extract/02-fetchWads.js';
import parseExtractInfo from './src/extract/03-parseInfosExtractAll.js';
import parseBIN from './src/extract/04-parseBIN.js';
import parseBNK from './src/extract/05-parseBNK.js';
import extractAudios from './src/extract/06-extractAudios.js';
import copyAudios from './src/extract/07-copyAudios.js';
import saveEvents from './src/extract/08-saveEvents.js';




const { fileWADChampionDefault, fileWADChampionLocale, wadsNeedFetch } = initWADInfo();


await fetchWADs(wadsNeedFetch);


const infosExtract$pathInWAD = parseExtractInfo();


const filesExtractedDefault$name = await extractWAD(fileWADChampionDefault, infosExtract$pathInWAD);


const eventsAll$nameEvent = {};

for(const binFile of Object.keys(filesExtractedDefault$name).filter(file => file.includes('.bin')).sort((a, b) => a.match(/\d+/)[0] - b.match(/\d+/)[0])) {
	const events = parseBIN(resolve(dirCache, 'extract', binFile), ~~binFile.match(/\d+/g)[0], C.useSFXLevel);

	if(events instanceof Array) {
		for(const event of events) {
			(eventsAll$nameEvent[event.name] || (eventsAll$nameEvent[event.name] = [])).push(event);
		}
	}
}

const namesEvent = new Set(Object.keys(eventsAll$nameEvent));

const filesExtractedLocale$name = await extractWAD(fileWADChampionLocale, infosExtract$pathInWAD);

const eventsAll$idAudio = {};
const idsSoundAll$idAudio = {};

for(const eventFile of Object.keys(filesExtractedLocale$name).filter(file => file.includes('event.bnk'))) {
	const [namesEventAllBNK$idAudio, idsSoundAllBNK$idAudio] = await parseBNK(
		resolve(dirCache, 'extract', eventFile),
		namesEvent,
	);


	for(const idAudio in namesEventAllBNK$idAudio) {
		const namesEventBNK = namesEventAllBNK$idAudio[idAudio];

		for(const nameEvent of namesEventBNK) {
			const events = eventsAll$nameEvent[nameEvent];

			if(events) {
				for(const event of events) {
					(eventsAll$idAudio[idAudio] || (eventsAll$idAudio[idAudio] = [])).push(event);
				}
			}
			else {
				(eventsAll$idAudio[idAudio] || (eventsAll$idAudio[idAudio] = [])).push(nameEvent);
			}
		}
	}

	for(const idAudio in idsSoundAllBNK$idAudio) {
		const idsSoundBNK = idsSoundAllBNK$idAudio[idAudio];

		(idsSoundAll$idAudio[idAudio] || (idsSoundAll$idAudio[idAudio] = [])).push(...idsSoundBNK);
	}
}

const namesFileSoundBank = [
	...Object.keys(filesExtractedLocale$name).filter(file => file.includes('audio.')),
	...Object.keys(filesExtractedDefault$name).filter(file => file.includes('audio.')),
];


if(!C.skipExtract) {
	// extract vocie files from wpk
	extractAudios(namesFileSoundBank);


	// copy voice files and rename with events
	copyAudios(eventsAll$idAudio, namesFileSoundBank, idsSoundAll$idAudio, infosExtract$pathInWAD);


	// save event JSON for `lol-vo-lines-dictation`
	saveEvents(eventsAll$idAudio, namesFileSoundBank, idsSoundAll$idAudio, infosExtract$pathInWAD);
}

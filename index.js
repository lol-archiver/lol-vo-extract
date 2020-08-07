require('./env');

L(`Champion [${C.champ}] ID [${C.id}] Language [${C.lang}]`);
L(`Region [${C.region}] Solution [${C.solution}]`);
L(`CDN [${C.cdn}] Sie [${C.sie}]`);
L(`--------------`);

const generatePathWads = require('./src/extract/01-generatePathWads');
const fetchWads = require('./src/extract/02-fetchWads');
const generateMapFiles_hash = require('./src/extract/03-generateMapFiles_hash');
const extractWad = require('./src/extract/04-takeWad');
const parseBin = require('./src/extract/05-parseBin');
const parseBnk = require('./src/extract/06-parseBin');
const extractAudios = require('./src/extract/07-extractAudios');
const copyAudios = require('./src/extract/08-copyAudios');
const saveEvents = require('./src/extract/09-saveEvents');

(async function main() {
	const [pathVoiceWad, pathChampWad, wadsToFetch] = generatePathWads();

	if(wadsToFetch.length) { await fetchWads(wadsToFetch); }

	Fex.emptyDirSync(RD('_cache', 'extract'));

	const mapHash_GameFile = generateMapFiles_hash();

	const arrSkinFile = await extractWad(pathChampWad, mapHash_GameFile);

	const mapName_Event = {};

	for(const binFile of arrSkinFile.filter(file => file.includes('.bin')).sort((a, b) => a.match(/\d+/)[0] - b.match(/\d+/)[0])) {
		const arrEvent = parseBin(RD('_cache', 'extract', binFile), ~~binFile.match(/\d+/g)[0]);

		if(arrEvent instanceof Array) {
			for(const event of arrEvent) {
				(mapName_Event[event.name] || (mapName_Event[event.name] = [])).push(event);
			}
		}
	}

	const setEventName = new Set(Object.keys(mapName_Event));
	const arrVoiceFile = await extractWad(pathVoiceWad, mapHash_GameFile);
	const mapAudioID_Event = {};

	for(let eventFile of arrVoiceFile.filter(file => file.includes('event.bnk'))) {
		const mapAudioID_EventName = await parseBnk(
			RD('_cache', 'extract', eventFile),
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

	L.end();
})();
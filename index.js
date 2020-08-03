require('./env');

L(`[Champion] ${C.hero} [ID] ${C.id} [Language] ${C.lang}`);
L(`[Region] ${C.region} [Solution] ${C.solution} [CDN] ${C.cdn}`);
L('--------------');

const makeWadArr = require('./src/extract/01-makeWadArr');
const downWad = require('./src/extract/02-downWad');
const makeGameFileMap = require('./src/extract/03-makeGameFileMap');
const takeWad = require('./src/extract/04-takeWad');
const readBin = require('./src/extract/05-readBin');
const readBnk = require('./src/extract/06-readBnk');
const takeAudio = require('./src/extract/07-takeAudio');
const copyAudio = require('./src/extract/08-copyAudio');
const saveEvent = require('./src/extract/09-saveEvent');

(async function main() {
	const [arrFetchFile, pathVoiceWad, pathSkinWad] = makeWadArr();

	if(arrFetchFile.length) { await downWad(arrFetchFile); }

	Fex.emptyDirSync(RD('_cache', 'extract'));

	const mapHash_GameFile = makeGameFileMap();

	const arrSkinFile = await takeWad(pathSkinWad, mapHash_GameFile);

	const mapName_Event = {};

	for(const binFile of arrSkinFile.filter(file => file.includes('.bin')).sort((a, b) => a.match(/\d+/)[0] - b.match(/\d+/)[0])) {
		const arrEvent = readBin(RD('_cache', 'extract', binFile), ~~binFile.match(/\d+/g)[0]);

		if(arrEvent instanceof Array) {
			for(const event of arrEvent) {
				(mapName_Event[event.name] || (mapName_Event[event.name] = [])).push(event);
			}
		}
	}

	const setEventName = new Set(Object.keys(mapName_Event));
	const arrVoiceFile = await takeWad(pathVoiceWad, mapHash_GameFile);
	const mapAudioID_Event = {};

	for(let eventFile of arrVoiceFile.filter(file => file.includes('event.bnk'))) {
		const mapAudioID_EventName = await readBnk(
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
	takeAudio(arrAudioPackFile);

	// copy voice files and rename with events
	copyAudio(mapAudioID_Event, arrAudioPackFile);

	// save event JSON for `lol-vo-lines-dictation`
	saveEvent(mapAudioID_Event, arrAudioPackFile);

	L.end();
})();
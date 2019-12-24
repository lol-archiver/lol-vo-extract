require('./env');

L(`[Hero] ${C.hero} [Language] ${C.lang}`);
L(`[Channel] ${C.channel} [Solution] ${C.solution} [CDN] ${C.cdn}`);

const downWad = require('./src/extract/downWad');
const takeWad = require('./src/extract/takeWad');
const readBin = require('./src/extract/readBin');
const readBnk = require('./src/extract/readBnk');
const takeWpk = require('./src/extract/takeWpk');
const copyVoc = require('./src/extract/copyVoc');
const saveEve = require('./src/extract/saveEve');

(async function main() {
	const voiceWad = `${C.hero}.${C.lang}.wad.client`.toLowerCase();
	const voiceWadPath = RD('_cache', 'assets', voiceWad);

	const skinWad = `${C.hero}.wad.client`.toLowerCase();
	const skinWadPath = RD('_cache', 'assets', skinWad);

	const fetchList = [];

	if(!_fs.existsSync(voiceWadPath) || C.cache == false) {
		fetchList.push([voiceWad, voiceWadPath]);
	}

	if(!_fs.existsSync(skinWadPath) || C.cache == false) {
		fetchList.push([skinWad, skinWadPath]);
	}

	if(fetchList.length) {
		await downWad(fetchList);
	}

	Fex.emptyDirSync(RD('_cache', 'extract'));

	let takeMap = {};

	for(let i = 0; i <= C.skinMax; i++) {
		takeMap[T.wadHash(`data/characters/${C.hero}/skins/skin${i}.bin`)] = `skin${i}.bin`;
	}

	takeMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_audio.wpk`)] = 'base_audio.wpk';
	takeMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_audio.bnk`)] = 'base_audio.bnk';
	takeMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_events.bnk`)] = 'base_event.bnk';

	for(let i = 0; i <= C.skinMax; i++) {
		const pad = `0${i}`.slice(-2);

		const hashAudio = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_audio.wpk`);
		const hashAudioB = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_audio.bnk`);
		const hashEvent = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_events.bnk`);

		takeMap[hashAudio] = `skin${pad}_audio.wpk`;
		takeMap[hashAudioB] = `skin${pad}_audio.bnk`;
		takeMap[hashEvent] = `skin${pad}_event.bnk`;
	}

	const voiceFiles = await takeWad(voiceWadPath, takeMap);

	await takeWad(skinWadPath, takeMap);

	let allEventMap = {};

	for(let i = 0; i <= C.skinMax; i++) {
		const result = readBin(RD('_cache', 'extract', `skin${i}.bin`), i);

		if(result) {
			for(const eventInfo of result) {
				(allEventMap[eventInfo.full] || (allEventMap[eventInfo.full] = [])).push(eventInfo);
			}
		}
	}

	const allEventRaws = new Set(Object.keys(allEventMap));

	const allSkinEventFileMap = {};
	for(let eventFile of voiceFiles.filter(file => file.indexOf('event.bnk') > -1)) {
		const efMap = await readBnk(
			RD('_cache', 'extract', eventFile),
			allEventRaws
		);

		if(efMap) {
			for(const fileID in efMap) {
				const eventList = efMap[fileID];

				for(const eventFull of eventList) {
					const eventInfos = allEventMap[eventFull];

					if(eventInfos) {
						for(const eventInfo of eventInfos) {
							(allSkinEventFileMap[fileID] || (allSkinEventFileMap[fileID] = [])).push(eventInfo);
						}
					}
				}
			}
		}
	}

	// extract vocie files from wpk
	takeWpk(voiceFiles.filter(file => file.indexOf('audio.') > -1));

	// copy voice files and rename with events
	copyVoc(allSkinEventFileMap);

	// save event JSON for `lol-vo-lines-dictation`
	saveEve(allSkinEventFileMap);

	L.end();
})();
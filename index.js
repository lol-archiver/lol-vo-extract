require('./env');

L(`[Hero] ${C.hero} [Language] ${C.lang}`);
L(`[Channel] ${C.channel} [Solution] ${C.solution} [CDN] ${C.cdn}`);

const downWad = require('./src/extract/downWad');
const takeWad = require('./src/extract/takeWad');
const readBin = require('./src/extract/readBin');
const readBnk = require('./src/extract/readBnk');
const takeWpk = require('./src/extract/takeWpk');

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
	takeMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_events.bnk`)] = 'base_event.bnk';

	for(let i = 0; i <= C.skinMax; i++) {
		const pad = `0${i}`.slice(-2);

		const hashAudio = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_audio.wpk`);
		const hashEvent = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_events.bnk`);

		takeMap[hashAudio] = `skin${pad}_audio.wpk`;
		takeMap[hashEvent] = `skin${pad}_event.bnk`;
	}

	const takeVoices = await takeWad(voiceWadPath, takeMap);

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
	for(let eventFile of takeVoices.filter(file => file.indexOf('event.bnk') > -1)) {
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

	// Fex.emptyDirSync(RD('_cache', 'sound'));
	// for(let audioFile of takeVoices.filter(file => file.indexOf('audio.wpk') > -1)) {
	// 	L(`-------takeWpk ${audioFile} AS ${C.finalFormat}-------`);

	// 	if(C.finalFormat == 'wem') {
	// 		await takeWpk(RD('_cache', 'extract', audioFile));
	// 	}
	// 	else if((C.finalFormat == 'wav' || C.finalFormat == 'ogg') && _fs.existsSync(C.rextractorConsolePath)) {
	// 		_cp.execFileSync(C.rextractorConsolePath, [
	// 			RD('_cache', 'extract', audioFile),
	// 			RD('_cache', 'sound'),
	// 			`/sf:${C.finalFormat}`
	// 		], { timeout: 1000 * 60 * 10 });
	// 	}
	// 	else {
	// 		L('[Error] Bad FinalFormat');
	// 	}
	// }

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	// let allEventFiles = {};

	// for(const skinMapEntries of allSkinEventFileMap.map(skinMap => Object.entries(skinMap))) {
	// 	for(const skinMapEntry of skinMapEntries) {
	// 		for(const event of skinMapEntry[1]) {
	// 			(allEventFiles[skinMapEntry[0]] || (allEventFiles[skinMapEntry[0]] = new Set())).add(event);
	// 		}
	// 	}
	// }

	for(let soundFile of _fs.readdirSync(RD('_cache', 'sound'))) {
		const soundID = _pa.parse(soundFile).name;

		const eventInfos = allSkinEventFileMap[soundID];

		const eventMap = {};
		for(const eventInfo of eventInfos) {
			(eventMap[eventInfo.name] || (eventMap[eventInfo.name] = [])).push(eventInfo.isBase ? 'Base Skin' : eventInfo.skinName.replace(/:/g, ''));
		}

		const eventTotalText = [];
		for(const eventName in eventMap) {
			eventTotalText.push(`${eventName}@${eventMap[eventName].map(s => `[${s.replace(/[23]D$/g, '')}]`).join('')}`);
		}

		const src = RD('_cache', 'sound', `${soundID}.${C.finalFormat}`);

		_fs.copyFileSync(
			src,
			RD('_final', `${C.hero}@${C.lang}`, `${eventTotalText.join('-') || '_Unknown'}[${T.toHexL(soundID)}].${C.finalFormat}`),
		);
	}

	L.end();
})();
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

	let allEvents = [];

	for(let i = 0; i <= C.skinMax; i++) {
		const result = readBin(RD('_cache', 'extract', `skin${i}.bin`), i);

		if(result) {
			allEvents = allEvents.concat(result);
		}
	}

	allEvents = new Set(allEvents);

	const allSkinEventFileMap = [];
	for(let eventFile of takeVoices.filter(file => file.indexOf('event.bnk') > -1)) {
		allSkinEventFileMap.push(await readBnk(
			RD('_cache', 'extract', eventFile),
			allEvents
		));
	}

	Fex.emptyDirSync(RD('_cache', 'sound'));
	for(let audioFile of takeVoices.filter(file => file.indexOf('audio.wpk') > -1)) {
		L(`-------takeWpk ${audioFile} AS ${C.finalFormat}-------`);

		if(C.finalFormat == 'wem') {
			await takeWpk(RD('_cache', 'extract', audioFile));
		}
		else if((C.finalFormat == 'wav' || C.finalFormat == 'ogg') && _fs.existsSync(C.convertToolPath)) {
			_cp.execFileSync(C.convertToolPath, [
				RD('_cache', 'extract', audioFile),
				RD('_cache', 'sound'),
				`/sf:${C.finalFormat}`
			], { timeout: 1000 * 60 * 10 });
		}
		else {
			L('[Error] Bad FinalFormat');
		}
	}

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	let allEventFiles = {};

	for(const skinMapEntries of allSkinEventFileMap.map(skinMap => Object.entries(skinMap))) {
		for(const skinMapEntry of skinMapEntries) {
			for(const event of skinMapEntry[1]) {
				(allEventFiles[skinMapEntry[0]] || (allEventFiles[skinMapEntry[0]] = new Set())).add(event);
			}
		}
	}

	for(const sound in allEventFiles) {
		const src = RD('_cache', 'sound', `${sound}.${C.finalFormat}`);
		const eventText = [...allEventFiles[sound]].sort().join('&').replace(/Play_vo_/g, '');

		if(_fs.existsSync(src)) {

			_fs.copyFileSync(
				src,
				RD('_final', `${C.hero}@${C.lang}`, `${eventText}-${T.toHexL(sound)}.${C.finalFormat}`),
			);
		}
		else {
			L(`Unfind Sound: ${sound}`);
		}
	}

	L.end();
})();
require('./env');

L(`[Hero] ${C.hero} [Language] ${C.lang}`);
L(`[Channel] ${C.channel} [Solution] ${C.solution} [CDN] ${C.cdn}`);

const fetchWad = require('./src/extract/fetchWad');
const unzipWad = require('./src/extract/unzipWad');
const parseBin = require('./src/extract/parseBin');
const parseBnk = require('./src/extract/parseBnk');
const unzipWpk = require('./src/extract/unzipWpk');

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
		await fetchWad(fetchList);
	}

	let unzipMap = {};

	for(let i = 0; i <= C.skinMax; i++) {
		unzipMap[T.wadHash(`data/characters/${C.hero}/skins/skin${i}.bin`)] = `skin${i}.bin`;
	}

	unzipMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_audio.wpk`)] = 'base_audio.wpk';
	unzipMap[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_events.bnk`)] = 'base_event.bnk';

	for(let i = 0; i <= C.skinMax; i++) {
		const pad = `0${i}`.slice(-2);

		const hashAudio = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_audio.wpk`);
		const hashEvent = T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/skin${pad}/${C.hero}_skin${pad}_vo_events.bnk`);

		unzipMap[hashAudio] = `skin${pad}_audio.wpk`;
		unzipMap[hashEvent] = `skin${pad}_event.bnk`;
	}

	await unzipWad(voiceWadPath, unzipMap);
	await unzipWad(skinWadPath, unzipMap);

	let events = [];

	for(let i = 0; i <= C.skinMax; i++) {
		events = events.concat(parseBin(RD('_cache', 'extract', `skin${i}.bin`), i));
	}

	const eventFileMap = await parseBnk(RD('_cache', 'extract', 'event.bnk'), events.filter(event => event[1].indexOf('_sfx_') == -1));

	// Fex.emptyDirSync(RD('_cache', 'extract', 'sound'));
	// if(C.finalFormat == 'wem') {
	// 	await unzipWpk(RD('_cache', 'extract', 'audio.wpk'));
	// }
	// else if((C.finalFormat == 'wav' || C.finalFormat == 'ogg') && _fs.existsSync(C.convertToolPath)) {
	// 	_cp.execFileSync(C.convertToolPath, [
	// 		RD('_cache', 'extract', 'audio.wpk'),
	// 		RD('_cache', 'extract', 'sound'),
	// 		`/sf:${C.finalFormat}`
	// 	], { stdio: [process.stdin, process.stdout, process.stderr] });
	// }
	// else {
	// 	L('[Error] Bad FinalFormat');
	// }

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	for(const sound in eventFileMap) {
		const src = RD('_cache', 'extract', 'sound', `${sound}.${C.finalFormat}`);
		const eventMap = eventFileMap[sound];

		if(_fs.existsSync(src)) {
			const texts = [];
			for(const event in eventMap) {
				const skinText = `${event}@${eventMap[event].sort().join('')}`;

				texts.push(skinText);
			}

			_fs.copyFileSync(
				src,
				RD('_final', `${C.hero}@${C.lang}`, `${texts.join('&')}-${sound}.${C.finalFormat}`),
			);
		}
		else {
			L(`Unfind Sound: ${sound}`);
		}
	}

	L.end();
})();
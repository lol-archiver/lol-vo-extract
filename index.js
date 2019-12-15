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

	const unzipMap = {
		[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_audio.wpk`.toLowerCase())]: 'audio.wpk',
		[T.wadHash(`assets/sounds/wwise2016/vo/${C.lang}/characters/${C.hero}/skins/base/${C.hero}_base_vo_events.bnk`.toLowerCase())]: 'event.bnk',
	};

	for(let i = 0; i <= C.skinTry; i++) {
		unzipMap[T.wadHash(`data/characters/${C.hero}/skins/skin${i}.bin`.toLowerCase())] = `skin${i}.bin`;
	}

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

	await unzipWad(voiceWadPath, unzipMap);
	await unzipWad(skinWadPath, unzipMap);

	let events = [];

	for(let i = 0; i <= C.skinTry; i++) {
		events = events.concat(parseBin(RD('_cache', 'extract', `skin${i}.bin`), i));
	}

	const eventMatch = await parseBnk(RD('_cache', 'extract', 'event.bnk'), events.filter(event => event[1].indexOf('_sfx_') == -1));

	Fex.emptyDirSync(RD('_cache', 'extract', 'sound'));


	if(C.finalFormat == 'wem') {
		await unzipWpk(RD('_cache', 'extract', 'audio.wpk'));
	}
	else if((C.finalFormat == 'wav' || C.finalFormat == 'ogg') && _fs.existsSync(C.convertToolPath)) {
		_cp.execFileSync(C.convertToolPath, [
			RD('_cache', 'extract', 'audio.wpk'),
			RD('_cache', 'extract', 'sound'),
			`/sf:${C.finalFormat}`
		], { stdio: [process.stdin, process.stdout, process.stderr] });
	}
	else {
		L('[Error] Bad FinalFormat');
	}

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	for(const [events, sounds] of eventMatch) {
		for(const event of events) {
			for(const sound of sounds) {
				const src = RD('_cache', 'extract', 'sound', `${sound}.${C.finalFormat}`);

				if(_fs.existsSync(src)) {
					_fs.copyFileSync(
						src,
						RD('_final', `${C.hero}@${C.lang}`, `Skin${event}-${sound}.${C.finalFormat}`),
					);
				}
				else {
					L(`Unfind Sound: ${sound}`);
				}
			}
		}
	}

	L.end();
})();
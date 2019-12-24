const isSameTakeConfig = function() {
	let isSameTakeConfig = false;
	try {
		const lastTakeConfig = require('../../_cache/lastTakeWpk.json');

		if(lastTakeConfig && lastTakeConfig.hero == C.hero && lastTakeConfig.lang == C.lang && lastTakeConfig.finalFormat == C.finalFormat) {
			isSameTakeConfig = true;
		}
	} catch(error) {
		isSameTakeConfig = false;
	}

	return isSameTakeConfig;
};

const takeWpkRaw = function(wpkFile) {
	const wpkBiffuer = Biffer(RD('_cache', 'extract', wpkFile));

	// eslint-disable-next-line no-unused-vars
	const [magic, version, count] = wpkBiffuer.unpack("4sLL");

	const headerOffsets = wpkBiffuer.unpack(`${count}L`);

	for(const headerOffset of headerOffsets) {
		wpkBiffuer.seek(headerOffset);

		const [offset, size, nameLength] = wpkBiffuer.unpack('LLL');
		const name = Buffer.from([...wpkBiffuer.raw(nameLength * 2)].filter(byte => byte)).toString('utf8');

		_fs.writeFileSync(RD('_cache', 'sound', 'wem', name), wpkBiffuer.buffer.slice(offset, offset + size));
	}
};

module.exports = function takeWpk(wpkFiles) {
	L(`-------takeWpk-------`);

	if(isSameTakeConfig()) { L('Same TakeConfig. Skip...'); return; }

	Fex.emptyDirSync(RD('_cache', 'sound'));

	for(let wpkFile of wpkFiles) {
		L(`[TakeWpk] ${wpkFile} TO ${C.finalFormat}`);

		if(C.finalFormat == 'wem') {
			takeWpkRaw(wpkFile);
		}
		else if((C.finalFormat == 'wav' || C.finalFormat == 'ogg')) {
			if(_fs.existsSync(C.rextractorConsolePath)) {
				_cp.execFileSync(C.rextractorConsolePath, [
					RD('_cache', 'extract', wpkFile),
					RD('_cache', 'sound'),
					`/sf:${C.finalFormat}`
				], { timeout: 1000 * 60 * 10 });
			}
			else {
				L(`[Error] Bad RextractorConsolePath: ${C.rextractorConsolePath}`);
			}

		}
		else {
			L(`[Error] Bad FinalFormat: ${C.finalFormat}`);
		}
	}

	_fs.writeFileSync(RD('_cache', 'lastTakeWpk.json'), JSON.stringify({ hero: C.hero, lang: C.lang, finalFormat: C.finalFormat }));
};
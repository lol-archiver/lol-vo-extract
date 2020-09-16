const isSameTakeConfig = function() {
	let isSameTakeConfig = false;
	try {
		const lastTakeConfig = require('../../_cache/lastTakeWpk.json');

		if(C.useWADLevel != 1 && lastTakeConfig &&
			lastTakeConfig.champ == C.champ &&
			lastTakeConfig.lang == C.lang &&
			lastTakeConfig.format == C.format &&
			lastTakeConfig.detect.sort().join(',') == C.detect.array.sort().join(',')
		) {
			isSameTakeConfig = true;
		}
	} catch(error) {
		isSameTakeConfig = false;
	}

	return isSameTakeConfig;
};

const takeWpkRaw = function(wpkFile) {
	const wpkBiffuer = new Biffer(RD('_cache', 'extract', wpkFile));

	// eslint-disable-next-line no-unused-vars
	const [magic, version, count] = wpkBiffuer.unpack("4sLL");

	const headerOffsets = wpkBiffuer.unpack(`${count}L`);

	for(const headerOffset of headerOffsets) {
		wpkBiffuer.seek(headerOffset);

		const [offset, size, nameLength] = wpkBiffuer.unpack('LLL');
		const name = Buffer.from([...wpkBiffuer.raw(nameLength * 2)].filter(byte => byte)).toString('utf8');

		_fs.writeFileSync(RD('_cache', 'audio', wpkFile, 'wem', name), wpkBiffuer.buffer.slice(offset, offset + size));
	}
};

module.exports = function extractAudios(wpkFiles) {
	L(`[Main] Extract audio files from Wpk/Bnk`);

	if(isSameTakeConfig()) { L('\tSame Take audio config, skip...'); return; }

	Fex.emptyDirSync(RD('_cache', 'audio'));

	for(let wpkFile of wpkFiles) {
		L(`\tConvert ${wpkFile} to ${C.format}`);

		Fex.emptyDirSync(RD('_cache', 'audio', wpkFile));
		if(C.format == 'wem') {
			takeWpkRaw(wpkFile);
		}
		else if((C.format == 'wav' || C.format == 'ogg')) {
			if(_fs.existsSync(C.path.rextractorConsole)) {
				try {
					_cp.execFileSync(C.path.rextractorConsole, [
						RD('_cache', 'extract', wpkFile),
						RD('_cache', 'audio', wpkFile),
						`/sf:${C.format}`
					], { timeout: 1000 * 60 * 10 });
				} catch(error) {
					L(`[Error] Exec File Error: ${error.message}`);
				}
			}
			else {
				L(`[Error] Bad Path RextractorConsole: ${C.path.rextractorConsole}`);
			}
		}
		else {
			L(`[Error] Bad Format to Convert: ${C.format}, skip...`);
		}
	}

	_fs.writeFileSync(RD('_cache', 'lastTakeWpk.json'), JSON.stringify({ champ: C.champ, lang: C.lang, format: C.format, detect: C.detect.array }));
};
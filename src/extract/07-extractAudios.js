import { execFileSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { emptyDirSync } from 'fs-extra';
import { resolve } from 'path';
import Biffer from '../../lib/Biffer.js';
import { I, C, dirCache, G } from '../../lib/global.js';


const isSameTakeConfig = function() {
	let isSameTakeConfig = false;
	try {
		const lastTakeConfig = import('../../_cache/lastTakeWpk.json');

		if(C.useWADLevel != 1 && lastTakeConfig &&
			lastTakeConfig.champ == I.slot &&
			lastTakeConfig.lang == C.lang &&
			lastTakeConfig.format == C.format &&
			lastTakeConfig.detect.sort().join(',') == C.idsSkin.sort().join(',')
		) {
			isSameTakeConfig = true;
		}
	} catch(error) {
		isSameTakeConfig = false;
	}

	return isSameTakeConfig;
};

const takeWpkRaw = function(wpkFile) {
	const wpkBiffuer = new Biffer(resolve(dirCache, 'extract', wpkFile));

	// eslint-disable-next-line no-unused-vars
	const [magic, version, count] = wpkBiffuer.unpack('4sLL');

	const headerOffsets = wpkBiffuer.unpack(`${count}L`);

	for(const headerOffset of headerOffsets) {
		wpkBiffuer.seek(headerOffset);

		const [offset, size, nameLength] = wpkBiffuer.unpack('LLL');
		const name = Buffer.from([...wpkBiffuer.raw(nameLength * 2)].filter(byte => byte)).toString('utf8');

		writeFileSync(resolve(dirCache, 'audio', wpkFile, 'wem', name), wpkBiffuer.buffer.slice(offset, offset + size));
	}
};

export default function extractAudios(wpkFiles) {
	G.info(`[Main] Extract audio files from Wpk/Bnk`);

	if(isSameTakeConfig()) { G.info('\tSame Take audio config, skip...'); return; }

	emptyDirSync(resolve(dirCache, 'audio'));

	for(let wpkFile of wpkFiles) {
		G.info(`\tConvert ${wpkFile} to ${C.format}`);

		emptyDirSync(resolve(dirCache, 'audio', wpkFile));
		if(C.format == 'wem') {
			takeWpkRaw(wpkFile);
		}
		else if((C.format == 'wav' || C.format == 'ogg')) {
			if(existsSync(C.path.rextractorConsole)) {
				try {
					execFileSync(C.path.rextractorConsole, [
						resolve(dirCache, 'extract', wpkFile),
						resolve(dirCache, 'audio', wpkFile),
						`/sf:${C.format}`
					], { timeout: 1000 * 60 * 10 });
				} catch(error) {
					G.info(`[Error] Exec File Error: ${error.message}`);
				}
			}
			else {
				G.info(`[Error] Bad Path RextractorConsole: ${C.path.rextractorConsole}`);
			}
		}
		else {
			G.info(`[Error] Bad Format to Convert: ${C.format}, skip...`);
		}
	}

	writeFileSync(resolve(dirCache, 'lastTakeWpk.json'), JSON.stringify({ champ: I.slot, lang: C.lang, format: C.format, detect: C.idsSkin }));
}
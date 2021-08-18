import { execFileSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import FSX from 'fs-extra';

import { C, I, G, dirCache } from '../../lib/global.js';
import Biffer from '../../lib/Biffer.js';


const isSameTakeConfig = function() {
	let isSameTakeConfig = false;
	try {
		const lastTakeConfig = FSX.readJsonSync(resolve(dirCache, 'lastTakeWpk.json'));

		if(C.useWADLevel != 1 && lastTakeConfig &&
			lastTakeConfig.slot == I.slot &&
			lastTakeConfig.lang == C.lang &&
			lastTakeConfig.format == C.format &&
			lastTakeConfig.detect.sort().join(',') == I.idsSkin.sort().join(',')
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
	if(isSameTakeConfig()) { G.infoD('AudioExtractor', 'same extract-config founded', 'skip'); return; }

	for(let wpkFile of wpkFiles) {
		G.infoU('AudioExtractor', `extract ~{${wpkFile}} to ~{${C.format}}`, `extracting...`);

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
					G.errorU('AudioExtractor', `extract ~{${wpkFile}} to ~{${C.format}}`, `exec ~[Rextractor]`, error);
				}
			}
			else {
				G.errorU('AudioExtractor', `extract ~{${wpkFile}} to ~{${C.format}}`, `~[Rextractor] not exists`, `path~{${C.path.rextractorConsole}}`);
			}
		}
		else {
			G.errorU('AudioExtractor', `extract ~{${wpkFile}} to ~{${C.format}}`, `unknown format~{${C.format}}`, 'skip');
		}

		G.infoD('AudioExtractor', `extract ~{${wpkFile}} to ~{${C.format}}`, '✔ ');
	}

	writeFileSync(resolve(dirCache, 'lastTakeWpk.json'), JSON.stringify({ slot: I.slot, lang: C.lang, format: C.format, detect: I.idsSkin }));
}
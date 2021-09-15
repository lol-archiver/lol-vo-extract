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

const takeWpkRaw = function(fileWPK) {
	try {
		G.infoU('AudioExtractor', `extract ~{${fileWPK}} to ~{wem}`, `extracting...`);

		const wpkBiffuer = new Biffer(resolve(dirCache, 'extract', fileWPK));

		FSX.emptyDirSync(resolve(dirCache, 'audio', fileWPK, 'wem'));

		// eslint-disable-next-line no-unused-vars
		const [magic, version, count] = wpkBiffuer.unpack('4sLL');

		const headerOffsets = wpkBiffuer.unpack(`${count}L`);

		for(const headerOffset of headerOffsets) {
			wpkBiffuer.seek(headerOffset);

			const [offset, size, nameLength] = wpkBiffuer.unpack('LLL');
			const name = Buffer.from([...wpkBiffuer.raw(nameLength * 2)].filter(byte => byte)).toString('utf8');

			writeFileSync(resolve(dirCache, 'audio', fileWPK, 'wem', name), wpkBiffuer.buffer.slice(offset, offset + size));
		}

		G.infoD('AudioExtractor', `extract ~{${fileWPK}} to ~{wem}`, `✔ `);
	}
	catch(error) {
		G.errorD('AudioExtractor', `extract ~{${fileWPK}} to ~{wem}`, error);
	}
};

export default function extractAudios(filesWPK) {
	if(isSameTakeConfig()) { G.infoD('AudioExtractor', 'same extract config founded', 'skip'); return; }

	for(let fileWPK of filesWPK) {
		FSX.emptyDirSync(resolve(dirCache, 'audio', fileWPK));

		takeWpkRaw(fileWPK);

		if(C.format == 'wav' || C.format == 'ogg') {
			G.infoU('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, `extracting...`);

			if(existsSync(C.path.rextractorConsole)) {
				try {
					execFileSync(C.path.rextractorConsole, [
						resolve(dirCache, 'extract', fileWPK),
						resolve(dirCache, 'audio', fileWPK),
						`/sf:${C.format}`
					], { timeout: 1000 * 60 * 10 });
				}
				catch(error) {
					G.errorD('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, `exec ~[Rextractor]`, error);
				}
			}
			else {
				G.errorD('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, `~[Rextractor] not exists`, `path~{${C.path.rextractorConsole}}`);
			}

			G.infoD('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, '✔ ');
		}
		else {
			G.error('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, `unknown format~{${C.format}}`, 'skip');
		}
	}

	writeFileSync(resolve(dirCache, 'lastTakeWpk.json'), JSON.stringify({ slot: I.slot, lang: C.lang, format: C.format, detect: I.idsSkin }));
}
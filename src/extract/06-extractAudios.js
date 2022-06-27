import { execFileSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import FSX from 'fs-extra';

import { dirCache } from '../../lib/global.dir.js';
import { C, I, G } from '../../lib/global.js';
import Biffer from '@nuogz/biffer';


const isSameTakeConfig = function() {
	let isSameTakeConfig = false;
	try {
		const lastTakeConfig = FSX.readJSONSync(resolve(dirCache, 'lastTakeWpk.json'));

		if(C.sourceWAD != 'fetch' && lastTakeConfig &&
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

		const bifferWPK = new Biffer(resolve(dirCache, 'extract', fileWPK));

		FSX.emptyDirSync(resolve(dirCache, 'audio', fileWPK, 'wem'));

		// eslint-disable-next-line no-unused-vars
		const [magic, version, count] = bifferWPK.unpack('4sLL');
		console.log(magic, version);
		const headerOffsets = bifferWPK.unpack(`${count}L`);

		for(const headerOffset of headerOffsets) {
			bifferWPK.seek(headerOffset);

			const [offset, size, nameLength] = bifferWPK.unpack('LLL');

			if(size && offset && offset < bifferWPK.length) {
				const name = Buffer.from([...bifferWPK.slice(nameLength * 2)].filter(byte => byte)).toString('utf8');

				bifferWPK.seek(offset);

				if(name) {
					writeFileSync(resolve(dirCache, 'audio', fileWPK, 'wem', name), bifferWPK.slice(size));
				}
			}
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

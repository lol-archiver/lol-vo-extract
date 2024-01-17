import { execFileSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { emptyDirSync, readJSONSync } from 'fs-extra/esm';

import Biffer from '@nuogz/biffer';

import { C, G } from '@nuogz/pangu';

import { dirCache } from '../../lib/dir.js';
import { I } from '../../lib/info.js';
import { toHexL8 } from '../../lib/utility.js';



const isSameTakeConfig = () => {
	if(C.forceExtract) { return true; }


	let isSameTakeConfig = false;

	try {
		const lastTakeConfig = readJSONSync(resolve(dirCache, 'lastTakeWpk.json'));

		if(C.sourceWAD != 'fetch' && lastTakeConfig &&
			lastTakeConfig.slot == I.slot &&
			lastTakeConfig.lang == C.lang &&
			lastTakeConfig.format == C.format &&
			lastTakeConfig.detect.sort().join(',') == I.idsSkin.sort().join(',')
		) {
			isSameTakeConfig = true;
		}
	}
	catch(error) { isSameTakeConfig = false; }

	return isSameTakeConfig;
};

const extractWEM = file => {
	try {
		G.infoU('AudioExtractor', `extract ~{${file}} to ~{wem}`, `○ extracting...`);

		emptyDirSync(resolve(dirCache, 'audio', file, 'wem'));

		const bifferWPK = new Biffer(resolve(dirCache, 'extract', file));
		const [magic] = bifferWPK.unpack('4s');

		if(magic != 'r3d2') {
			bifferWPK.seek(0);

			let indexData;
			while(!bifferWPK.isEnd()) {
				const [tagSection, sizeSection] = bifferWPK.unpack('4sL');

				// Bank Header
				if(tagSection == 'BKHD') {
					const [
						version,
						idBank,
						/* idLanguage */,
						// 0000 0000 0000 0000 1111 1111 1111 1111 = unused
						// 1111 1111 1111 1111 0000 0000 0000 0000 = allocatedDevice
						/* bitsValuesAlt */,
						idProject
					] = bifferWPK.unpack('5L');

					const gap = sizeSection - Biffer.calc('5L');
					if(gap > 0) { bifferWPK.skip(gap); }


					if(version != 134) {
						G.errorD('AudioExtractor', `~[${file}] unexpected ~[Bank Version]`, `~{${version}}`);

						throw Error(`unexpected ~[Bank Version]~{${version}}`);
					}

					G.debugD('AudioExtractor', `~[${file}] ~[Bank Header]`, `~[Version]~{${version}} ~[Bank ID]~{${toHexL8(idBank)}} ~[Project ID]~{${toHexL8(idProject)}}`);
				}
				else if(tagSection == 'DIDX') {
					if(indexData) {
						G.errorD('AudioExtractor', `~[${file}] unexpected ~[Data Index]`, `data index more than one`);

						throw Error(`unexpected ~[Data Index] length`);
					}

					const bifferDIDX = bifferWPK.sub(sizeSection);

					const headers = [];
					while(!bifferDIDX.isEnd()) {
						const [id, offset, size] = bifferDIDX.unpack('3L');

						headers.push({ id, offset, size });
					}

					indexData = { tag: 'DIDX', headers };

					G.debugD('AudioExtractor', `~[${file}] ~[Data Index]`, `~[Size]~{${headers.length}}`);
				}
				else if(tagSection == 'DATA') {
					const bifferDATA = bifferWPK.sub(sizeSection);

					if(!indexData) { continue; }

					for(const { id, offset, size } of indexData.headers) {
						bifferDATA.seek(offset);

						writeFileSync(resolve(dirCache, 'audio', file, 'wem', `${id}.wem`), bifferDATA.slice(size));
					}
				}
				else {
					bifferWPK.skip(sizeSection);

					G.warnD('AudioExtractor', `~[${file}] unhandled ~[Bank Section Tag]~{${tagSection}}`, `~[Size]~{${sizeSection}}`);
				}
			}
		}
		else {
			const [version, count] = bifferWPK.unpack('LL');
			if(version != 1) { G.warnD('AudioExtractor', `~[${file}] unhandled ~[Wwise Package Version]~{${version}}`, `~[Version]~{${version}}`); }


			const offsetsData = bifferWPK.unpack(`${count}L`);
			for(const offsetData of offsetsData) {
				bifferWPK.seek(offsetData);

				const [offset, size, nameLength] = bifferWPK.unpack('LLL');

				if(size && offset && offset < bifferWPK.length) {
					const name = Buffer.from([...bifferWPK.slice(nameLength * 2)].filter(byte => byte)).toString('utf8');

					bifferWPK.seek(offset);

					if(name) {
						writeFileSync(resolve(dirCache, 'audio', file, 'wem', name), bifferWPK.slice(size));
					}
				}
			}
		}

		G.infoD('AudioExtractor', `extract ~{${file}} to ~{wem}`, `✔ `);
	}
	catch(error) {
		G.errorD('AudioExtractor', `extract ~{${file}} to ~{wem}`, error);
	}
};

export default function extractAudios(filesWPK) {
	if(isSameTakeConfig()) { G.infoD('AudioExtractor', 'same extract config founded', 'skip'); return; }

	for(let fileWPK of filesWPK) {
		emptyDirSync(resolve(dirCache, 'audio', fileWPK));

		extractWEM(fileWPK);

		if(C.format == 'wav' || C.format == 'ogg') {
			G.infoU('AudioExtractor', `extract ~{${fileWPK}} to ~{${C.format}}`, `○ extracting...`);

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

import { writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import GZIP from 'node-gzip';

import { dirCache } from '../../lib/global.dir.js';
import { G } from '../../lib/global.js';
import Biffer from '../../lib/Biffer.js';
import { unZstd } from '../../lib/Tool.js';


export default async function extractWad(wadPath, takeMap) {
	G.info('WADExtractor',`extract game files from wad~{${parse(wadPath).base}}`);

	const wadBiffer = new Biffer(wadPath);

	// eslint-disable-next-line no-unused-vars
	const [magic, versionMajor, versionMinor] = wadBiffer.unpack('2sBB');

	if(versionMajor == 1) {
		wadBiffer.seek(8);
	}
	else if(versionMajor == 2) {
		wadBiffer.seek(100);
	}
	else if(versionMajor == 3) {
		wadBiffer.seek(268);
	}

	const [entryCount] = wadBiffer.unpack('I');
	const takeFiles = [];

	for(let i = 0; i < entryCount; i++) {
		// eslint-disable-next-line no-unused-vars
		let hash, offset, size, type, compressedSize, duplicate, sha256;

		if(versionMajor == 1) {
			[hash, offset, compressedSize, size, type] = wadBiffer.unpack('QIIII');
		}
		else {
			// eslint-disable-next-line no-unused-vars
			[hash, offset, compressedSize, size, type, duplicate, , , sha256] = wadBiffer.unpack('QIIIBBBBQ');
		}

		const saveName = takeMap[hash];
		if(saveName) {
			const fileBuffer = wadBiffer.buffer.slice(offset, offset + compressedSize);

			const pathSave = resolve(dirCache, 'extract', saveName);

			takeFiles.push(saveName);

			if(type == 0) {
				writeFileSync(pathSave, fileBuffer);
			}
			else if(type == 1) {
				writeFileSync(pathSave, await GZIP.ungzip(fileBuffer));
			}
			else if(type == 2) {
				throw 'unused extract';
				// const [n] = new Biffer(fileBuffer).unpack('L');
				// target = data[4: 4 + n].rstrip(b'\0').decode('utf-8')
			}
			else if(type == 3) {
				await unZstd(pathSave, fileBuffer);
			}
		}
	}

	return takeFiles.sort();
}
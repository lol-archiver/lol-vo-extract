import { execFileSync } from 'child_process';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import { parse as parsePath, resolve as resolvePath } from 'path';

import { emptyDirSync } from 'fs-extra/esm';

import Biffer from '@nuogz/biffer';

import { G } from '@nuogz/pangu';

import { T, TS } from '../../lib/i18n.js';
import { TLogError, toHexL8 } from '../../lib/utility.js';



const GG = G.where(T('extract-audio:where'));


/**
 * @param {string} file
 * @param {string} dirExtract
 */
const extractWEM = (file, dirExtract) => {
	const base = parsePath(file).base;

	try {
		GG.infoU(...TS('extract-audio:extract-wem', { name: base }, '...'));


		const bifferBank = new Biffer(file);
		const [magic] = bifferBank.unpack('4s');

		// bnk file
		if(magic != 'r3d2') {
			bifferBank.seek(0);

			let indexData;
			while(!bifferBank.isEnd()) {
				const [tagSection, sizeSection] = bifferBank.unpack('4sL');

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
					] = bifferBank.unpack('5L');

					const gap = sizeSection - Biffer.calc('5L');
					if(gap > 0) { bifferBank.skip(gap); }


					if(version != 134) {
						G.errorD('AudioExtractor', `~[${base}] unexpected ~[Bank Version]`, `~{${version}}`);

						throw Error(`unexpected ~[Bank Version]~{${version}}`);
					}

					G.debugD('AudioExtractor', `~[${base}] ~[Bank Header]`, `~[Version]~{${version}} ~[Bank ID]~{${toHexL8(idBank)}} ~[Project ID]~{${toHexL8(idProject)}}`);
				}
				else if(tagSection == 'DIDX') {
					if(indexData) {
						G.errorD('AudioExtractor', `~[${base}] unexpected ~[Data Index]`, `data index more than one`);

						throw Error(`unexpected ~[Data Index] length`);
					}

					const bifferDIDX = bifferBank.sub(sizeSection);

					const headers = [];
					while(!bifferDIDX.isEnd()) {
						const [id, offset, size] = bifferDIDX.unpack('3L');

						headers.push({ id, offset, size });
					}

					indexData = { tag: 'DIDX', headers };

					G.debugD('AudioExtractor', `~[${base}] ~[Data Index]`, `~[Size]~{${headers.length}}`);
				}
				else if(tagSection == 'DATA') {
					const bifferDATA = bifferBank.sub(sizeSection);

					if(!indexData) { continue; }

					for(const { id, offset, size } of indexData.headers) {
						bifferDATA.seek(offset);

						writeFileSync(resolvePath(dirExtract, `${id}.wem`), bifferDATA.slice(size));
					}
				}
				else {
					bifferBank.skip(sizeSection);

					G.warnD('AudioExtractor', `~[${base}] unhandled ~[Bank Section Tag]~{${tagSection}}`, `~[Size]~{${sizeSection}}`);
				}
			}
		}
		// wpk file
		else {
			const [version, count] = bifferBank.unpack('LL');
			if(version != 1) { G.warnD('AudioExtractor', `~[${base}] unhandled ~[Wwise Package Version]~{${version}}`, `~[Version]~{${version}}`); }


			const offsetsData = bifferBank.unpack(`${count}L`);
			for(const offsetData of offsetsData) {
				bifferBank.seek(offsetData);

				const [offset, size, nameLength] = bifferBank.unpack('LLL');

				if(size && offset && offset < bifferBank.length) {
					const name = Buffer.from([...bifferBank.slice(nameLength * 2)].filter(byte => byte)).toString('utf8');

					bifferBank.seek(offset);

					if(name) {
						writeFileSync(resolvePath(dirExtract, name), bifferBank.slice(size));
					}
				}
			}
		}

		GG.infoD(...TS('extract-audio:extract-wem', { name: base }, '✔'));
	}
	catch(error) {
		throw TLogError('extract-audio:extract-wem', {}, error);
	}
};


/**
 * @param {string[]} filesBank
 * @param {import('../../bases.d.ts').ExtractConfig} E
 */
export default function extractAudios(filesBank, E) {
	for(const fileBank of filesBank) {
		const pathParsedBank = parsePath(fileBank);
		const baseBank = pathParsedBank.base;

		const dirCacheAudioWEM = resolvePath(E.dirCacheAudio, `[wem]${baseBank}`);
		const dirCacheAudioWAV = resolvePath(E.dirCacheAudio, `[wav]${baseBank}`);
		const countCacheAudioWEM = existsSync(dirCacheAudioWEM) ? readdirSync(dirCacheAudioWEM).length : 0;
		const countCacheAudioWAV = existsSync(dirCacheAudioWAV) ? readdirSync(dirCacheAudioWAV).length : 0;

		if(!E.forceExtractFile && countCacheAudioWEM == countCacheAudioWAV && countCacheAudioWEM > 0) { return GG.infoD(...TS('extract-audio.', 'check-cache', 'skip-found-cache')); }


		emptyDirSync(dirCacheAudioWEM);
		emptyDirSync(dirCacheAudioWAV);


		GG.infoU(...TS('extract-audio:extract-wem', { name: baseBank }, '...'));

		extractWEM(fileBank, dirCacheAudioWEM);

		GG.infoD(...TS('extract-audio:extract-wem', { name: baseBank }, '✔'));


		GG.infoU(...TS('extract-audio:extract', { format: E.format, name: baseBank }, '...'));

		if(E.format == 'wav' || E.format == 'ogg') {
			if(existsSync(E.fileRExtractorConsole)) {
				try {
					execFileSync(E.fileRExtractorConsole, [fileBank, dirCacheAudioWAV, `/sf:${E.format}`], { timeout: 1000 * 60 * 10 });
				}
				catch(error) {
					GG.errorD(T('extract-audio:exectue-rextractor', { format: E.format, name: baseBank }), error);
				}
			}
			else {
				GG.errorD(...TS('extract-audio:extract', { format: E.format, name: baseBank, path: E.fileRExtractorConsole }, 'unknown-rextractor'));
			}

			GG.infoD(...TS('extract-audio:extract', { format: E.format, name: baseBank }, '✔'));
		}
		else {
			GG.warnD(...TS('extract-audio:extract', { format: E.format, name: baseBank }, 'skip-unknown-format'));
		}
	}
}

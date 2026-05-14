import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { parse as parsePath, resolve as resolvePath } from 'node:path';

import { emptyDirSync } from 'fs-extra/esm';

import Biffer from '@danor-lib/biffer';

import { G } from '@nuogz/pangu';

import { T, TS } from '../lib/i18n.js';
import { TLogError, toHexL8 } from '../lib/utility.js';

const GG = G.where(T('extract-audio:where'));



const versionsSupport = [134, 145];

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
			while(!bifferBank.isReach()) {
				const [tagSection, sizeSection] = bifferBank.unpack('4sL');

				// Bank Header
				if(tagSection == 'BKHD') {
					const [
						version,
						idBank,
						/* idLanguage */,
						// 0000 0000 0000 0000 1111 1111 1111 1111 = unused(<=134) alignment(>134)
						// 1111 1111 1111 1111 0000 0000 0000 0000 = allocatedDevice
						/* bitsValuesAlt */,
						idProject
					] = bifferBank.unpack('5L');

					if(version > 141) {
						/* const [typeBank, hashBank] = */ bifferBank.unpack('LQQ');
					}

					const gap = version <= 141 ? sizeSection - Biffer.calc('5L') :
						sizeSection - Biffer.calc('5L') - Biffer.calc('L') - Biffer.calc('4L');
					if(gap > 0) { bifferBank.skip(gap); }


					if(!versionsSupport.includes(version)) {
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

					const bifferDIDX = bifferBank.slice(sizeSection);

					const headers = [];
					while(!bifferDIDX.isReach()) {
						const [id, offset, size] = bifferDIDX.unpack('3L');

						headers.push({ id, offset, size });
					}

					indexData = { tag: 'DIDX', headers };

					G.debugD('AudioExtractor', `~[${base}] ~[Data Index]`, `~[Size]~{${headers.length}}`);
				}
				else if(tagSection == 'DATA') {
					const bifferDATA = bifferBank.slice(sizeSection);

					if(!indexData) { continue; }

					for(const { id, offset, size } of indexData.headers) {
						bifferDATA.seek(offset);

						writeFileSync(resolvePath(dirExtract, `${id}.wem`), bifferDATA.slice(size, { wrap: false }));
					}
				}
				else {
					bifferBank.skip(sizeSection);

					if(!['HIRC'].includes(tagSection)) {
						G.warnD('AudioExtractor', `~[${base}] unhandled ~[Bank Section Tag]~{${tagSection}}`, `~[Size]~{${sizeSection}}`);
					}
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
					const name = Buffer.from([...bifferBank.slice(nameLength * 2, { wrap: false })].filter(byte => byte)).toString('utf8');

					bifferBank.seek(offset);

					if(name) {
						writeFileSync(resolvePath(dirExtract, name), bifferBank.slice(size, { wrap: false }));
					}
				}
			}
		}

		GG.infoD(...TS('extract-audio:extract-wem', { name: base }, '✔'));
	}
	catch(error) {
		throw TLogError('extract-audio:extract-wem', { name: base }, error.message ?? error?.toString?.() ?? String(error));
	}
};


/**
 * @param {string[]} filesBank
 * @param {import('../bases.js').ExtractConfig} E
 */
export default function extractAudios(filesBank, E) {
	for(const fileBank of filesBank) {
		const pathParsedBank = parsePath(fileBank);
		const baseBank = pathParsedBank.base;

		const dirCacheAudioWEM = resolvePath(E.dirCacheAudio, `[wem]${baseBank}`);
		const dirCacheAudioWAV = resolvePath(E.dirCacheAudio, `[wav]${baseBank}`);
		const countCacheAudioWEM = existsSync(dirCacheAudioWEM) ? readdirSync(dirCacheAudioWEM).length : 0;
		const countCacheAudioWAV = existsSync(dirCacheAudioWAV) ? readdirSync(dirCacheAudioWAV).filter(f => f.endsWith('.wav')).length : 0;
		const countCacheAudioOGG = existsSync(dirCacheAudioWAV) ? readdirSync(dirCacheAudioWAV).filter(f => f.endsWith('.ogg')).length : 0;

		if(
			!E.forceExtractFile
			&& (false
				|| (E.format == 'wem' && countCacheAudioWEM > 0)
				|| (E.format == 'wav' && countCacheAudioWEM > 0 && countCacheAudioWEM == countCacheAudioWAV)
				|| (E.format == 'ogg' && countCacheAudioWEM > 0 && countCacheAudioWEM == countCacheAudioOGG)
			)
		) { return GG.infoD(...TS('extract-audio.', 'check-cache', 'skip-found-cache')); }


		emptyDirSync(dirCacheAudioWEM);
		emptyDirSync(dirCacheAudioWAV);


		GG.infoU(...TS('extract-audio:extract-wem', { name: baseBank }, '...'));

		extractWEM(fileBank, dirCacheAudioWEM);

		GG.infoD(...TS('extract-audio:extract-wem', { name: baseBank }, '✔'));


		GG.infoU(...TS('extract-audio:extract', { format: E.format, name: baseBank }, '...'));

		if(E.format == 'wav') {
			const filesCacheAudioWEMNew = readdirSync(dirCacheAudioWEM);

			if(filesCacheAudioWEMNew.length) {
				if(existsSync(E.fileVGMStreamCLI)) {
					try {
						execFileSync(E.fileVGMStreamCLI, ['-o', resolvePath(dirCacheAudioWAV, '?f.wav'), ...filesCacheAudioWEMNew], { cwd: dirCacheAudioWEM, timeout: 1000 * 60 * 10 });

						for(const file of readdirSync(dirCacheAudioWAV)) {
							renameSync(
								resolvePath(dirCacheAudioWAV, file),
								resolvePath(dirCacheAudioWAV, file.replace(/\.wem\.wav$/, '.wav')),
							);
						}
					}
					catch(error) {
						GG.errorD(T('extract-audio:exectue-rextractor', { format: E.format, name: baseBank }), error);
					}
				}
				else {
					GG.errorD(...TS('extract-audio:extract', { format: E.format, name: baseBank, path: E.fileRExtractorConsole }, 'unknown-rextractor'));
				}
			}

			GG.infoD(...TS('extract-audio:extract', { format: E.format, name: baseBank }, '✔'));
		}
		else if(E.format == 'ogg') {
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
		else if(E.format != 'wem') {
			GG.warnD(...TS('extract-audio:extract', { format: E.format, name: baseBank }, 'skip-unknown-format'));
		}
	}
}

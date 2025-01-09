import { G } from '@nuogz/pangu';

import { parse as parsePath, resolve as resolvePath } from 'path';

import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { T, TS } from '../lib/i18n.js';

import parseAssetFilesNeed from './parse-asset-files-need.js';
import parseGameFilesNeed from './parse-game-files-need.js';
import parseEvents from './parse-events.js';
import extractAudios from './extract-audios.js';
import saveAudios$fileBank from './copy-audios.js';
import saveDictation from './save-dictation.js';



const GG = G.where(T('where:extract-voices'));


/** @param {import('../bases.js').ExtractConfig} E */
export default async function extractVoices(E = {}) {
	/** @type {string[]} */
	const filesUnpacked = [];
	if(E.filesGame?.length) {
		const filesGame = [...E.filesGame];

		let dirBaseWAD;
		if(filesGame[0].startsWith('@')) { dirBaseWAD = filesGame.shift().replace(/^@/, ''); }


		filesUnpacked.push(...filesGame.filter(file => !file.includes('|')));

		const resultsLogExtract = [];
		for(const file of filesGame.filter(file => file.includes('|'))) {
			const [fileWAD, fileInpack] = file.split('|');
			const nameFileInpack = parsePath(fileInpack).base;

			const [configExtract] = await extractWAD(
				dirBaseWAD ? resolvePath(dirBaseWAD, fileWAD) : fileWAD,
				[{
					fileInpack,
					fileSave: resolvePath(E.dirCacheGame, nameFileInpack),
				}]
			);


			if(configExtract?.fileSave) {
				filesUnpacked.push(configExtract.fileSave);

				resultsLogExtract.push({ name: nameFileInpack, saved: '✔' });
			}
			else {
				resultsLogExtract.push({ name: nameFileInpack, saved: '✖' });
			}
		}

		GG.infoD(...TS('parse-game-files-need', '✔', ...resultsLogExtract.map(result => ['file', result])));
	}
	else {
		GG.infoU(...TS('parse-asset-files-need', '...'));

		const filesNeed = parseAssetFilesNeed(E);

		GG.infoD(...TS('parse-asset-files-need', '✔', ...filesNeed.map(({ name }) => ['file', { name }])));


		// TODO: fetch is break. only support extract local file now. wait to fix
		// await fetchWADs(filesNeed);


		GG.infoU(...TS('parse-game-files-need', '...'));

		const configsExtractRaw = parseGameFilesNeed(E);

		filesUnpacked.push(...[
			await extractWAD(filesNeed.find(file => file.type == 'champion-main').path, configsExtractRaw),
			await extractWAD(filesNeed.find(file => file.type == 'champion-lang').path, configsExtractRaw),
		].flat().map(({ fileSave }) => fileSave));


		GG.infoD(...TS('parse-game-files-need', '✔', ...configsExtractRaw.map(({ fileInpack, fileSave }) =>
			['file', { name: parsePath(fileInpack).base, saved: filesUnpacked.includes(fileSave) ? '✔' : '✖' }])));
	}



	GG.infoU(...TS('parse-event', '...'));

	const [events$idAudio, idsSound$idAudio] = await parseEvents(E, filesUnpacked);

	GG.infoD(...TS('parse-event', '✔'));



	if(!E.skipExtract) {
		const filesWPK = filesUnpacked.filter(file => file.endsWith('.wpk'));


		// extract vocie files from wpk
		extractAudios(filesWPK, E);


		GG.infoU(...TS('save-audios', '...'));

		// save voice files and rename with events
		saveAudios$fileBank(filesWPK, events$idAudio, idsSound$idAudio, E);

		GG.infoD(...TS('save-audios', '✔'));
	}

	if(!E.skipSaveDictation) {
		GG.infoU(...TS('save-dictation', '...'));

		// save event JSON for `lol-vo-lines-dictation`
		saveDictation(events$idAudio, idsSound$idAudio, E);

		GG.infoD(...TS('save-dictation', '✔'));
	}
}

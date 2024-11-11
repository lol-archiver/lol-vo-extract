import { G } from '@nuogz/pangu';

import { extractWAD } from '@lol-archiver/lol-wad-extract';

import { T, TS } from '../lib/i18n.js';

import parseAssetFilesNeed from './extract/01-initFetch.js';
import parseGameFilesNeed from './extract/03-parseInfosExtractAll.js';
import parseEvents from './parse-events.js';
import copyAudios$fileBank from './extract/07-copyAudios.js';
import saveDictation from './extract/08-saveEvents.js';
import { parse as parsePath } from 'path';
import extractAudios from './extract/06-extractAudios.js';



const GG = G.where(T('where:extract-voices'));


/** @param {import('../bases.js').ExtractConfig} E */
export default async function extractVoices(E = {}) {
	let filesUnpacked = [];
	if(E.filesGame?.length) {
		filesUnpacked = E.filesGame;
	}
	else {
		GG.infoU(...TS('parse-asset-files-need', '...'));

		const filesNeed = parseAssetFilesNeed(E);

		GG.infoD(...TS('parse-asset-files-need', '✔', ...filesNeed.map(({ name }) => ['file', { name }])));


		// TODO: fetch is break. only support extract local file now. wait to fix
		// await fetchWADs(filesNeed);


		GG.infoU(...TS('parse-game-files-need', '...'));

		const configsExtractRaw = parseGameFilesNeed(E);

		filesUnpacked = [
			...await extractWAD(filesNeed.find(file => file.type == 'champion-main').path, configsExtractRaw),
			...await extractWAD(filesNeed.find(file => file.type == 'champion-lang').path, configsExtractRaw),
		].map(({ fileSave }) => fileSave);


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


		// copy voice files and rename with events
		copyAudios$fileBank(filesWPK, events$idAudio, idsSound$idAudio, E);


		// save event JSON for `lol-vo-lines-dictation`
		saveDictation(events$idAudio, idsSound$idAudio, E);
	}
}

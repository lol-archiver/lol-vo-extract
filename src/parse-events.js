import { G } from '@nuogz/pangu';

import { parse as parsePath } from 'path';

import { T, TS } from '../lib/i18n.js';

import parseBIN from './parse-bin.js';
import parseBNK from './parse-bnk.js';



const GG = G.where(T('parse-event:where'));

/**
 * @param {import('../bases.d.ts').ExtractConfig} E
 * @param {string[]} filesUnpacked
 */
export default async function parseEvents(E, filesUnpacked) {
	const events = new Set();

	for(const file of filesUnpacked.filter(file => file.endsWith('.bin'))) {
		GG.infoU(...TS('parse-event:parse-bin', { name: parsePath(file).base }, '...'));

		const eventsBIN = parseBIN(file);

		for(const event of eventsBIN) {
			events.add(event);
		}

		GG.infoD(...TS('parse-event:parse-bin', { name: parsePath(file).base }, '✔'));
	}


	/** @type {Object<string, Set>} */
	const events$idAudio = {};
	/** @type {Object<string, Set>} */
	const idsSound$idAudio = {};

	for(const file of filesUnpacked.filter(file => file.endsWith('.bnk'))) {
		GG.infoD(...TS('parse-event:parse-bnk', { name: parsePath(file).base }, '...'));

		const [eventsBNK$idAudio, idsSoundBNK$idAudio] = await parseBNK(E, file, events);

		GG.infoD(...TS('parse-event:parse-bnk', { name: parsePath(file).base }, '✔'));


		for(const idAudio in eventsBNK$idAudio) {
			const eventsBNK = eventsBNK$idAudio[idAudio];

			for(const event of eventsBNK) {
				(events$idAudio[idAudio] || (events$idAudio[idAudio] = new Set())).add(event);
			}
		}


		for(const idAudio in idsSoundBNK$idAudio) {
			const idsSoundBNK = idsSoundBNK$idAudio[idAudio];

			(idsSound$idAudio[idAudio] || (idsSound$idAudio[idAudio] = new Set())).add(...idsSoundBNK);
		}
	}


	return [events$idAudio, idsSound$idAudio];
}

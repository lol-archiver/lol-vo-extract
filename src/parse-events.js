import { C, G } from '@nuogz/pangu';

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
	const literalsEvent = new Set();

	for(const file of filesUnpacked.filter(file => file.endsWith('.bin'))) {
		GG.infoU(...TS('parse-event:parse-bin', { name: parsePath(file).base }, '...'));

		const literalsEventBIN = parseBIN(file).concat(C['event-manual'] ?? []);

		for(const literalEvent of literalsEventBIN) {
			literalsEvent.add(literalEvent);
		}

		GG.infoD(...TS('parse-event:parse-bin', { name: parsePath(file).base }, '✔'));
	}


	/** @type {import('./entry/bnk/HIRCObject.js').HIRCObject[]} */
	const objectsBNKAll = [];
	for(const file of filesUnpacked.filter(file => file.endsWith('.bnk'))) {
		GG.infoU(...TS('parse-event:parse-bnk', { name: parsePath(file).base }, '...'));

		const objectsBNK = await parseBNK(E, file, literalsEvent);

		GG.infoD(...TS('parse-event:parse-bnk', { name: parsePath(file).base }, '✔'));

		objectsBNKAll.push(...objectsBNK);
	}


	return objectsBNKAll;
}

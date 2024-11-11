import { existsSync } from 'fs';
import { resolve } from 'path';

import { SOURCE_WAD as SOURCE_ASSET } from '../lib/constant.js';
import { TLogError } from '../lib/utility.js';



/** @param {import('../bases.js').ExtractConfig} E */
export default function parseAssetFilesNeed(E) {
	const namePackMain = `${E.slot}.wad.client`.toLowerCase();
	const namePackLang = `${E.slot}.${E.lang}.wad.client`.toLowerCase();


	const filesNeed = [
		{ name: namePackMain, type: 'champion-main', path: resolve(E.dirGameClient, 'game', 'data', 'final', 'champions', namePackMain), existing: false },
		{ name: namePackLang, type: 'champion-lang', path: resolve(E.dirGameClient, 'game', 'data', 'final', 'champions', namePackLang), existing: false },
	];

	for(const file of filesNeed) {
		file.existing = existsSync(file.path);

		if(E.sourceAsset == SOURCE_ASSET.CLIENT && !file.existing) {
			throw TLogError('parse-asset-files-need', { path: file.path }, 'unknown-file');
		}
	}


	return filesNeed;
}

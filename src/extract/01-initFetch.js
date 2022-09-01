import { existsSync } from 'fs';
import { resolve } from 'path';

import { C, G } from '@nuogz/pangu';

import { T } from '../../lib/i18n.js';
import { I } from '../../lib/info.js';
import { SOURCE_WAD } from '../../lib/constant.js';
import { dirCache } from '../../lib/dir.js';



const isSourceFromClient = C.sourceWAD == SOURCE_WAD.CLIENT;
const isSourceFromFetch = C.sourceWAD == SOURCE_WAD.FETCH;


const dirCacheAsset = resolve(dirCache, 'asset');


const detectNeedFetch = ({ file }) => {
	const isExist = existsSync(file);

	if(isSourceFromClient && !isExist) {
		throw Error(T('error:clientFileNotExist', { file }));
	}

	return isSourceFromFetch || !isExist;
};



export default function initWADInfo() {
	const nameWADChampionDefault = `${I.slot}.wad.client`.toLowerCase();
	const fileWADChampionDefault = resolve(
		isSourceFromClient ? C.path.dirGameVoice : dirCacheAsset,
		nameWADChampionDefault
	);

	const nameWADChampionLocale = `${I.slot}.${C.lang}.wad.client`.toLowerCase();
	const fileWADChampionLocale = resolve(
		isSourceFromClient ? C.path.dirGameVoice : dirCacheAsset,
		nameWADChampionLocale
	);


	try {
		const wadsNeedFetch = [
			{ name: nameWADChampionDefault, file: fileWADChampionDefault },
			{ name: nameWADChampionLocale, file: fileWADChampionLocale },
		].filter(detectNeedFetch);

		G.info(T('where:Main'), T('initWADInfo:do'), '✔ ', ...wadsNeedFetch.map(({ name }) => T('initWADInfo:item', { name })));

		return { fileWADChampionDefault, fileWADChampionLocale, wadsNeedFetch };
	}
	catch(error) {
		G.fatalE(2, T('where:Main'), T('initWADInfo:do'), error);
	}
}

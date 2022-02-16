import { existsSync } from 'fs';
import { resolve } from 'path';

import { SOURCE_WAD } from '../../lib/constant.js';
import { dirCache } from '../../lib/global.dir.js';
import { C, I, G, TT } from '../../lib/global.js';


const isSourceFromClient = C.sourceWAD == SOURCE_WAD.CLIENT;
const isSourceFromFetch = C.sourceWAD == SOURCE_WAD.FETCH;


const dirCacheAsset = resolve(dirCache, 'asset');


const detectNeedFetch = ({ file }) => {
	const isExist = existsSync(file);

	if(isSourceFromClient && !isExist) {
		throw Error(TT('error:clientFileNotExist', { file }));
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

		G.info(TT('where:Main'), TT('initWADInfo:do'), '✔', ...wadsNeedFetch.map(({ name }) => TT('initWADInfo:item', { name })));

		return { fileWADChampionDefault, fileWADChampionLocale, wadsNeedFetch };
	}
	catch(error) {
		G.fatalE(2, TT('where:Main'), TT('initWADInfo:do'), error);
	}
}
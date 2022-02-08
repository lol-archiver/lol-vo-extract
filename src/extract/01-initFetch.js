import { existsSync } from 'fs';
import { resolve } from 'path';
import { SOURCE_WAD } from '../../lib/constant.js';

import { dirCache } from '../../lib/global.dir.js';
import { C, I, G } from '../../lib/global.js';


const useFileFromClient = C.useWADLevel == SOURCE_WAD.CLIENT;

const detectFetch = (nameWAD, pathWAD) => {
	const isFileExist = existsSync(pathWAD);

	if(!isFileExist && useFileFromClient) {
		throw Error(`Use Client Wad. But Wad[${pathWAD}] doesn't exist`);
	}
	else if(C.sourceWAD == SOURCE_WAD.FETCH || !isFileExist) {
		return([nameWAD, pathWAD]);
	}
};


const dirCacheAsset = resolve(dirCache, 'asset');


export default function initWADInfo() {
	const nameWADChampionDefault = `${I.slot}.wad.client`.toLowerCase();
	const fileWADChampionDefault = resolve(
		useFileFromClient ? C.path.dirGameVoice : dirCacheAsset,
		nameWADChampionDefault
	);

	const nameWADChampionLocale = `${I.slot}.${C.lang}.wad.client`.toLowerCase();
	const fileWADChampionLocale = resolve(
		useFileFromClient ? C.path.dirGameVoice : dirCacheAsset,
		nameWADChampionLocale
	);


	const wadsToFetch = [];

	wadsToFetch.push(...(detectFetch(nameWADChampionLocale, fileWADChampionLocale) ?? []));
	wadsToFetch.push(...(detectFetch(nameWADChampionDefault, fileWADChampionDefault) ?? []));


	G.info('FetchIniter', `fetch info`, '✔ ', ...wadsToFetch.map(i => `file~{${i[0]}}`));


	return { fileWADChampionDefault, fileWADChampionLocale, wadsToFetch };
}
import { existsSync } from 'fs';
import { resolve } from 'path';

import { G, I, C, dirApp } from '../../lib/global.js';


const detectFetch = function(wadsToFetch, nameWad, pathWad, isUseClient) {
	const isExist = existsSync(pathWad);

	if(isUseClient && !isExist) {
		throw `Use Client Wad. But Wad[${pathWad}] doesn't exist`;
	}
	else if(C.useWADLevel == 1 || !isExist) {
		wadsToFetch.push([nameWad, pathWad]);
	}
};

const nameWadVoice = `${I.slot}.${C.lang}.wad.client`.toLowerCase();
const nameWadChamp = `${I.slot}.wad.client`.toLowerCase();

const isUseClient = C.useWADLevel == 2 && C.path.gameVoices;

const pathWadVoice = isUseClient ?
	resolve(C.path.gameVoices, nameWadVoice) :
	resolve(dirApp, '_cache', 'assets', nameWadVoice);
const pathWadChamp = isUseClient ?
	resolve(C.path.gameVoices, nameWadChamp) :
	resolve(dirApp, '_cache', 'assets', nameWadChamp);

const wadsToFetch = [];

detectFetch(wadsToFetch, nameWadVoice, pathWadVoice, isUseClient);
detectFetch(wadsToFetch, nameWadChamp, pathWadChamp, isUseClient);

G.info('FetchIniter', `init`, '✔ ');


export { pathWadVoice, pathWadChamp, wadsToFetch, };
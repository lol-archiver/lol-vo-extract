import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import Axios from 'axios';

import { dirCache } from '../../lib/global.dir.js';
import { C, G, TT } from '../../lib/global.js';


export default async function fetchManifest(id, url, nameFile) {
	const file = resolve(dirCache, 'manifest', nameFile);

	if(existsSync(file)) {
		G.debugD(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:cached'));

		return readFileSync(file);
	}

	G.debugU(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:ing', { url }));

	const { data: bufferManifest } = await Axios.get(url, { responseType: 'arraybuffer', proxy: C.proxy, timeout: 1000 * 60 * 4 });

	writeFileSync(file, bufferManifest);

	G.debugD(TT('fetchManifest:where'), TT('fetchManifest:do', { id }), TT('fetchManifest:ok', { size: bufferManifest.length }));

	return bufferManifest;
}
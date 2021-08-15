import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, parse } from 'path';

import Axios from 'axios';

import { C, G } from '../../lib/global.js';


export default async function fetchManifest(urlManifest, version) {
	const idManifest = parse(urlManifest).name;

	const pathManifest = join('./_cache/manifest', `${version}-${idManifest}.manifest`);

	if(existsSync(pathManifest)) {
		G.info('ManifestFetcher', 'detect', `manifest[${idManifest}] exists a cache, use cache first`);

		return readFileSync(pathManifest);
	}
	else {
		G.info('ManifestFetcher', 'detect' `will fetch manifest[${idManifest}] from [${urlManifest}]`);

		try {
			const bufferManifest = (await Axios.get(urlManifest, { responseType: 'arraybuffer', proxy: C.proxy, timeout: 1000 * 60 * 4 })).data;

			writeFileSync(pathManifest, bufferManifest);

			G.info('ManifestFetcher', `manifest[${idManifest}] fetched, saved at [${pathManifest}], size [${bufferManifest.length}]`);

			return bufferManifest;
		}
		catch(error) {
			G.info('ManifestFetcher', `manifest[${idManifest}] fetch error [${error.message || error}]`);

			process.exit(1);
		}
	}
}
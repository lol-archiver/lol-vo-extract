import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, parse } from 'path';

import Axios from 'axios';

import { C, G } from '../../lib/global.js';


export default async function fetchManifest(urlManifest, version) {
	const idManifest = parse(urlManifest).name;

	const pathManifest = join('./_cache/manifest', `${version}-${idManifest}.manifest`);

	if(existsSync(pathManifest)) {
		G.infoD('ManifestFetcher', `fetch [manifest]~{${idManifest}}`, `cache founded`);

		return readFileSync(pathManifest);
	}
	else {
		G.infoU('ManifestFetcher', `fetch [manifest]~{${idManifest}}`, 'fetching...', `url~{${urlManifest}}`);

		try {
			const bufferManifest = (await Axios.get(urlManifest, { responseType: 'arraybuffer', proxy: C.proxy, timeout: 1000 * 60 * 4 })).data;

			writeFileSync(pathManifest, bufferManifest);
			G.infoD('ManifestFetcher', `fetch [manifest]~{${idManifest}}`, '✔ ', `save at~{${pathManifest}} size~{${bufferManifest.length}}`);

			return bufferManifest;
		}
		catch(error) {
			G.errorD('ManifestFetcher', `fetch [manifest]~{${idManifest}}`, error);

			process.exit(1);
		}
	}
}
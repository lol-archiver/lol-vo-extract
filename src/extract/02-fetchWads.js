import { C, G, IT } from '../../lib/global.js';

import fetchEntry from '../fetcher/entry.js';
import fetchManifest from '../fetcher/manifest.js';

import Manifest from '../entry/manifest/Manifest.js';

import RmanParser from '../parser/manifest/rman.js';
import BodyParser from '../parser/manifest/body.js';


export default async function fetchWADs(wadsNeedFetch) {
	if(!wadsNeedFetch.length) { return; }


	const [urlManifests, versionLatest] = await fetchEntry();

	const buffersManifest = await Promise.all(urlManifests.map(urlManifest => fetchManifest(urlManifest, versionLatest)));

	const manifests = urlManifests.map((urlManifest, index) => new Manifest(urlManifest, versionLatest, buffersManifest[index]));

	await RmanParser(manifests);
	await BodyParser(manifests);

	const files = manifests.reduce((acc, manifest) => acc.concat(Object.values(manifest.files)), []);

	const filesFetched = [];

	for(const file of files) {
		for(const { name: nameFile, file: pathFile } of wadsNeedFetch) {
			if(file.name.toLowerCase().endsWith(nameFile)) {
				filesFetched.push(await file.extract(versionLatest, C.server.cdn, pathFile));

				break;
			}
		}
	}

	G.info(IT('where:Main'), IT('fetchWADs:do'), '✔ ');

	return filesFetched;
}